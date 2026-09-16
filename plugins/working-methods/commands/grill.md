---
description: Adversarial ×3 grill of a spec/design/plan, with 3 fixed lenses. An assumption not verified against the repo is a finding.
argument-hint: [path to the spec/plan, or describe what to grill]
allowed-tools: Bash(node:*), Task, AskUserQuestion, Read, Grep, Glob
---

# Grill ×3 (adversarial)

Attack the artifact ($ARGUMENTS) with **three lenses ALWAYS**, in parallel (one agent per lens, disjoint areas). Each lens returns a findings report. The orchestrator (Opus) arbitrates conflicts and produces the next version of the spec.

The grill runs **automatically**; two gates capture the owner's judgment without slowing the machine down:

```
A. Entry gate        → high-impact doubts, anchored in code + brief, in ONE multi-select batch.
B. Grill ×3          → the three lenses run automatically. No owner interruption.
C. Owner gate        → the doubts that came up, each with your recommendation + alternatives,
                       for the owner to accept / change / add / disagree — in ONE multi-select batch.
D. Informed re-grill → one more automatic pass with the owner's decisions. Then, conclusions.
```

### A. Entry gate (before the lenses)
Read the artifact and the repo first. A doubt enters the gate ONLY if it meets BOTH: (a) its answer changes the direction of the grill, and (b) it is NOT verifiable by reading the code — **what's verifiable is NOT asked**. ONE `AskUserQuestion` batch, ≤4 questions: each with 2–4 candidate answers, yours recommended first and marked "(recommended)", and "Other" so they can add their own.

### B0. Context-pack — run the script, then hand it to the lenses (cost mechanism, not optional)
Before dispatching the lenses, the orchestrator runs:

```bash
node "${CLAUDE_PLUGIN_ROOT}/workflows/grill-context.mjs" <artifact>
```

This writes `.forge/grill-context.md` deterministically: the target content, the repo map
(`file:line` of ADRs / CLAUDE.md / invariants / domain-keyword matches) and an empty `SHARED-FOUND`
section. **The 3–4 lenses read this pack; they do NOT re-scan the repo or re-derive what
`SHARED-FOUND` already lists.** The LLM only adds semantic relevance the script cannot derive
(e.g. resolving ambiguous terms in the artifact against repo intent); it does NOT redo the
mechanical file scan.

## The 3 lenses (non-negotiable) — READ-ONLY agents, TERSE output
Dispatch them **in parallel as sub-agents with a read-only tool list** (they cannot edit — they only
return findings), passing them `.forge/grill-context.md`. Each agent returns TERSE (`OK`/`KO` +
1-line findings `Pn · file:line · problem → fix`):
1. **`working-methods:grill-architect`** — rules, bounded contexts, precedents; verifies every assumption against the real code, cites `file:line`.
2. **`working-methods:grill-operator`** — the day-to-day counter with bad intent and a rush; broken flows, friction, what the user will do WRONG.
3. **`working-methods:grill-engineer`** — concurrency, idempotency, edge cases, partial failures, what breaks in production.

### 4th lens — Completeness (when there's an Acceptance Matrix)
If you're grilling a spec with an **Acceptance Matrix** (e.g. inside `/forge-run`), add the agent
**`forge-methodology:completeness-critic`** (comes from the `forge-methodology` plugin, a declared
dependency of this plugin — this plugin does NOT ship its own copy; pass it the same pack): does it
cover **every row** of the matrix? Are there **contradictions/gaps in the owner's intent**? Any
uncovered row or contradiction = a finding. Catch the gap BEFORE execution.

## Rules (mechanism, not advice)
- **Binary finding criterion** — only reported if it meets ≥1 of:
  (a) contradicts code/ADR/repo rule, cited `file:line`;
  (b) an artifact assumption unverified against the repo (verifying was possible and wasn't done);
  (c) a concrete scenario naming flow + input + wrong outcome;
  (d) an uncovered Acceptance Matrix row, or a contradiction in the owner's intent.
  Style opinion / preference without evidence / "I'd do it differently" = NOT a finding → don't report it.
- **READ-ONLY lenses** (tool list without Edit/Write): they diagnose, they don't apply anything. The owner
  decides (gate C) and only then is anything applied — outside the grill. A lens that edits skips the gate.
- **Terse output** (enforced in every agent def): 1-line findings, no essays. The sub-agent's last
  message is DATA for the orchestrator, not a human report.
- Model: lenses on Sonnet (sweep); the orchestrator (arbitration + owner gate) on Opus.

## C. Owner gate (after the 3 reports, BEFORE the conclusions)
Don't silently resolve the doubts that come up. For each doubt / contradiction / unverified assumption, work out your **recommended answer + the live alternatives**, and present them as ONE multi-select batch:
- Each item: the doubt in plain language + your recommendation (pre-marked) + the alternatives + the lens(es) that raised it.
- The owner can **accept**, **pick another**, **add their own**, or **disagree** (reject + note).
- Group by severity (blocking → significant → minor) so it's scannable; pre-mark the recommendations.
- `AskUserQuestion` with `multiSelect: true` (≤4 questions/call, 2–4 options; its "Other" = add-your-own / disagree). If more doubts remain, several batches, most critical first, and say how many remain.
- **Run by the orchestrator, NEVER a griller subagent** — subagents can't ask the owner. The lenses produce findings + recommendations; the orchestrator presents them and collects the decisions.

## D. Informed re-grill
Feed in the owner's decisions and run **one more automatic pass**, focused on: the seams the chosen answers open + what the owner disagreed with or added that the lenses didn't consider. Repeat the gate only if the re-grill raises genuinely new blocking doubts — don't drag the owner through what's already closed.

## Output
Three reports + arbitrated synthesis + the **resolved owner gate** (owner decisions on record) + the next version of the spec.
