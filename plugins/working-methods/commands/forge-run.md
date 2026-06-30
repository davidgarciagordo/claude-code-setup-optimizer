---
description: THE entrypoint. Runs a task through the whole Forge methodology in CODIFIED order with machine-checked gates — align → reference-decomposition → spec (+ Acceptance Matrix) → grill ×3 + completeness → global plan (owner sign-off) → execution (worktrees + context pack) → verify (reviewers + completeness-critic + design-review on UI) → handoff. Not a prose checklist you have to remember.
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

> **Prerequisite (run once):** the four-plugin family must be present. If unsure, run
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
- `ultrathink` for every reasoning-heavy phase (grill, plan, arbitration, verify).
- Model routing: **Opus** directs / decides / grills / reviews critical work ·
  **Sonnet** executes closed plans / refactors / migrations · **Haiku** the trivial.
- Phase 4 (grill): dispatch the bundled `completeness-critic` agent (`agents/completeness-critic.md`)
  as the 4th lens when an Acceptance Matrix exists. The owner gate of `/grill` (gate C) already
  presents the spec's open decisions as a multi-select with your recommendation pre-marked.
- Phase 5 (plan · owner sign-off): **give the owner a voice on the plan the same way `/grill` gate C
  does — not a bare approve/reject.** After writing `plan.md`, surface its real decision points
  (phasing/cuts/sequencing/tradeoffs and any plan-level alternatives) as ONE `AskUserQuestion`
  (`multiSelect: true`): each item = the decision in plain language + **your recommendation pre-marked**
  + the live alternatives; the owner may accept / pick another / add their own / disagree. Group by
  impact (blocking → significant → minor); ≤4 questions/call, several batches if needed (most critical
  first). `advance execute` only AFTER the owner has signed off the chosen options — never apply a plan
  decision the owner didn't pick.
- Phase 7 (verify): if `git diff --name-only` touches UI globs (`*.tsx`, `*.jsx`, `*.vue`,
  `*.svelte`, `*.css`, components/pages/app dirs, emails/MJML), **invoke `design-review`** on
  those surfaces. Adversarial verify: the reviewer must not be the agent that wrote the code.

---

## Rules (non-negotiable)
- **The order is codified, not remembered.** Use `forge.js gate`/`advance`; never hand-wave a phase.
- **Artifacts are versioned** in `docs/forge/<slug>/` — they are the gate and the memory.
- **The owner always decides:** plan approval (phase 5) and the grill findings (phase 4) are
  hard gates; never apply what the owner didn't pick.
- **A PR cannot leave** without spec + grill acta + Acceptance Matrix + plan on disk — the
  hook enforces it. Finish the run (`complete`) when genuinely done.
