**English** | [Español](README.es.md)

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
Analyses your repo (git, CLAUDE.md, `.claude/`, stack), recommends 1–2 automations per category, and **ends with a multi-select: you pick what to apply** (can be nothing). Applies only what you choose. **The user always decides.** Language-agnostic — JS/TS, Python, PHP, Go, Rust, Ruby.

## 📚 Examples

Copy-paste usage for every plugin, command, hook and subagent → [examples/](examples/README.md).

## 🧩 Plugins

| Plugin | Source | Contents |
|--------|--------|----------|
| 🧠 `working-methods` | local | `/grill` (adversarial ×3: architect · operator · engineer) · `/handoff` (session relay) · `forge-on-claude` (maps Forge to Claude Code tools: ultrathink, ultracode/Workflow, worktrees, subagents, context pack). Model routing baked in. *(low-cost comms → pair with the original [caveman](https://github.com/JuliusBrussee/caveman))* |
| ⚡ `automations` | local | **Skill `optimize-my-setup`** — optimizes a repo's whole `.claude` setup to fit it: `CLAUDE.md`, `settings.json` (permissions/hooks/env), skills, **agents generated per detected invariant**, `workflows/*.js`, `.mcp.json`, `output-styles` — reusing your plugins where they fit. Plus generic hook `guard-append-only`, `/release`, and **templates** (permissions allow-list, CLAUDE.md rules block, domain-reviewer templates). |
| 🔨 `forge-methodology` | github | Forge loop: align → spec → grill ×3 → global plan → execution → verify vs DoD → sign-off. |
| 🎨 `design-review` | github | Design/redesign/audit pipeline (hierarchy, IA, a11y, tokens, motion). |

## 🙏 Credits — referenced, not copied

This marketplace **references and organizes** great work; it does not vendor copies, so everything stays current at its source and the original authors keep the credit.

- **forge-methodology**, **design-review** — by [David García Gordo](https://github.com/davidgarciagordo) (this family).
- **caveman** (low-cost comms) — by [JuliusBrussee](https://github.com/JuliusBrussee/caveman). Install the original: `/plugin marketplace add JuliusBrussee/caveman`.
- The **design-review pipeline** orchestrates skills by their original authors — `impeccable`, `taste-skill`, `emil-design-eng`, `ui-ux-pro-max`, `huashu-design`, `web-accessibility`, `seo` — installed from source via its preflight (see design-review's *Attribution*). Nothing bundled; each updates at its origin.

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
