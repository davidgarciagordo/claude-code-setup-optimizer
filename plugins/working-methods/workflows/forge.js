#!/usr/bin/env node
/**
 * forge.js — deterministic state machine + single source of truth for the
 * Forge run spine (`/forge-run`). The phase ORDER and the gate ARTIFACTS live
 * here, in code — not in prose a human has to remember. The `/forge-run`
 * command drives this; the `guard-forge-artifacts` hook reads the manifest it
 * writes (so the enforcement and the orchestration never drift apart).
 *
 * No dependencies. Node >= 14.
 *
 * Usage:
 *   node forge.js phases [--json]        # print the ordered phases (the spine)
 *   node forge.js init "<task>" [--slug=x]   # run dir is ALWAYS docs/forge/<slug>/
 *   node forge.js status                 # active run: current phase + gate state
 *   node forge.js gate <phaseId>         # can we ENTER this phase? exit 0 ok / 2 blocked
 *   node forge.js advance <phaseId>      # record that we entered <phaseId> (gates must pass)
 *   node forge.js check-pr               # pre-PR/pre-merge artifacts present? exit 0 / 2
 *   node forge.js complete               # mark active run complete (hook stops enforcing it)
 */
'use strict';

const fs = require('fs');
const path = require('path');
const cp = require('child_process');

/* ── The spine: phase order + gate artifacts (SINGLE SOURCE OF TRUTH) ──────── */
// gateIn  = artifacts that MUST already exist to legitimately ENTER this phase.
// produces = artifacts this phase is expected to version into the run dir.
// invokes = the Claude Code command / skill / agent the phase drives.
// Order mirrors the canonical forge-methodology loop: the DRAFT is grilled
// BEFORE the spec (attack when changing is cheap), and the owner is interrupted
// exactly TWICE (checkpoint-1 after the draft grill, checkpoint-2 after the
// re-grill locks the spec) — both as ONE multi-select batch with the
// orchestrator's recommendations pre-marked.
const PHASES = [
  { id: 'align', title: 'Align intent + brainstorm',
    invokes: 'superpowers:brainstorming + value question (one batch)',
    gateIn: [], produces: ['intent.md'] },
  { id: 'reference-decomposition', title: 'Reference decomposition (req-ids)',
    invokes: 'reference-decomposer → enumerated Reference Standard',
    gateIn: ['intent.md'], produces: ['references.md'] },
  { id: 'draft', title: 'Draft (concrete design sketch — cheap to change)',
    invokes: 'orchestrator writes the chosen approach as a concrete draft',
    gateIn: ['references.md'], produces: ['draft.md'] },
  { id: 'grill', title: 'Grill ×3 + completeness lens ON THE DRAFT',
    invokes: '/grill  (architect · operator · engineer · completeness)',
    gateIn: ['draft.md'], produces: ['grill-verdicts.md'] },
  { id: 'checkpoint-1', title: 'Owner checkpoint #1 (one multi-select batch)',
    invokes: 'AskUserQuestion multiSelect — grill decisions, recommendations pre-marked',
    gateIn: ['grill-verdicts.md'], produces: ['decisions-1.md'] },
  { id: 'spec', title: 'Versioned spec (Acceptance Matrix = canonical DoD)',
    invokes: 'forge-methodology spec template (draft + verdicts + owner decisions)',
    gateIn: ['decisions-1.md'], produces: ['spec.md', 'acceptance-matrix.md'] },
  { id: 'regrill', title: 'Re-grill ×2 (do the fixes hold? + new seams)',
    invokes: '/grill focused ×2 on the SPEC (regression + novelty, not a 3rd full grill)',
    gateIn: ['spec.md', 'acceptance-matrix.md'], produces: ['regrill-verdicts.md'] },
  { id: 'checkpoint-2', title: 'Owner checkpoint #2 (spec locked after this)',
    invokes: 'AskUserQuestion multiSelect — cut lines / phasing / budget, recommendations pre-marked',
    gateIn: ['regrill-verdicts.md'], produces: ['decisions-2.md'] },
  { id: 'plan', title: 'Global plan + execution proposal (multi-agent by default)',
    invokes: 'superpowers:writing-plans + execution proposal (worktrees · context pack · model per unit)',
    gateIn: ['decisions-2.md'], produces: ['plan.md', 'execution-proposal.md'] },
  { id: 'execute', title: 'Execution (isolated worktrees + ONE shared context pack)',
    invokes: 'forge-on-claude (git worktrees · subagents · context pack)',
    gateIn: ['spec.md', 'acceptance-matrix.md', 'plan.md', 'execution-proposal.md'],
    produces: ['context-pack.md'] },
  { id: 'verify', title: 'Verify (matrix, not diff: reviewers + completeness-critic + design-review if UI)',
    invokes: 'independent-verifier · completeness-critic · design-review (on UI diff)',
    gateIn: ['acceptance-matrix.md', 'plan.md'], produces: ['verify.md'] },
  { id: 'handoff', title: 'Handoff (owner sign-off recorded)',
    invokes: '/handoff',
    gateIn: ['verify.md'], produces: ['handoff.md'] },
];

// Artifacts that must be versioned BEFORE a PR / merge is allowed. The
// enforcement hook reads this list off the manifest (written at init).
const PRE_MERGE_ARTIFACTS = [
  'spec.md', 'acceptance-matrix.md',
  'grill-verdicts.md', 'decisions-1.md',
  'regrill-verdicts.md', 'decisions-2.md',
  'plan.md',
];

/* ── helpers ───────────────────────────────────────────────────────────────── */
function gitRoot() {
  try {
    return cp.execSync('git rev-parse --show-toplevel', { encoding: 'utf8' }).trim();
  } catch (_) {
    return process.cwd();
  }
}

function slugify(s) {
  return String(s)
    .toLowerCase()
    .normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'run';
}

function arg(flag) {
  const hit = process.argv.find((a) => a.startsWith(flag + '='));
  return hit ? hit.slice(flag.length + 1) : null;
}

function findManifest(root) {
  const env = process.env.FORGE_RUN_MANIFEST;
  if (env) {
    const p = path.isAbsolute(env) ? env : path.join(root, env);
    return fs.existsSync(p) ? p : null;
  }
  const base = path.join(root, 'docs', 'forge');
  if (!fs.existsSync(base)) return null;
  const found = [];
  for (const d of fs.readdirSync(base)) {
    const m = path.join(base, d, 'run.json');
    if (fs.existsSync(m)) found.push(m);
  }
  // newest active run wins
  const active = found
    .map((m) => ({ m, j: readJson(m) }))
    .filter((x) => x.j && x.j.status === 'active')
    .sort((a, b) => String(b.j.createdAt).localeCompare(String(a.j.createdAt)));
  return active.length ? active[0].m : null;
}

function readJson(p) {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch (_) { return null; }
}

function nonEmpty(p) {
  try { return fs.statSync(p).size > 0; } catch (_) { return false; }
}

function phase(id) { return PHASES.find((p) => p.id === id); }

/* ── commands ──────────────────────────────────────────────────────────────── */
function cmdPhases() {
  if (process.argv.includes('--json')) {
    process.stdout.write(JSON.stringify({ phases: PHASES, preMergeArtifacts: PRE_MERGE_ARTIFACTS }, null, 2) + '\n');
    return 0;
  }
  console.log('Forge run spine — codified order (gates are machine-checked):\n');
  PHASES.forEach((p, i) => {
    console.log(`  ${i + 1}. ${p.id}  —  ${p.title}`);
    console.log(`       invokes : ${p.invokes}`);
    if (p.gateIn.length) console.log(`       gate-in : needs ${p.gateIn.join(', ')}`);
    if (p.produces.length) console.log(`       produces: ${p.produces.join(', ')}`);
  });
  console.log(`\n  Pre-PR / pre-merge gate: ${PRE_MERGE_ARTIFACTS.join(', ')} must exist & be non-empty.`);
  return 0;
}

function cmdInit(task) {
  if (!task) { console.error('forge init: missing "<task>"'); return 2; }
  const root = gitRoot();
  // Reject if an active run already exists (would orphan it)
  const existingManifest = findManifest(root);
  if (existingManifest) {
    const ej = readJson(existingManifest);
    const slug = ej ? ej.slug : '?';
    const dir  = ej ? ej.dir  : '?';
    console.error(`forge init: an active run "${slug}" already exists at ${dir}/run.json. ` +
      'Complete it first ("node forge.js complete") or set FORGE_RUN_MANIFEST to override.');
    return 2;
  }
  const slug = arg('--slug') || slugify(task);
  // The run dir is ALWAYS docs/forge/<slug>/ — findManifest() only scans there,
  // so a configurable dir would silently disarm status/check-pr (the old --dir bug).
  const relDir = path.join('docs', 'forge', slug);
  const dir = path.join(root, relDir);
  fs.mkdirSync(dir, { recursive: true });
  const manifest = {
    slug,
    task,
    dir: relDir,
    status: 'active',
    phase: PHASES[0].id,
    // init IS entering the first phase — otherwise the very first `advance`
    // (to PHASES[1]) is rejected because its predecessor was "never entered".
    phasesEntered: [PHASES[0].id],
    preMergeArtifacts: PRE_MERGE_ARTIFACTS,
    createdAt: new Date().toISOString(),
  };
  fs.writeFileSync(path.join(dir, 'run.json'), JSON.stringify(manifest, null, 2) + '\n');
  console.log(`Forge run initialised: ${relDir}/`);
  console.log(`  manifest: ${relDir}/run.json (status=active, phase=${manifest.phase})`);
  console.log(`  the guard-forge-artifacts hook will now block a PR until ${PRE_MERGE_ARTIFACTS.join(', ')} exist.`);
  console.log(`  next: produce ${PHASES[0].produces.join(', ')}, then \`node forge.js advance ${PHASES[1].id}\``);
  return 0;
}

function cmdStatus() {
  const root = gitRoot();
  const m = findManifest(root);
  if (!m) { console.log('No active Forge run (docs/forge/*/run.json). Start one: node forge.js init "<task>"'); return 0; }
  const j = readJson(m);
  const dir = path.join(root, j.dir);
  console.log(`Active run: ${j.slug}  (phase=${j.phase}, status=${j.status})`);
  console.log(`Task: ${j.task}`);
  console.log('\nArtifacts:');
  const seen = new Set();
  PHASES.forEach((p) => p.produces.forEach((a) => {
    if (seen.has(a)) return; seen.add(a);
    const ok = nonEmpty(path.join(dir, a));
    console.log(`  [${ok ? 'x' : ' '}] ${a}`);
  }));
  const cur = PHASES.findIndex((p) => p.id === j.phase);
  const next = PHASES[cur + 1];
  if (next) {
    const r = gateState(dir, next);
    console.log(`\nNext phase: ${next.id} — ${next.title}`);
    if (r.missing.length) console.log(`  gate BLOCKED — missing: ${r.missing.join(', ')}`);
    else console.log('  gate OPEN — you may advance.');
  } else {
    console.log('\nLast phase reached. When done: node forge.js complete');
  }
  return 0;
}

function gateState(dir, p) {
  const missing = p.gateIn.filter((a) => !nonEmpty(path.join(dir, a)));
  return { ok: missing.length === 0, missing };
}

function cmdGate(id) {
  const p = phase(id);
  if (!p) { console.error(`forge gate: unknown phase "${id}". Phases: ${PHASES.map((x) => x.id).join(', ')}`); return 2; }
  const root = gitRoot();
  const m = findManifest(root);
  if (!m) { console.error('forge gate: no active run. Run: node forge.js init "<task>"'); return 2; }
  const j = readJson(m); // parse ONCE
  const dir = path.join(root, j.dir);
  const r = gateState(dir, p);
  if (r.ok) { console.log(`gate ${id}: OPEN`); return 0; }
  console.error(`gate ${id}: BLOCKED — produce first: ${r.missing.map((a) => path.join(j.dir, a)).join(', ')}`);
  return 2;
}

function cmdAdvance(id) {
  const p = phase(id);
  if (!p) { console.error(`forge advance: unknown phase "${id}"`); return 2; }
  const root = gitRoot();
  const m = findManifest(root);
  if (!m) { console.error('forge advance: no active run.'); return 2; }
  const j = readJson(m);
  const dir = path.join(root, j.dir);

  // Phase ORDER gate: predecessor phase must have been entered first
  const phIdx = PHASES.findIndex((ph) => ph.id === id);
  if (phIdx > 0) {
    const predecessor = PHASES[phIdx - 1].id;
    const entered = Array.isArray(j.phasesEntered) ? j.phasesEntered : [];
    if (!entered.includes(predecessor)) {
      console.error(`Cannot advance to "${id}": phase "${predecessor}" must be entered first (phase order). ` +
        `Run: node forge.js advance ${predecessor}`);
      return 2;
    }
  }

  // Artifact gate: required inputs must exist
  const r = gateState(dir, p);
  if (!r.ok) { console.error(`Cannot advance to ${id}: gate BLOCKED — missing ${r.missing.join(', ')}`); return 2; }

  // Record the advance
  if (!Array.isArray(j.phasesEntered)) j.phasesEntered = [];
  if (!j.phasesEntered.includes(id)) j.phasesEntered.push(id);
  j.phase = id;
  j.updatedAt = new Date().toISOString();
  fs.writeFileSync(m, JSON.stringify(j, null, 2) + '\n');
  console.log(`Advanced to phase: ${id}`);
  return 0;
}

function cmdCheckPr() {
  // Mirrors the hook, for manual / CI use. Exit 2 if the active run is missing
  // any pre-merge artifact; exit 0 if there is no active run (nothing to govern).
  const root = gitRoot();
  const m = findManifest(root);
  if (!m) { console.log('check-pr: no active Forge run — nothing to enforce.'); return 0; }
  const j = readJson(m);
  if (!j) { console.error('check-pr: manifest unreadable — refusing to vouch (fail-closed).'); return 2; }
  const dir = path.join(root, j.dir);
  const required = j.preMergeArtifacts || PRE_MERGE_ARTIFACTS;
  const missing = required.filter((a) => !nonEmpty(path.join(dir, a)));
  if (missing.length) {
    console.error(`check-pr: BLOCKED — versioned artifacts missing for run "${j.slug}": ${missing.map((a) => path.join(j.dir, a)).join(', ')}`);
    return 2;
  }
  console.log(`check-pr: OK — ${required.join(', ')} present for run "${j.slug}".`);
  return 0;
}

function cmdComplete() {
  const root = gitRoot();
  const m = findManifest(root);
  if (!m) { console.log('complete: no active run.'); return 0; }
  const j = readJson(m);
  j.status = 'complete';
  j.completedAt = new Date().toISOString();
  fs.writeFileSync(m, JSON.stringify(j, null, 2) + '\n');
  console.log(`Run "${j.slug}" marked complete. The PR gate no longer enforces it.`);
  return 0;
}

/* ── dispatch ──────────────────────────────────────────────────────────────── */
const sub = process.argv[2];
const rest = process.argv.slice(3).filter((a) => !a.startsWith('--'));
let code = 0;
switch (sub) {
  case 'phases': code = cmdPhases(); break;
  case 'init': code = cmdInit(rest[0]); break;
  case 'status': code = cmdStatus(); break;
  case 'gate': code = cmdGate(rest[0]); break;
  case 'advance': code = cmdAdvance(rest[0]); break;
  case 'check-pr': code = cmdCheckPr(); break;
  case 'complete': code = cmdComplete(); break;
  default:
    console.error('forge.js — usage: phases | init "<task>" | status | gate <phase> | advance <phase> | check-pr | complete');
    code = 2;
}
process.exit(code);
