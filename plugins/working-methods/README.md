**English** | [Español](README.es.md)

# working-methods — the Forge enforcement layer on Claude Code

This plugin is the **enforcement layer of the Forge methodology on Claude Code**: the phase
order lives in code ([`workflows/forge.js`](workflows/forge.js)), the gates are machine-checked
(`gate`/`advance` refuse with exit 2 when an artifact is missing), and a PreToolUse hook
**blocks `gh pr create`/`ready`/`merge`** until the run's artifacts are versioned.
It is not a prose checklist an agent has to remember — skipping a phase is a failed command,
not a forgotten paragraph.

## Quickstart

```
/install-family          # once per machine: installs/verifies the 5-plugin family
/forge-run <task>        # the entrypoint: drives the 12 phases below, gated
```

`/forge-run` drives everything through the deterministic conductor. See the spine for yourself
(real output of `node workflows/forge.js phases`, excerpt):

```
Forge run spine — codified order (gates are machine-checked):

  1. align  —  Align intent + brainstorm
       invokes : superpowers:brainstorming if installed (NOT a declared dep) — fallback: native guided brainstorm (value question first + explicit options, one batch)
       produces: intent.md
  2. reference-decomposition  —  Reference decomposition (req-ids)
       invokes : forge-methodology:reference-decomposer → enumerated Reference Standard
       gate-in : needs intent.md
       produces: references.md
  ...
  12. handoff  —  Handoff (owner sign-off recorded)
       invokes : /handoff
       gate-in : needs verify.md
       produces: handoff.md

  Pre-PR / pre-merge gate: spec.md, acceptance-matrix.md, grill-verdicts.md, decisions-1.md,
  regrill-verdicts.md, decisions-2.md, plan.md must exist & be non-empty.
```

When to run it: the discriminator is **design vs execution**, not file count. New
feature/product/integration, architecture or security decision, a behavior contract others
depend on → `/forge-run`. Executing something already decided (bug fix, mechanical sweep,
applying a written plan) → work directly.

## The spine — 12 phases, each gated by artifacts

Generated from `node workflows/forge.js phases` (that command is the single source of truth;
if this table and the script ever disagree, the script wins):

| # | Phase | Needs (gate-in) | Produces |
|---|-------|-----------------|----------|
| 1 | `align` — intent + brainstorm | — | `intent.md` |
| 2 | `reference-decomposition` — req-ids | `intent.md` | `references.md` |
| 3 | `draft` — concrete sketch, cheap to change | `references.md` | `draft.md` |
| 4 | `grill` — ×3 + completeness lens ON THE DRAFT | `draft.md` | `grill-verdicts.md` |
| 5 | `checkpoint-1` — owner batch #1 | `grill-verdicts.md` | `decisions-1.md` |
| 6 | `spec` — versioned spec + Acceptance Matrix | `decisions-1.md` | `spec.md`, `acceptance-matrix.md` |
| 7 | `regrill` — ×2 focused on the SPEC | `spec.md`, `acceptance-matrix.md` | `regrill-verdicts.md` |
| 8 | `checkpoint-2` — owner batch #2, spec locked | `regrill-verdicts.md` | `decisions-2.md` |
| 9 | `plan` — global plan + execution proposal | `decisions-2.md` | `plan.md`, `execution-proposal.md` |
| 10 | `execute` — worktrees + ONE shared context pack | `spec.md`, `acceptance-matrix.md`, `plan.md`, `execution-proposal.md` | `context-pack.md` |
| 11 | `verify` — audit the MATRIX, not the diff | `acceptance-matrix.md`, `plan.md` | `verify.md` |
| 12 | `handoff` — owner sign-off recorded | `verify.md` | `handoff.md` |

All artifacts are versioned under `docs/forge/<slug>/`. The owner is interrupted **exactly
twice** (checkpoints 5 and 8), each time as ONE multi-select batch with recommendations
pre-marked. Pre-PR gate: `spec.md`, `acceptance-matrix.md`, `grill-verdicts.md`,
`decisions-1.md`, `regrill-verdicts.md`, `decisions-2.md`, `plan.md` must exist and be non-empty.

## Components

| Component | Path | What it does |
|---|---|---|
| `/forge-run` | [`commands/forge-run.md`](commands/forge-run.md) | THE entrypoint — drives the 12 phases via forge.js |
| `/grill` | [`commands/grill.md`](commands/grill.md) | Adversarial ×3(+1) attack on an artifact — standalone too |
| `/handoff` | [`commands/handoff.md`](commands/handoff.md) | Session relay (live or autonomous) — standalone too |
| `/install-family` | [`commands/install-family.md`](commands/install-family.md) | Bootstrap the 5-plugin family, once per machine |
| `forge-on-claude` | [`skills/forge-on-claude/SKILL.md`](skills/forge-on-claude/SKILL.md) | Maps each neutral Forge concept to the concrete Claude Code tool |
| `grill-architect` / `grill-operator` / `grill-engineer` | [`agents/`](agents/) | The 3 read-only grill lenses (terse output, shared context pack) |
| `forge.js` | [`workflows/forge.js`](workflows/forge.js) | State machine, zero deps: `phases · init · status · gate · advance · check-pr · complete` |
| `grill-context.mjs` | [`workflows/grill-context.mjs`](workflows/grill-context.mjs) | Deterministic context-pack assembler for the grill lenses |
| `guard-forge-artifacts` | [`hooks/guard-forge-artifacts.py`](hooks/guard-forge-artifacts.py) | PreToolUse(Bash) hook: gates PR commands behind `forge.js check-pr` (fail-closed) |
| executor-eye check | [`references/executor-eye-check.md`](references/executor-eye-check.md) | Reread instructions as the agent who will execute them (4 checks) |

The 4th grill lens, `completeness-critic`, is **not bundled here** — it ships with the
required `forge-methodology` plugin and is invoked as `forge-methodology:completeness-critic`.

## Dependencies — what degrades without each

| Plugin | Status | Used for | Without it |
|---|---|---|---|
| `forge-methodology` | **required** (declared) | The neutral loop `forge-on-claude` maps; the `completeness-critic`, `reference-decomposer` and `independent-verifier` agents; spec templates; `grill-me` | Phases 2, 4 (4th lens) and 11 lose their agents; `forge-on-claude` references dangle. Don't run without it |
| `design-review` | **required** (declared) | The verify phase fires it on any UI diff | UI changes get no design pipeline at verify — visual quality unverified |
| `superpowers` | **optional** (external, [obra/superpowers](https://github.com/obra/superpowers) — deliberately NOT declared so installs never break on a missing third-party catalog) | `align` invokes `superpowers:brainstorming`; `plan` invokes `superpowers:writing-plans` — when present | Explicit fallback (codified in forge.js's phase table): native guided brainstorm / plain versioned `plan.md`. The run works, the two phases are leaner |
| `token-economy` | recommended | Context-pack + frugal-output norms the grill agents follow | Everything runs; the lenses just cost more tokens |

## `/grill` and `/handoff` work standalone

You don't need a Forge run to use them:

- **`/grill <artifact>`** attacks any spec/plan/design with 3 adversarial lenses (+completeness
  when there's an Acceptance Matrix), binary finding criteria, and one batched owner gate.
  Don't confuse it with **`forge-methodology:grill-me`**: `/grill` attacks **an artifact**
  (read-only agents hunt what breaks, citing `file:line`); `grill-me` interviews **you, the
  human**, about a plan until every branch of the decision tree is resolved. One grills the
  document, the other grills its author.
- **`/handoff`** closes a session with a versioned relay (in-flight work, resume prompt,
  durable-scheduler guidance for autonomous mode) — useful after ANY long session.

## Known limitations (honest list)

- **The PR gate only sees what goes through Claude Code's Bash tool.** Creating the PR from
  the GitHub web UI, pushing from another terminal, or any non-Claude workflow bypasses it.
  It is a guardrail for the agent, not a server-side branch protection.
- **`FORGE_ENFORCE=off` disables the hook** (and `warn` makes it advisory). That's by design
  — the owner can always override — but it means enforcement is opt-out, not absolute.
- **The hook spawns `python3` on every Bash tool call** (it exits immediately when the command
  is not `gh pr create/ready/merge`, but the interpreter startup is paid each time).
- One active run per repo: `forge.js init` refuses while another `docs/forge/*/run.json` is
  `active` (override via `FORGE_RUN_MANIFEST`).
- Gates check that artifacts **exist and are non-empty** — they cannot judge content quality.
  That's what the grill lenses and the owner checkpoints are for.
