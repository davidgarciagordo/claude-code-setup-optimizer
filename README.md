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

The hub has a **spine** — one entrypoint that *sequences and enforces* the methodology, so
the order doesn't live in a copy-paste prompt you have to remember.

**1. Set up the workshop (once):**
```
/install-family        # verify/install the 4 plugins as a unit
/optimize-my-setup     # tailor this repo's .claude config — you pick what to apply
```

**2. Build with the spine (every substantial task):**
```
/forge-run <your task>
```
`/forge-run` runs the whole loop **in codified order with machine-checked gates**:

```
align → reference-decomposition → spec (+ Acceptance Matrix)
      → /grill ×3 + completeness → global plan (owner sign-off)
      → execution (worktrees + shared context pack)
      → verify (reviewers + completeness-critic + design-review on UI diffs)
      → /handoff
```

The order lives in `plugins/working-methods/workflows/forge.js` (single source of truth), not
in prose. Each phase **invokes** the real command/skill/agent — it *applies* `forge-methodology`
and `design-review`, it doesn't just recommend installing them. A PR can't leave until the run's
spec, grill acta, Acceptance Matrix and plan are versioned under `docs/forge/<slug>/` — the
`guard-forge-artifacts` hook enforces it. **The owner always decides** (plan + grill gates).

> `/optimize-my-setup` is one-time **repo setup**, not a step of building a feature.
> Language-agnostic — JS/TS, Python, PHP, Go, Rust, Ruby.

## 📚 Examples

Copy-paste usage for every plugin, command, hook and subagent → [examples/](examples/README.md).

## 🧩 Plugins

| Plugin | Source | Contents |
|--------|--------|----------|
| 🧠 `working-methods` | local | **`/forge-run` — THE spine**: sequences & enforces the whole loop (`workflows/forge.js` + the `guard-forge-artifacts` PR gate). · `/install-family` (bootstrap the 4 plugins) · `/grill` (adversarial ×3 + completeness lens) · `/handoff` (session relay) · `forge-on-claude` (maps Forge to Claude Code tools; **requires `forge-methodology`**). Model routing baked in. *(low-cost comms → pair with the original [caveman](https://github.com/JuliusBrussee/caveman))* |
| ⚡ `automations` | local | **`/optimize-my-setup`** (skill + command) — tailors a repo's whole `.claude` setup: `CLAUDE.md`, `settings.json` (permissions/hooks/env), skills, **agents generated per detected invariant**, `workflows/*.js`, `.mcp.json`, `output-styles`. Active **fail-closed** hook `guard-append-only`. `/release`. **Templates**: parametrizable **hooks** (`guard-main`, `commit-msg-lint`, `secrets-guard`, `ui-diff-design-review`), reviewer templates (incl. generic `completeness-critic`), permissions allow-list, CLAUDE.md rules block. |
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
.claude-plugin/marketplace.json                  # 4 plugins (2 local + 2 github)
plugins/working-methods/
  commands/forge-run.md        # THE entrypoint — the codified spine
  commands/install-family.md   # bootstrap the 4-plugin family
  commands/grill.md · handoff.md
  workflows/forge.js           # deterministic phase machine — single source of truth
  hooks/guard-forge-artifacts.py   # PR gate: artifacts must be versioned (fail-closed)
  skills/forge-on-claude/      # requires forge-methodology
plugins/automations/
  commands/optimize-my-setup.md · release.md
  skills/optimize-my-setup/
  hooks/guard-append-only.py   # fail-closed
  templates/hooks/             # guard-main · commit-msg-lint · secrets-guard · ui-diff-design-review
  templates/reviewers/         # event-bus · i18n · completeness-critic
```
Validate: `claude plugin validate . --strict`.

---
<sub>Made by [David García Gordo](https://github.com/davidgarciagordo) · MIT</sub>
