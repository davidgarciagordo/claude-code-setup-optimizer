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

## The phases (CODIFIED — run in this order, do not reorder)

### 0. Bootstrap & init
- Ensure the family is installed (`/install-family` if needed).
- `forge.js init "$ARGUMENTS"` → creates the run dir + manifest. The PR gate is now armed.

### 1. Align intent  → `intent.md`
- One batch of high-impact questions only (`AskUserQuestion`, `multiSelect`). The value
  question first. Don't interrogate — what you can read from the repo, don't ask.
- Use `superpowers:brainstorming` for the exploration. Write the agreed intent to
  `docs/forge/<slug>/intent.md`. `advance reference-decomposition`.

### 2. Reference decomposition  → `references.md`  (the **Reference Standard**)
- Decompose the task against **reference implementations / de-facto standards** (competitor
  analysis, the bar the result must clear). Fan out research subagents (Sonnet) over
  disjoint segments; verify key claims adversarially. Synthesise the **Reference Standard**
  the spec must meet into `references.md`. `advance spec`.

### 3. Spec  → `spec.md` + **`acceptance-matrix.md`**
- Write the spec against the Reference Standard (`forge-methodology` / `superpowers:writing-plans`).
- Build the **Acceptance Matrix**: one row per requirement / acceptance criterion, columns
  `[ criterion | source (reference/owner) | how-verified | status ]`. This is the
  machine-readable Definition of Done that `verify` and `completeness-critic` check against.
- Both files are the gate to grilling. `advance grill`.

### 4. Grill ×3 + 4th completeness lens  → `grill.md`
- Run **`/grill docs/forge/<slug>/spec.md`** — three fixed lenses (architect · operator ·
  engineer), each citing `file:line`, plus a **4th lens: completeness** — does the spec cover
  every row of the Acceptance Matrix? any contradictions / gaps in the owner's own intent?
  (the completeness-critic's remit, applied here at spec time).
- The owner gate inside `/grill` resolves the findings. Write the arbitrated acta to
  `grill.md`. `advance plan`.

### 5. Global plan  → `plan.md`  (**owner approval gate**)
- Plan **all** phases of the work globally, no holes (`superpowers:writing-plans`). Name what
  is explicitly OUT of scope.
- **Owner sign-off is a hard gate:** present the plan + the decisions that need the owner's
  input (`AskUserQuestion`); do not proceed to execution until approved. Write `plan.md`.
  `advance execute`. (Execution's gate now requires spec + matrix + grill + plan — the hook
  will block a PR otherwise.)

### 6. Execution  → `context-pack.md`
- `forge-on-claude`: **one git worktree + branch per disjoint unit**, subagents over
  **disjoint areas** (one file = one agent). Phase-1 reader subagents return a **context pack**
  with `file:line`; chain it as the shared memory so nothing is re-discovered. Commit per
  phase so work survives the session.
- Execute the closed plan mechanically (Sonnet). `advance verify`.

### 7. Verify  → `verify.md`  (reviewers + completeness-critic + design-review)
This phase APPLIES design-review and the generated reviewers — it does not just suggest them:
- **Generated reviewers:** dispatch the repo's tuned reviewer subagents (event-bus, i18n,
  tenant-isolation, append-only… whatever `optimize-my-setup` generated) over the diff.
- **completeness-critic:** dispatch the `completeness-critic` agent — every Acceptance Matrix
  row satisfied? any regression / contradiction / gap vs the owner's intent? Flip each matrix
  row's status to pass/fail with evidence.
- **design-review (conditional, codified):** if `git diff --name-only` touches UI globs
  (`*.tsx`, `*.jsx`, `*.vue`, `*.svelte`, `*.css`, components/pages/app dirs, emails/MJML),
  **invoke the `design-review` skill** on the changed surfaces (Storybook story or route).
  Adversarial verify: the reviewer is never the agent that wrote the code.
- Write the verdict + matrix status to `verify.md`. `advance handoff`.

### 8. Handoff  → `handoff.md`
- Run **`/handoff`**: versioned relay MD (copy-paste prompt for the next session, in-flight
  work, next goal, what NOT to touch), state/memory up to date.
- `forge.js complete` → the run closes and the PR gate stops enforcing it.

---

## Rules (non-negotiable)
- **The order is codified, not remembered.** Use `forge.js gate`/`advance`; never hand-wave a phase.
- **Artifacts are versioned** in `docs/forge/<slug>/` — they are the gate and the memory.
- **The owner always decides:** plan approval (phase 5) and the grill findings (phase 4) are
  hard gates; never apply what the owner didn't pick.
- **A PR cannot leave** without spec + grill acta + Acceptance Matrix + plan on disk — the
  hook enforces it. Finish the run (`complete`) when genuinely done.
