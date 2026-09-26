import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { WM, AUTO, tempRepo, write, run, hook } from './helpers.mjs';

const TPL = path.join(AUTO, 'templates', 'hooks');

test('grill-context: keywords come from # headings and lowercase domain terms', () => {
  const repo = tempRepo();
  write(repo, 'spec.md', '# spec about auth tenant\n\nThe billing invoices are rebuilt nightly.\n');
  const r = run('node', [path.join(WM, 'workflows', 'grill-context.mjs'), 'spec.md', '--out', 'pack.md'], { cwd: repo });
  assert.equal(r.code, 0, r.err);
  const kw = r.out.match(/keywords : (.*)/)[1].split(', ');
  for (const w of ['auth', 'tenant', 'billing', 'invoices']) assert.ok(kw.includes(w), `${w} missing from ${kw}`);
  assert.ok(!kw.includes('about'), 'stopword leaked');
  assert.ok(fs.readFileSync(path.join(repo, 'pack.md'), 'utf8').includes('## SHARED-FOUND'));
});

test('scan.mjs: emits a JSON pack for a repo', () => {
  const repo = tempRepo();
  write(repo, 'package.json', '{"name":"x","scripts":{"test":"node --test"}}');
  execFileSync('git', ['-C', repo, 'add', '.']);
  execFileSync('git', ['-C', repo, 'commit', '-qm', 'feat: init']);
  const r = run('node', [path.join(AUTO, 'skills', 'optimize-my-setup', 'scan.mjs'), '--root', repo, '--json'], { cwd: repo });
  assert.equal(r.code, 0, r.err);
  assert.equal(typeof JSON.parse(r.out), 'object');
});

test('guard-append-only: blocks editing a committed migration only', () => {
  const repo = tempRepo();
  const mig = write(repo, 'db/migrations/001.sql', 'create table a (id int);\n');
  const fresh = path.join(repo, 'db/migrations/002.sql');
  const g = path.join(AUTO, 'hooks', 'guard-append-only.py');
  assert.equal(hook(g, { tool_input: { file_path: mig } }, { cwd: repo }).code, 0, 'untracked yet');
  execFileSync('git', ['-C', repo, 'add', '.']);
  execFileSync('git', ['-C', repo, 'commit', '-qm', 'feat: m']);
  assert.equal(hook(g, { tool_input: { file_path: mig } }, { cwd: repo }).code, 2);
  assert.equal(hook(g, { tool_input: { file_path: fresh } }, { cwd: repo }).code, 0);
  assert.equal(hook(g, { tool_input: { file_path: mig } }, { cwd: repo, env: { APPEND_ONLY_GLOBS: '' } }).code, 0);
});

test('guard-main template: blocks protected branches only', () => {
  const repo = tempRepo();
  const g = path.join(TPL, 'guard-main.py');
  const ev = (command) => ({ tool_input: { command } });
  assert.equal(hook(g, ev('git push origin main'), { cwd: repo }).code, 2);
  assert.equal(hook(g, ev('git commit -m "feat: x"'), { cwd: repo }).code, 0, 'on a feature branch');
  execFileSync('git', ['-C', repo, 'commit', '-q', '--allow-empty', '-m', 'chore: init']);
  execFileSync('git', ['-C', repo, 'checkout', '-qb', 'main']);
  assert.equal(hook(g, ev('git commit -m "feat: x"'), { cwd: repo }).code, 2);
  assert.equal(hook(g, ev('ls'), { cwd: repo }).code, 0);
});

test('commit-msg-lint template: enforces Conventional Commits on inline -m', () => {
  const g = path.join(TPL, 'commit-msg-lint.py');
  const ev = (command) => ({ tool_input: { command } });
  assert.equal(hook(g, ev('git commit -m "feat: add x"')).code, 0);
  assert.equal(hook(g, ev('git commit -m "added stuff"')).code, 2);
  assert.equal(hook(g, ev('git commit')).code, 0, 'no inline message → not checked');
});

test('secrets-guard template: blocks a key, warn mode lets it through', () => {
  const g = path.join(TPL, 'secrets-guard.py');
  const key = 'AKIA' + 'IOSFODNN7EXAMPLE';
  const ev = { tool_name: 'Write', tool_input: { file_path: 'config.py', content: `KEY = "${key}"\n` } };
  assert.equal(hook(g, ev).code, 2);
  assert.equal(hook(g, ev, { env: { SECRETS_GUARD_MODE: 'warn' } }).code, 0);
  assert.equal(hook(g, { tool_name: 'Write', tool_input: { file_path: 'a.py', content: 'x = 1\n' } }).code, 0);
});

test('ui-diff-design-review template: advisory only, adds context on UI files', () => {
  const g = path.join(TPL, 'ui-diff-design-review.py');
  const ui = hook(g, { tool_input: { file_path: 'src/components/Button.tsx' } });
  assert.equal(ui.code, 0);
  assert.equal(JSON.parse(ui.out).hookSpecificOutput.hookEventName, 'PostToolUse');
  const other = hook(g, { tool_input: { file_path: 'server/db.go' } });
  assert.equal(other.code, 0);
  assert.equal(other.out, '');
});
