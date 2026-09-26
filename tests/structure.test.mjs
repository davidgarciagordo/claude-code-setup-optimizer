import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, frontmatter } from './helpers.mjs';

const marketplace = JSON.parse(fs.readFileSync(path.join(ROOT, '.claude-plugin', 'marketplace.json'), 'utf8'));

function mdFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => f.endsWith('.md')).map((f) => path.join(dir, f));
}

test('marketplace lists plugins whose source dirs exist', () => {
  assert.ok(marketplace.plugins.length > 0);
  for (const p of marketplace.plugins) {
    const dir = path.join(ROOT, p.source);
    assert.ok(fs.existsSync(path.join(dir, '.claude-plugin', 'plugin.json')), `${p.name}: plugin.json missing`);
  }
});

for (const entry of marketplace.plugins) {
  const pluginDir = path.join(ROOT, entry.source);
  const manifest = JSON.parse(fs.readFileSync(path.join(pluginDir, '.claude-plugin', 'plugin.json'), 'utf8'));

  test(`${entry.name}: manifest matches marketplace and its paths exist`, () => {
    assert.equal(manifest.name, entry.name);
    assert.equal(manifest.displayName, entry.displayName);
    assert.equal(manifest.hooks, undefined, 'hooks/hooks.json is auto-loaded; declaring it breaks install');
    for (const rel of [].concat(manifest.commands || [], manifest.skills || [], manifest.agents || [])) {
      assert.ok(fs.existsSync(path.join(pluginDir, rel)), `${entry.name}: ${rel} does not exist`);
    }
  });

  test(`${entry.name}: commands, agents and skills carry valid frontmatter`, () => {
    for (const f of mdFiles(path.join(pluginDir, 'commands'))) {
      const fm = frontmatter(f);
      assert.ok(fm && fm.description, `${f}: missing description`);
    }
    for (const f of mdFiles(path.join(pluginDir, 'agents'))) {
      const fm = frontmatter(f);
      assert.ok(fm && fm.name && fm.description, `${f}: agent needs name + description`);
      assert.equal(fm.name, path.basename(f, '.md'), `${f}: name must match file name`);
    }
    const skillsDir = path.join(pluginDir, 'skills');
    if (fs.existsSync(skillsDir)) {
      for (const d of fs.readdirSync(skillsDir)) {
        const f = path.join(skillsDir, d, 'SKILL.md');
        const fm = frontmatter(f);
        assert.ok(fm && fm.name && fm.description, `${f}: skill needs name + description`);
        assert.equal(fm.name, d, `${f}: name must match its directory`);
      }
    }
  });

  test(`${entry.name}: no command shares its name with a skill`, () => {
    const skillsDir = path.join(pluginDir, 'skills');
    const skills = fs.existsSync(skillsDir) ? fs.readdirSync(skillsDir) : [];
    for (const f of mdFiles(path.join(pluginDir, 'commands'))) {
      assert.ok(!skills.includes(path.basename(f, '.md')), `${f} clashes with a skill of the same name`);
    }
  });

  test(`${entry.name}: hooks.json points at scripts that exist`, () => {
    const hj = path.join(pluginDir, 'hooks', 'hooks.json');
    if (!fs.existsSync(hj)) return;
    const cfg = JSON.parse(fs.readFileSync(hj, 'utf8'));
    for (const groups of Object.values(cfg.hooks)) {
      for (const g of groups) {
        for (const h of g.hooks) {
          const m = h.command.match(/\$\{CLAUDE_PLUGIN_ROOT\}\/([^"\s]+)/);
          assert.ok(m, `hook command not rooted at CLAUDE_PLUGIN_ROOT: ${h.command}`);
          assert.ok(fs.existsSync(path.join(pluginDir, m[1])), `${m[1]} missing`);
        }
      }
    }
  });
}

test('commands with side effects are not model-invocable', () => {
  for (const rel of ['plugins/working-methods/commands/install-family.md', 'plugins/automations/commands/release.md']) {
    assert.equal(frontmatter(path.join(ROOT, rel))['disable-model-invocation'], 'true', rel);
  }
});
