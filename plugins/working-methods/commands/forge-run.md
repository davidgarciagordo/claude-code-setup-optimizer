---
description: THE entrypoint. Runs a task through the whole Forge methodology in CODIFIED order with machine-checked gates — align+brainstorm → reference-decomposition → DRAFT + grill ×3 (attack while changing is cheap) → owner checkpoint #1 → versioned spec (+ Acceptance Matrix) → re-grill ×2 → owner checkpoint #2 (spec locked) → global plan + execution proposal → execution (worktrees + context pack) → verify (reviewers + completeness-critic + design-review on UI) → handoff. Exactly 2 owner interruptions, both batched. Not a prose checklist you have to remember.
argument-hint: <task — what to build / change>
allowed-tools: Bash(node:*), Bash(git worktree:*), Bash(git status:*), Bash(git diff:*), Bash(git log:*), Bash(mkdir:*), Read, Write, Edit, Glob, Grep, Task, AskUserQuestion, Skill
---

# /forge-run — the spine of the whole methodology

`$ARGUMENTS` is the task. This command **sequences and enforces** the Forge loop. The
order is not advice in a README — it lives in `workflows/forge.js` (single source of
truth) and is gated by the `guard-forge-artifacts` hook. You do not improvise the order
and you do not skip a phase: each phase **invokes** the real command / skill / agent
(it APPLIES `forge-methodology` and `design-review`, it does not merely recommend
installing them).

> **Prerequisite (run once):** the five-plugin family (working-methods, automations,
> forge-methodology, design-review, token-economy) must be present. If unsure, run
> `/install-family` first (or `/optimize-my-setup`). `forge-on-claude` (this plugin)
> tells each phase which Claude Code tool to use; it delegates to the `forge-methodology`
> skill for the neutral loop.

## How to drive it

Use `forge.js` as the deterministic conductor — it prints the spine, opens/closes gates,
and writes the run manifest the PR hook checks:

```bash
node "${CLAUDE_PLUGIN_ROOT}/workflows/forge.js" phases          # the codified order
node "${CLAUDE_PLUGIN_ROOT}/workflows/forge.js" init "$ARGUMENTS"  # create docs/forge/<slug>/run.json
node "${CLAUDE_PLUGIN_ROOT}/workflows/forge.js" status          # where am I, is the next gate open
node "${CLAUDE_PLUGIN_ROOT}/workflows/forge.js" gate <phase>    # exit 2 if you'd skip an artifact
node "${CLAUDE_PLUGIN_ROOT}/workflows/forge.js" advance <phase> # record entry (blocked if gate shut)
node "${CLAUDE_PLUGIN_ROOT}/workflows/forge.js" complete        # at the end; stops PR enforcement
```

All artifacts are **versioned** under `docs/forge/<slug>/` so the run survives the session
and the gate can check them. After producing a phase's artifact, `advance` to the next
phase; if you try to advance with the gate shut, `forge.js` refuses (exit 2).

`ultrathink` for every reasoning-heavy phase (grill, plan, arbitration, verify). Model
routing: **Opus** directs / decides / grills / reviews · **Sonnet** executes closed plans /
refactors / migrations · **Haiku** the trivial. See `forge-on-claude` for the tool map.

---

## The phases

Run `node "${CLAUDE_PLUGIN_ROOT}/workflows/forge.js" phases` — it prints the codified order
with gate-in requirements, expected artifacts, and the command/skill/agent each phase invokes.
Follow that output. The single source of truth lives in `forge.js`; do not re-narrate it here.

Drive each phase by invoking its listed command/skill/agent, producing its artifact(s) in
`docs/forge/<slug>/`, then calling `advance <nextPhase>` to open the next gate.

**Execution notes that forge.js does not carry** (forge-run-specific):
- `ultrathink` for every reasoning-heavy phase (grill, regrill, plan, arbitration, verify).
- Model routing: **Opus** directs / decides / grills / reviews critical work ·
  **Sonnet** executes closed plans / refactors / migrations · **Haiku** the trivial.
- Phase `draft` + `grill`: the grill attacks the **DRAFT**, not a finished spec — that is the
  point (attack while changing is cheap). Dispatch the 3 lenses + the bundled
  `working-methods:completeness-critic` agent as the 4th lens (a reference requirement not
  covered by the draft is a blocking finding). Verdicts → `grill-verdicts.md`.
- Phase `checkpoint-1` (owner checkpoint #1): **ONE `AskUserQuestion` (`multiSelect: true`)** —
  each item = a real decision the grill exposed, in plain language, with **your recommendation
  pre-marked** + the live alternatives; the owner may accept / pick another / add their own /
  disagree. Group by impact (blocking → significant → minor); ≤4 questions/call, several batches
  only if needed (most critical first). Record the outcome in `decisions-1.md`. Run by the
  orchestrator, never a subagent.
- Phase `spec`: integrate draft + grill verdicts + owner decisions into the formal spec; the
  **Acceptance Matrix is the canonical DoD** (`req-id | source | in-scope? | built? | evidence |
  verified-by ≠ executor`) plus explicit Non-goals.
- Phase `regrill`: two focused passes on the SPEC — (a) do the checkpoint-1 fixes hold, (b) the
  new seams those fixes created + re-verify assumptions against the real repo. Not a third full
  grill. Verdicts → `regrill-verdicts.md`.
- Phase `checkpoint-2` (owner checkpoint #2): same mechanism as checkpoint-1 — **ONE multi-select
  batch, recommendations pre-marked** — covering the re-grill outcomes and the remaining
  owner-only calls (cut lines, phasing v1/v1.1/v2, budget). After this gate the spec is
  **locked**; record in `decisions-2.md`. These are the ONLY two owner interruptions of the run.
- Phase `plan`: global plan (all units, all phases, no gaps) **plus an execution proposal** —
  multi-agent by default when units are disjoint: isolated worktrees per writer, ONE shared
  context pack (file:line), read-only+terse diagnosis lenses, the right model tier per unit,
  deterministic tools before model effort. One line per phase; the owner already decided
  everything at the checkpoints.
- Phase `verify`: **audit the matrix, not the diff** — every in-scope row built + evidenced +
  verified by someone ≠ executor. If `git diff --name-only` touches UI globs (`*.tsx`, `*.jsx`,
  `*.vue`, `*.svelte`, `*.css`, components/pages/app dirs, emails/MJML), **invoke `design-review`**
  on those surfaces. Adversarial verify: the reviewer must not be the agent that wrote the code.

---

## Rules (non-negotiable)
- **The order is codified, not remembered.** Use `forge.js gate`/`advance`; never hand-wave a phase.
- **The draft is grilled BEFORE the spec exists** — never write the formal spec first and grill it after.
- **Artifacts are versioned** in `docs/forge/<slug>/` — they are the gate and the memory.
- **The owner decides at exactly two checkpoints** (`checkpoint-1`, `checkpoint-2`), each ONE
  multi-select batch with recommendations pre-marked; never apply what the owner didn't pick,
  never interrupt them outside those gates.
- **A PR cannot leave** without spec + Acceptance Matrix + both grill verdicts + both decision
  records + plan on disk — the hook enforces it. Finish the run (`complete`) when genuinely done.
