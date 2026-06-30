**English** | [Español](README.es.md)

# 🛠️ claude-code-setup-optimizer

[![Claude Code plugin](https://img.shields.io/badge/Claude_Code-marketplace-D97757)](https://github.com/davidgarciagordo/claude-code-setup-optimizer) [![skills.sh](https://img.shields.io/badge/skills.sh-skill-111111)](https://skills.sh) ![License MIT](https://img.shields.io/badge/license-MIT-2da44e) ![Version](https://img.shields.io/badge/version-0.2.0-blue)

> The hub that optimises how you work with Claude Code in any repo — methodology + real automations + a skill that analyses your repo and **lets you choose what to apply**.

### 🧩 The family — same signature, four repos

| | Repo | Role |
|---|---|---|
| 🛠️ | [**claude-code-setup-optimizer**](https://github.com/davidgarciagordo/claude-code-setup-optimizer) · *you are here* | **The hub** — bundles everything below + automations (hooks · subagents · commands) + `/optimize-my-setup` |
| 🔨 | [**forge-methodology**](https://github.com/davidgarciagordo/forge-methodology) | Structure *what to build* — align → spec → grill ×3 → plan → verify |
| 🎨 | [**design-review**](https://github.com/davidgarciagordo/design-review) | Polish *how it looks* — structure → audit → anti-slop → a11y → live check |
| 💸 | [**token-economy**](https://github.com/davidgarciagordo/token-economy) | Spend *less to do it* — context-pack (discover-once) · read-only terse agents · frugal output-style · pluggable memory. Complements [caveman](https://github.com/JuliusBrussee/caveman) (output) on the input/orchestration axis. |

## 📦 Install

```bash
# 🛠️ Add the hub marketplace (gets all five plugins)
/plugin marketplace add davidgarciagordo/claude-code-setup-optimizer

/plugin install working-methods@claude-code-setup-optimizer
/plugin install automations@claude-code-setup-optimizer
/plugin install forge-methodology@claude-code-setup-optimizer
/plugin install design-review@claude-code-setup-optimizer
/plugin install token-economy@claude-code-setup-optimizer
```
Each plugin is also installable standalone (forge/design-review are their own marketplaces too).

## 🚀 Start here

The hub has a **spine** — one entrypoint that *sequences and enforces* the methodology, so
the order doesn't live in a copy-paste prompt you have to remember.

**1. Set up the workshop (once):**
```
/install-family        # verify/install the 5 plugins as a unit
/optimize-my-setup     # tailor this repo's .claude config — you pick what to apply
```

**2. Build with the spine (every substantial task):**
```
/forge-run <your task>
```
`/forge-run` runs the whole loop **in codified order with machine-checked gates**:

```mermaid
flowchart TD
  A[align intent] --> R[reference-decomposition<br/>name reference → req-ids]
  R --> S[spec + Acceptance Matrix<br/>= canonical DoD]
  S --> G{/grill ×3 + completeness<br/>owner gate · multi-select}
  G --> P{global plan<br/>owner sign-off · multi-select}
  P --> E[execution<br/>worktrees + shared context-pack]
  E --> V{verify<br/>reviewers + completeness-critic<br/>+ design-review on UI diffs}
  V -- gaps --> E
  V -- matrix 100% traced --> H[/handoff/]
```

> Owner-decision gates (grill · plan) are **multi-select with recommendations pre-marked** — never a bare
> approve. A PR can't leave until spec + grill acta + Acceptance Matrix + plan are on disk.

The order lives in `plugins/working-methods/workflows/forge.js` (single source of truth), not
in prose. `forge.js` enforces **phase order** (rejects orphan runs), **parses once** (no
repeated I/O), and is the single source for the `guard-forge-artifacts` hook — the hook
delegates to `forge.js check-pr` and no longer blocks per-phase `git push`. Each phase
**invokes** the real command/skill/agent — it *applies* `forge-methodology` and `design-review`,
it doesn't just recommend installing them. A PR can't leave until the run's spec, grill acta,
Acceptance Matrix and plan are versioned under `docs/forge/<slug>/`. **The owner always
decides** — the plan gate (phase 5) is a **multi-select with recommendations pre-marked**
(same UX as the grill gate C), not a bare sign-off.

> `/optimize-my-setup` is one-time **repo setup**, not a step of building a feature.
> Language-agnostic — JS/TS, Python, PHP, Go, Rust, Ruby.

## 📚 Examples

Copy-paste usage for every plugin, command, hook and subagent → [examples/](examples/README.md).

## 🧩 Plugins

| Plugin | Source | Contents |
|--------|--------|----------|
| 🧠 `working-methods` | local | **`/forge-run` — THE spine**: sequences & enforces the whole loop (`workflows/forge.js` — phase-order gate, parse-once, rejects orphan run; `guard-forge-artifacts` delegates to `forge.js check-pr`, no per-phase `git push` block). · `/install-family` (bootstrap the 5 plugins) · `/grill` — adversarial ×3 with **read-only terse griller agents** (`agents/grill-{architect,operator,engineer}.md`, no Edit/Write) + deterministic **`workflows/grill-context.mjs`** (discover-once pack) + bundled **`completeness-critic`** 4th lens. · `/handoff` (session relay) · `forge-on-claude` (maps Forge to Claude Code tools; **requires `forge-methodology`**). Model routing baked in. *(low-cost comms → pair with the original [caveman](https://github.com/JuliusBrussee/caveman))* |
| ⚡ `automations` | local | **`/optimize-my-setup`** (skill + command) — deterministic **`scan.mjs`** builds a repo→context-pack, then runs **real parallel read-only per-surface fan-out**, and presents a **multi-select apply** (you pick what to adopt). Tailors the whole `.claude` setup: `CLAUDE.md`, `settings.json` (permissions/hooks/env), skills, **agents generated per detected invariant**, `workflows/*.js`, `.mcp.json`, `output-styles`. Active **fail-closed** hook `guard-append-only`. `/release`. **Templates**: parametrizable **hooks** (`guard-main`, `commit-msg-lint`, `secrets-guard`, `ui-diff-design-review`), reviewer templates (incl. generic `completeness-critic`), permissions allow-list, CLAUDE.md rules block. |
| 🔨 `forge-methodology` | github | Forge loop: align → spec → grill ×3 → global plan → execution → verify vs DoD → sign-off. |
| 🎨 `design-review` | github | Design/redesign/audit pipeline (hierarchy, IA, a11y, tokens, motion). |
| 💸 `token-economy` | github | Max token savings without quality loss: `scripts/context-pack.mjs` (discover-once), read-only lens template, **frugal output-style**, pluggable memory adapter. The family inherits the input/output economy from here (one source). Complements `caveman` (output) on the input/orchestration axis. |

## 🙏 Credits — referenced, not copied

This marketplace **references and organizes** great work; it does not vendor copies, so everything stays current at its source and the original authors keep the credit.

- **forge-methodology**, **design-review**, **token-economy** — by [David García Gordo](https://github.com/davidgarciagordo) (this family).
- **caveman** (low-cost comms) — by [JuliusBrussee](https://github.com/JuliusBrussee/caveman). Install the original: `/plugin marketplace add JuliusBrussee/caveman`.
- The **design-review pipeline** orchestrates skills by their original authors — `impeccable`, `taste-skill`, `emil-design-eng`, `ui-ux-pro-max`, `huashu-design`, `web-accessibility`, `seo` — installed from source via its preflight (see design-review's *Attribution*). Nothing bundled; each updates at its origin.

## 📌 Always-on norms

Style/testing/security/orchestration are **permanent** guidance, not on-demand skills → a plugin doesn't inject them into the system prompt. Reference them from each repo's `CLAUDE.md` using `plugins/automations/templates/claude-md-rules-reference.md`.

## 🗂️ Structure
```
.claude-plugin/marketplace.json                  # 5 plugins (2 local + 3 github)
plugins/working-methods/
  commands/forge-run.md        # THE entrypoint — the codified spine
  commands/install-family.md   # bootstrap the 5-plugin family
  commands/grill.md · handoff.md
  workflows/forge.js           # deterministic phase machine — single source of truth; phase-order gate, parse-once, rejects orphan run
  workflows/grill-context.mjs  # discover-once context pack for /grill
  agents/grill-architect.md · grill-operator.md · grill-engineer.md   # read-only terse griller agents
  agents/completeness-critic.md   # 4th lens bundled with /grill
  hooks/guard-forge-artifacts.py   # PR gate: delegates to forge.js check-pr (fail-closed)
  skills/forge-on-claude/      # requires forge-methodology
plugins/automations/
  commands/optimize-my-setup.md · release.md
  skills/optimize-my-setup/
    scan.mjs                   # deterministic repo→context-pack
  hooks/guard-append-only.py   # fail-closed
  templates/hooks/             # guard-main · commit-msg-lint · secrets-guard · ui-diff-design-review
  templates/reviewers/         # event-bus · i18n · completeness-critic
```
Validate: `claude plugin validate . --strict`.

---
<sub>Made by [David García Gordo](https://github.com/davidgarciagordo) · MIT</sub>
