#!/usr/bin/env node
/**
 * scan.mjs — deterministic repo context-pack for optimize-my-setup.
 * No external deps. Node >= 14 (ESM via .mjs).
 *
 * Usage:
 *   node scan.mjs [--root <dir>] [--json | --md]
 *
 * Emits a structured pack (JSON or Markdown) covering:
 *   - ecosystem + package manager + scripts
 *   - commit convention (conventional? scopes? trailers?)
 *   - branch naming + main/dev detection
 *   - existing .claude surfaces (agents/commands/hooks/settings/mcp/skills/output-styles)
 *   - CI presence
 *
 * Deterministic: no Date.now / Math.random. Stable output for identical inputs.
 */

import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';

/* ── helpers ──────────────────────────────────────────────────────────────── */

function arg(flag) {
  const i = process.argv.indexOf(flag);
  if (i !== -1 && process.argv[i + 1] && !process.argv[i + 1].startsWith('--')) {
    return process.argv[i + 1];
  }
  const hit = process.argv.find((a) => a.startsWith(flag + '='));
  return hit ? hit.slice(flag.length + 1) : null;
}

function readJson(abs) {
  try { return JSON.parse(fs.readFileSync(abs, 'utf8')); } catch (_) { return null; }
}

function readText(abs) {
  try { return fs.readFileSync(abs, 'utf8'); } catch (_) { return null; }
}

function exists(abs) {
  try { return fs.existsSync(abs); } catch (_) { return false; }
}

function listDir(abs) {
  try { return fs.readdirSync(abs); } catch (_) { return []; }
}

function gitRoot(from) {
  try {
    return execFileSync('git', ['-C', from, 'rev-parse', '--show-toplevel'],
      { encoding: 'utf8', timeout: 8000 }).trim();
  } catch (_) { return from; }
}

function runGit(root, args) {
  try {
    return execFileSync('git', ['-C', root, ...args],
      { encoding: 'utf8', timeout: 10000 }).trim();
  } catch (_) { return ''; }
}

/* ── scanners ─────────────────────────────────────────────────────────────── */

function scanEcosystem(root) {
  const pkg = readJson(path.join(root, 'package.json'));
  if (pkg) {
    const manager = exists(path.join(root, 'pnpm-lock.yaml')) ? 'pnpm'
      : exists(path.join(root, 'yarn.lock')) ? 'yarn'
      : exists(path.join(root, 'bun.lockb')) ? 'bun'
      : 'npm';
    const scripts = pkg.scripts ? Object.keys(pkg.scripts) : [];
    const isMonorepo = !!(pkg.workspaces || exists(path.join(root, 'pnpm-workspace.yaml')) || exists(path.join(root, 'turbo.json')));
    return {
      language: 'javascript/typescript',
      manager,
      monorepo: isMonorepo,
      scripts,
      manifestFile: 'package.json',
    };
  }
  if (exists(path.join(root, 'pyproject.toml'))) {
    const txt = readText(path.join(root, 'pyproject.toml')) || '';
    const manager = exists(path.join(root, 'poetry.lock')) ? 'poetry'
      : exists(path.join(root, 'uv.lock')) ? 'uv'
      : 'pip';
    const scripts = (txt.match(/\[tool\.poetry\.scripts\]([\s\S]*?)(?=\[|$)/) || [])[1]
      ?.split('\n').filter((l) => l.includes('=')).map((l) => l.trim()) || [];
    return { language: 'python', manager, monorepo: false, scripts, manifestFile: 'pyproject.toml' };
  }
  if (exists(path.join(root, 'go.mod'))) {
    return { language: 'go', manager: 'go', monorepo: false, scripts: [], manifestFile: 'go.mod' };
  }
  if (exists(path.join(root, 'Cargo.toml'))) {
    const txt = readText(path.join(root, 'Cargo.toml')) || '';
    const isWS = txt.includes('[workspace]');
    return { language: 'rust', manager: 'cargo', monorepo: isWS, scripts: [], manifestFile: 'Cargo.toml' };
  }
  if (exists(path.join(root, 'Gemfile'))) {
    return { language: 'ruby', manager: 'bundler', monorepo: false, scripts: [], manifestFile: 'Gemfile' };
  }
  if (exists(path.join(root, 'composer.json'))) {
    return { language: 'php', manager: 'composer', monorepo: false, scripts: [], manifestFile: 'composer.json' };
  }
  return { language: 'unknown', manager: 'unknown', monorepo: false, scripts: [], manifestFile: null };
}

function scanCommits(root) {
  const log = runGit(root, ['log', '--oneline', '-50']);
  if (!log) return { conventional: false, scopes: [], hasCoAuthoredBy: false, hasGitmoji: false, sample: [] };

  const lines = log.split('\n').filter(Boolean);
  const conventional = lines.filter((l) => /^[0-9a-f]+ (feat|fix|chore|refactor|docs|test|perf|ci|build|style|revert)(\(.+\))?!?:/.test(l));
  const scopeMatches = lines.flatMap((l) => (l.match(/\(([^)]+)\)/) || []).slice(1));
  const uniqueScopes = [...new Set(scopeMatches)].sort();

  // Check for Co-Authored-By / trailers via full log
  const fullLog = runGit(root, ['log', '-20', '--format=%B---END---']);
  const hasCoAuthoredBy = fullLog.includes('Co-Authored-By:') || fullLog.includes('Co-authored-by:');
  const hasGitmoji = lines.some((l) => /[\u{1F300}-\u{1FFFF}]/u.test(l));

  return {
    conventional: conventional.length > lines.length * 0.6,
    conventionalRatio: `${conventional.length}/${lines.length}`,
    scopes: uniqueScopes.slice(0, 20),
    hasCoAuthoredBy,
    hasGitmoji,
    sample: lines.slice(0, 5),
  };
}

function scanBranches(root) {
  const raw = runGit(root, ['branch', '-a']);
  const branches = raw.split('\n').map((b) => b.replace(/^\*?\s+/, '').trim()).filter(Boolean);
  const remoteOnly = branches.filter((b) => b.startsWith('remotes/'));
  const local = branches.filter((b) => !b.startsWith('remotes/'));
  const all = [...new Set([...local, ...remoteOnly.map((b) => b.replace(/^remotes\/origin\//, ''))])];

  const hasMain = all.some((b) => b === 'main' || b === 'remotes/origin/main');
  const hasDev  = all.some((b) => b === 'dev'  || b === 'remotes/origin/dev');
  const hasMaster = all.some((b) => b === 'master' || b === 'remotes/origin/master');

  // Detect feature branch naming pattern
  const featureBranches = local.filter((b) => b !== 'main' && b !== 'dev' && b !== 'master');
  const patterns = featureBranches.map((b) => {
    if (/^feat\//.test(b)) return 'feat/<desc>';
    if (/^feature\//.test(b)) return 'feature/<desc>';
    if (/^f\d+\//.test(b)) return 'f<n>/<area>-<desc>';
    if (/^fix\//.test(b)) return 'fix/<desc>';
    return 'other';
  });
  const topPattern = patterns.sort((a, b) =>
    patterns.filter((p) => p === b).length - patterns.filter((p) => p === a).length
  )[0] || 'undetected';

  return {
    mainBranch: hasMain ? 'main' : hasMaster ? 'master' : hasDev ? 'dev' : 'unknown',
    integrationBranch: hasDev ? 'dev' : null,
    featurePattern: topPattern,
    localCount: local.length,
    sample: local.slice(0, 8),
  };
}

function scanClaudeSurfaces(root) {
  const base = path.join(root, '.claude');
  if (!exists(base)) return { present: false, surfaces: {} };

  const surfaces = {
    claudeMd: exists(path.join(root, 'CLAUDE.md')),
    settings: exists(path.join(base, 'settings.json')),
    settingsLocal: exists(path.join(base, 'settings.local.json')),
    mcpJson: exists(path.join(root, '.mcp.json')) || exists(path.join(base, '.mcp.json')),
    agents: listDir(path.join(base, 'agents')).filter((f) => f.endsWith('.md')),
    commands: listDir(path.join(base, 'commands')).filter((f) => f.endsWith('.md')),
    skills: listDir(path.join(base, 'skills')),
    hooks: listDir(path.join(base, 'hooks')).filter((f) => f.endsWith('.py') || f.endsWith('.js') || f.endsWith('.sh')),
    outputStyles: listDir(path.join(base, 'output-styles')).filter((f) => f.endsWith('.md')),
    workflows: listDir(path.join(base, 'workflows')).filter((f) => f.endsWith('.js') || f.endsWith('.mjs')),
    plugins: listDir(path.join(base, 'plugins')),
  };

  return { present: true, surfaces };
}

function scanCI(root) {
  const sources = [];
  if (listDir(path.join(root, '.github', 'workflows')).some((f) => /\.(yml|yaml)$/.test(f))) {
    sources.push('github-actions');
  }
  if (exists(path.join(root, '.gitlab-ci.yml'))) sources.push('gitlab-ci');
  if (exists(path.join(root, 'Jenkinsfile'))) sources.push('jenkins');
  if (exists(path.join(root, '.circleci', 'config.yml'))) sources.push('circleci');
  if (exists(path.join(root, 'bitbucket-pipelines.yml'))) sources.push('bitbucket');
  return { present: sources.length > 0, systems: sources };
}

function scanDomainInvariants(root) {
  const claudeMd = readText(path.join(root, 'CLAUDE.md')) || '';
  const flags = {
    multiTenant: /tenant_id|multi.tenant|RLS/i.test(claudeMd),
    i18n: /i18n|locale|translation|l10n/i.test(claudeMd),
    eventBus: /event.bus|outbox|MessageBus/i.test(claudeMd),
    appendOnly: /append.only|audit.log|ledger/i.test(claudeMd),
    portsAdapters: /ports?.adapters|hexagonal|port.*adapter/i.test(claudeMd),
    auth: /auth|authentication|authorization|JWT|session/i.test(claudeMd),
    payments: /payment|stripe|billing|subscription/i.test(claudeMd),
  };
  return flags;
}

/* ── assemble ─────────────────────────────────────────────────────────────── */

const rootArg = arg('--root');
const emitJson = process.argv.includes('--json');
const emitMd   = process.argv.includes('--md');

const cwd  = process.cwd();
const root = rootArg ? path.resolve(rootArg) : gitRoot(cwd);

const ecosystem   = scanEcosystem(root);
const commits     = scanCommits(root);
const branches    = scanBranches(root);
const claude      = scanClaudeSurfaces(root);
const ci          = scanCI(root);
const invariants  = scanDomainInvariants(root);

const pack = { root, ecosystem, commits, branches, claude, ci, invariants };

if (emitJson || (!emitMd && !emitJson)) {
  // default: JSON (machine-readable)
  process.stdout.write(JSON.stringify(pack, null, 2) + '\n');
} else {
  // --md: markdown context-pack for LLM consumption
  const { surfaces } = claude;
  process.stdout.write(`# Repo Context Pack — optimize-my-setup
Repo: ${root}

## Ecosystem
- Language: ${ecosystem.language}
- Manager: ${ecosystem.manager}
- Monorepo: ${ecosystem.monorepo}
- Manifest: ${ecosystem.manifestFile || 'none'}
- Scripts: ${ecosystem.scripts.slice(0, 12).join(', ') || 'none'}

## Git / Commit Convention
- Conventional commits: ${commits.conventional} (${commits.conventionalRatio} of last 50)
- Scopes detected: ${commits.scopes.join(', ') || 'none'}
- Co-Authored-By trailers: ${commits.hasCoAuthoredBy}
- Gitmoji: ${commits.hasGitmoji}
- Sample commits:
${commits.sample.map((s) => `  ${s}`).join('\n')}

## Branches
- Main branch: ${branches.mainBranch}
- Integration branch: ${branches.integrationBranch || 'none'}
- Feature pattern: ${branches.featurePattern}
- Local branches (sample): ${branches.sample.join(', ')}

## Existing .claude Surfaces
- CLAUDE.md present: ${claude.present ? surfaces.claudeMd : false}
- settings.json: ${claude.present ? surfaces.settings : false}
- settings.local.json: ${claude.present ? surfaces.settingsLocal : false}
- .mcp.json: ${claude.present ? surfaces.mcpJson : false}
- Agents: ${claude.present ? surfaces.agents.join(', ') || 'none' : 'none'}
- Commands: ${claude.present ? surfaces.commands.join(', ') || 'none' : 'none'}
- Skills: ${claude.present ? surfaces.skills.join(', ') || 'none' : 'none'}
- Hooks: ${claude.present ? surfaces.hooks.join(', ') || 'none' : 'none'}
- Output-styles: ${claude.present ? surfaces.outputStyles.join(', ') || 'none' : 'none'}
- Workflows: ${claude.present ? surfaces.workflows.join(', ') || 'none' : 'none'}

## CI
- Present: ${ci.present}
- Systems: ${ci.systems.join(', ') || 'none'}

## Domain Invariants (from CLAUDE.md)
- Multi-tenant: ${invariants.multiTenant}
- i18n: ${invariants.i18n}
- Event bus / outbox: ${invariants.eventBus}
- Append-only / audit log: ${invariants.appendOnly}
- Ports & adapters: ${invariants.portsAdapters}
- Auth: ${invariants.auth}
- Payments: ${invariants.payments}
`);
}
