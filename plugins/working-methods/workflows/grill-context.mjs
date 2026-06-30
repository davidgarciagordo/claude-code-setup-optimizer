#!/usr/bin/env node
/**
 * grill-context.mjs — deterministic grill context-pack assembler.
 * No external deps. Node >= 14 (ESM via .mjs).
 *
 * Usage:
 *   node grill-context.mjs <artifact> [--root <dir>] [--out <path>]
 *
 * Writes a context-pack to <out> (default: .forge/grill-context.md) with:
 *   1. Target artifact content
 *   2. Repo map  — file:line of rule/precedent/ADR anchors relevant to the target
 *   3. Empty SHARED-FOUND section  — the orchestrator fills this before dispatching lenses
 *
 * Deterministic: no Date.now / Math.random. Output is stable for the same inputs.
 */

import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';

/* ── helpers ──────────────────────────────────────────────────────────────── */

function die(msg) { process.stderr.write(`grill-context: ${msg}\n`); process.exit(2); }

function arg(flag) {
  const i = process.argv.indexOf(flag);
  if (i !== -1 && process.argv[i + 1] && !process.argv[i + 1].startsWith('--')) {
    return process.argv[i + 1];
  }
  const hit = process.argv.find((a) => a.startsWith(flag + '='));
  return hit ? hit.slice(flag.length + 1) : null;
}

function gitRoot(from) {
  try {
    return execFileSync('git', ['-C', from, 'rev-parse', '--show-toplevel'],
      { encoding: 'utf8', timeout: 8000 }).trim();
  } catch (_) { return from; }
}

function gitLsFiles(root) {
  try {
    return execFileSync('git', ['-C', root, 'ls-files'],
      { encoding: 'utf8', timeout: 15000 }).trim().split('\n').filter(Boolean);
  } catch (_) { return []; }
}

function grepLines(root, files, pattern) {
  /** Returns [{file, line, text}] for matches — safe, no shell injection. */
  const results = [];
  const re = new RegExp(pattern, 'i');
  for (const rel of files) {
    const abs = path.join(root, rel);
    let content;
    try { content = fs.readFileSync(abs, 'utf8'); } catch (_) { continue; }
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (re.test(lines[i])) {
        results.push({ file: rel, line: i + 1, text: lines[i].trim() });
      }
    }
  }
  return results;
}

function readSafe(abs) {
  try { return fs.readFileSync(abs, 'utf8'); } catch (_) { return null; }
}

/** Extract 3-8 keyword tokens from the artifact path and first ~80 lines of content. */
function extractKeywords(artifactPath, content) {
  const fromPath = path.basename(artifactPath, path.extname(artifactPath))
    .split(/[-_./\s]+/).filter((w) => w.length > 3);
  const firstLines = content.split('\n').slice(0, 80).join(' ');
  // grab capitalized words and words after ## headings as domain terms
  const fromContent = (firstLines.match(/##\s+(\S+)|`([^`]{4,})`|\b([A-Z][a-z]{3,})\b/g) || [])
    .map((m) => m.replace(/^##\s+|`/g, '').trim().toLowerCase())
    .filter((w) => w.length > 3 && !['this', 'that', 'with', 'from', 'your', 'will', 'must', 'have', 'each', 'when', 'then', 'they', 'their'].includes(w));
  const all = [...new Set([...fromPath.map((w) => w.toLowerCase()), ...fromContent])];
  return all.slice(0, 8);
}

/** Canonical anchor patterns that are always included in the repo map. */
const ANCHOR_GLOBS = [
  /^CLAUDE\.md$/i,
  /^docs\/adr\//,
  /^docs\/ESTADO\.md$/i,
  /^docs\/ROADMAP\.md$/i,
  /^docs\/design\.md$/i,
  /^\.claude\/settings\.json$/,
  /^packages\/contracts\//,
];

function isAnchor(rel) { return ANCHOR_GLOBS.some((re) => re.test(rel)); }

function formatRepoMap(anchorMatches) {
  if (!anchorMatches.length) return '_No relevant anchors found via git ls-files._\n';
  const byFile = {};
  for (const { file, line, text } of anchorMatches) {
    if (!byFile[file]) byFile[file] = [];
    byFile[file].push({ line, text });
  }
  return Object.entries(byFile)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([file, hits]) => {
      const lines = hits.slice(0, 4)
        .map(({ line, text }) => `  ${file}:${line}  ${text.slice(0, 100)}`)
        .join('\n');
      return lines;
    })
    .join('\n');
}

/* ── main ─────────────────────────────────────────────────────────────────── */

const artifactArg = process.argv[2];
if (!artifactArg || artifactArg.startsWith('--')) {
  process.stdout.write(
    'Usage: node grill-context.mjs <artifact> [--root <dir>] [--out <path>]\n' +
    '  <artifact>  path to the spec/plan/design to grill\n' +
    '  --root      repo root (default: git root of cwd)\n' +
    '  --out       output path (default: .forge/grill-context.md)\n'
  );
  process.exit(0);
}

const rootArg = arg('--root');
const outArg  = arg('--out') || '.forge/grill-context.md';

const cwd  = process.cwd();
const root = rootArg ? path.resolve(rootArg) : gitRoot(cwd);

const artifactAbs = path.isAbsolute(artifactArg) ? artifactArg : path.resolve(cwd, artifactArg);
if (!fs.existsSync(artifactAbs)) die(`artifact not found: ${artifactAbs}`);

const artifactContent = readSafe(artifactAbs);
if (artifactContent === null) die(`cannot read artifact: ${artifactAbs}`);
const artifactRel = path.relative(root, artifactAbs);

// Scan the repo file list once
const allFiles = gitLsFiles(root);

// Split files into anchors (always include) and others (keyword-search only)
const anchorFiles = allFiles.filter(isAnchor);
const otherFiles  = allFiles.filter((f) => !isAnchor(f));

// Build keyword pattern from the artifact
const keywords = extractKeywords(artifactArg, artifactContent);
const keywordPattern = keywords.length ? keywords.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') : null;

// Gather anchor hits (first meaningful line per anchor file)
const anchorHits = [];
for (const rel of anchorFiles) {
  const abs = path.join(root, rel);
  const txt = readSafe(abs);
  if (!txt) continue;
  const lines = txt.split('\n');
  // find first non-empty, non-comment line
  const firstMeaningful = lines.findIndex((l) => l.trim() && !l.trim().startsWith('#'));
  const lineNo = firstMeaningful >= 0 ? firstMeaningful + 1 : 1;
  anchorHits.push({ file: rel, line: lineNo, text: lines[lineNo - 1]?.trim() || '' });
}

// Keyword grep in remaining files (capped at 40 distinct files, 3 hits per file)
const keywordHits = [];
if (keywordPattern) {
  const matched = grepLines(root, otherFiles, keywordPattern);
  const byFile = {};
  for (const h of matched) {
    if (!byFile[h.file]) byFile[h.file] = [];
    if (byFile[h.file].length < 3) byFile[h.file].push(h);
  }
  const topFiles = Object.keys(byFile).slice(0, 40);
  for (const f of topFiles) keywordHits.push(...byFile[f]);
}

const allHits = [...anchorHits, ...keywordHits];

// Ensure output directory exists
const outAbs = path.isAbsolute(outArg) ? outArg : path.resolve(cwd, outArg);
fs.mkdirSync(path.dirname(outAbs), { recursive: true });

/* ── write the pack ──────────────────────────────────────────────────────── */

const pack = `# Grill Context Pack
## Target artifact
\`\`\`
${artifactRel}
\`\`\`

### Content
${artifactContent}

---

## Repo map  (file:line of rules / precedents / invariants)
Anchors always included: ADRs, CLAUDE.md, contracts, design docs.
Domain keywords extracted from artifact: ${keywords.join(', ') || '(none)'}

${formatRepoMap(allHits)}

---

## SHARED-FOUND
<!-- The orchestrator fills this section with findings from the Gate-A before dispatching lenses.
     Lenses must NOT re-report what is already listed here. -->
`;

fs.writeFileSync(outAbs, pack, 'utf8');
process.stdout.write(`grill-context: wrote ${path.relative(cwd, outAbs)}\n`);
process.stdout.write(`  artifact : ${artifactRel}\n`);
process.stdout.write(`  anchors  : ${anchorFiles.length} files\n`);
process.stdout.write(`  keywords : ${keywords.join(', ') || '(none)'}\n`);
process.stdout.write(`  hits     : ${allHits.length} file:line entries\n`);
