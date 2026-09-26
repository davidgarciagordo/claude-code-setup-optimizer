import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { WM, tempRepo, tempDir, write, forge, hook } from './helpers.mjs';

const HOOK = path.join(WM, 'hooks', 'guard-forge-artifacts.py');
const spine = JSON.parse(forge(process.cwd(), 'phases', '--json').out);

function addArtifacts(repo, dir, names, { stage = true } = {}) {
  for (const a of names) write(repo, path.join(dir, a), `# ${a}\n`);
  if (stage) execFileSync('git', ['-C', repo, 'add', '.']);
}

test('phases: canonical spine order, draft grilled before spec', () => {
  assert.deepEqual(spine.phases.map((p) => p.id), [
    'align', 'reference-decomposition', 'draft', 'grill', 'checkpoint-1', 'spec',
    'regrill', 'checkpoint-2', 'plan', 'execute', 'verify', 'handoff',
  ]);
});

test('phases: every gate-in artifact is produced by an earlier phase', () => {
  const produced = new Set();
  for (const p of spine.phases) {
    for (const a of p.gateIn) assert.ok(produced.has(a), `${p.id} needs ${a} before anything produces it`);
    p.produces.forEach((a) => produced.add(a));
  }
  for (const a of spine.preMergeArtifacts) assert.ok(produced.has(a), `pre-merge ${a} is never produced`);
});

test('init: writes an active manifest and refuses a second active run', () => {
  const repo = tempRepo();
  assert.equal(forge(repo, 'init', 'Build the thing').code, 0);
  const m = JSON.parse(fs.readFileSync(path.join(repo, 'docs/forge/build-the-thing/run.json'), 'utf8'));
  assert.equal(m.status, 'active');
  assert.deepEqual(m.phasesEntered, ['align']);
  assert.equal(forge(repo, 'init', 'Another').code, 2);
});

test('init: --slug is sanitised and cannot escape docs/forge/', () => {
  const repo = tempRepo();
  assert.equal(forge(repo, 'init', 'x', '--slug=../../evil').code, 0);
  assert.ok(fs.existsSync(path.join(repo, 'docs/forge/evil/run.json')));
  assert.ok(!fs.existsSync(path.join(repo, '..', 'evil')));
});

test('advance: enforces phase order and artifact gates', () => {
  const repo = tempRepo();
  forge(repo, 'init', 'order');
  assert.equal(forge(repo, 'advance', 'draft').code, 2, 'skipping a phase must fail');
  assert.equal(forge(repo, 'advance', 'reference-decomposition').code, 2, 'intent.md missing');
  addArtifacts(repo, 'docs/forge/order', ['intent.md'], { stage: false });
  assert.equal(forge(repo, 'advance', 'reference-decomposition').code, 0);
  assert.equal(forge(repo, 'gate', 'draft').code, 2);
});

test('status: prints no git noise outside a repo', () => {
  const r = forge(tempDir(), 'status');
  assert.equal(r.code, 0);
  assert.doesNotMatch(r.err, /fatal/);
});

test('check-pr: no run → 0; corrupt manifest → 2', () => {
  const repo = tempRepo();
  assert.equal(forge(repo, 'check-pr').code, 0);
  write(repo, 'docs/forge/a/run.json', '{broken');
  const r = forge(repo, 'check-pr');
  assert.equal(r.code, 2);
  assert.match(r.err, /unreadable/);
});

test('check-pr: blocks on missing, empty or untracked artifacts; passes when tracked', () => {
  const repo = tempRepo();
  forge(repo, 'init', 'gate');
  const dir = 'docs/forge/gate';
  assert.equal(forge(repo, 'check-pr').code, 2, 'nothing produced yet');

  addArtifacts(repo, dir, spine.preMergeArtifacts, { stage: false });
  assert.equal(forge(repo, 'check-pr').code, 2, 'present on disk but untracked');

  execFileSync('git', ['-C', repo, 'add', '.']);
  assert.equal(forge(repo, 'check-pr').code, 0);

  fs.writeFileSync(path.join(repo, dir, 'plan.md'), '');
  assert.equal(forge(repo, 'check-pr').code, 2, 'empty artifact');
});

test('check-pr: ignores a preMergeArtifacts list edited in run.json', () => {
  const repo = tempRepo();
  forge(repo, 'init', 'tamper');
  const m = path.join(repo, 'docs/forge/tamper/run.json');
  const j = JSON.parse(fs.readFileSync(m, 'utf8'));
  fs.writeFileSync(m, JSON.stringify({ ...j, preMergeArtifacts: [] }));
  assert.equal(forge(repo, 'check-pr').code, 2);
});

test('complete: the gate stops enforcing a completed run', () => {
  const repo = tempRepo();
  forge(repo, 'init', 'done');
  assert.equal(forge(repo, 'complete').code, 0);
  assert.equal(forge(repo, 'check-pr').code, 0);
});

test('guard-forge-artifacts hook: exit-code branches', () => {
  const repo = tempRepo();
  const env = { CLAUDE_PLUGIN_ROOT: WM };
  const pr = { tool_input: { command: 'gh pr create --fill' } };
  assert.equal(hook(HOOK, { tool_input: { command: 'git push' } }, { cwd: repo, env }).code, 0, 'not a PR command');
  assert.equal(hook(HOOK, pr, { cwd: repo, env }).code, 0, 'no active run');

  write(repo, 'docs/forge/a/run.json', '{broken');
  assert.equal(hook(HOOK, pr, { cwd: repo, env }).code, 2, 'corrupt manifest blocks');
  assert.equal(hook(HOOK, pr, { cwd: repo, env: { ...env, FORGE_ENFORCE: 'warn' } }).code, 0, 'warn mode');
  assert.equal(hook(HOOK, pr, { cwd: repo, env: { ...env, FORGE_ENFORCE: 'off' } }).code, 0, 'off mode');
});
