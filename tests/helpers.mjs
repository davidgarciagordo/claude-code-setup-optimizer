import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync, execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const WM = path.join(ROOT, 'plugins', 'working-methods');
export const AUTO = path.join(ROOT, 'plugins', 'automations');

/** Fresh git repo in the temp dir; returns its absolute path. */
export function tempRepo() {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'cso-test-')));
  execFileSync('git', ['init', '-q', '-b', 'feature/x', dir]);
  execFileSync('git', ['-C', dir, 'config', 'user.email', 'test@example.com']);
  execFileSync('git', ['-C', dir, 'config', 'user.name', 'Test']);
  return dir;
}

export function tempDir() {
  return fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'cso-test-')));
}

export function write(root, rel, content) {
  const abs = path.join(root, rel);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, content);
  return abs;
}

export function run(cmd, args, { cwd, env = {}, input } = {}) {
  const r = spawnSync(cmd, args, {
    cwd, input, encoding: 'utf8', env: { ...process.env, FORGE_RUN_MANIFEST: '', ...env },
  });
  return { code: r.status, out: r.stdout, err: r.stderr };
}

export function forge(cwd, ...args) {
  return run('node', [path.join(WM, 'workflows', 'forge.js'), ...args], { cwd });
}

/** Run a Python hook with a JSON event on stdin. */
export function hook(file, event, { cwd, env } = {}) {
  return run('python3', [file], { cwd, env, input: JSON.stringify(event) });
}

/** Minimal YAML-frontmatter reader: top-level `key: value` pairs only. */
export function frontmatter(abs) {
  const text = fs.readFileSync(abs, 'utf8');
  const m = text.match(/^---\n([\s\S]*?)\n---\n/);
  if (!m) return null;
  const out = {};
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^([A-Za-z][\w-]*):\s*(.*)$/);
    if (kv) out[kv[1]] = kv[2];
  }
  return out;
}
