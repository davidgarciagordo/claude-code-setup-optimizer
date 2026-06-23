# 🛠️ claude-code-setup-optimizer

[![Claude Code plugin](https://img.shields.io/badge/Claude_Code-marketplace-D97757)](https://github.com/davidgarciagordo/claude-code-setup-optimizer) [![skills.sh](https://img.shields.io/badge/skills.sh-skill-111111)](https://skills.sh) ![License MIT](https://img.shields.io/badge/license-MIT-2da44e) ![Version](https://img.shields.io/badge/version-0.1.0-blue)

> The hub that optimises how you work with Claude Code in any repo — methodology + real automations + a skill that analyses your repo and **lets you choose what to apply**.

### 🧩 The family — same signature, three repos

| | Repo | Role |
|---|---|---|
| 🛠️ | [**claude-code-setup-optimizer**](https://github.com/davidgarciagordo/claude-code-setup-optimizer) · *you are here* | **The hub** — bundles everything below + automations (hooks · subagents · commands) + `/optimize-my-setup` |
| 🔨 | [**forge-methodology**](https://github.com/davidgarciagordo/forge-methodology) | Structure *what to build* — align → spec → grill ×3 → plan → verify |
| 🎨 | [**design-review**](https://github.com/davidgarciagordo/design-review) | Polish *how it looks* — structure → audit → anti-slop → a11y → live check |

## 📦 Install

```bash
# 🛠️ Add the hub marketplace (gets all four plugins)
/plugin marketplace add davidgarciagordo/claude-code-setup-optimizer

/plugin install working-methods@claude-code-setup-optimizer
/plugin install automations@claude-code-setup-optimizer
/plugin install forge-methodology@claude-code-setup-optimizer
/plugin install design-review@claude-code-setup-optimizer
```
Each plugin is also installable standalone (forge/design-review are their own marketplaces too).

## 🚀 Start here

```
/optimize-my-setup
```
Analyses your repo (git, CLAUDE.md, `.claude/`, stack), recommends 1–2 automations per category, and **ends with a multi-select: you pick what to apply** (can be nothing). Applies only what you choose. **The user always decides.**

## 🧩 Plugins

| Plugin | Source | Contents |
|--------|--------|----------|
| 🧠 `working-methods` | local | `caveman` (low-cost comms) · `/grill` (adversarial ×3: architect · operator · engineer) · `/handoff` (session relay). Model routing baked in. |
| ⚡ `automations` | local | **Hooks:** `format-on-edit` (prettier/biome), `guard-append-only` (blocks editing committed migrations/audit logs). **Subagents:** `messagebus-reviewer`, `i18n-reviewer`. **Command:** `/release`. **Skill:** `optimize-my-setup`. **Templates:** permissions allow-list + CLAUDE.md rules block. |
| 🔨 `forge-methodology` | github | Forge loop: align → spec → grill ×3 → global plan → execution → verify vs DoD → sign-off. |
| 🎨 `design-review` | github | Design/redesign/audit pipeline (hierarchy, IA, a11y, tokens, motion). |

## 📌 Always-on norms

Style/testing/security/orchestration are **permanent** guidance, not on-demand skills → a plugin doesn't inject them into the system prompt. Reference them from each repo's `CLAUDE.md` using `plugins/automations/templates/claude-md-rules-reference.md`.

## 🗂️ Structure
```
.claude-plugin/marketplace.json          # 4 plugins (2 local + 2 github)
plugins/working-methods/  ·  plugins/automations/
```
Validate: `claude plugin validate . --strict`.

---
<sub>Made by [David García Gordo](https://github.com/davidgarciagordo) · MIT</sub>
