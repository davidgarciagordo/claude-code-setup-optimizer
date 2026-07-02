# Executor-eye check — reread instructions as the agent who will run them

**Canonical source. One place; skills reference it, never copy it.**

## Trigger (binary — not "reflect before everything")

Run this check ONLY when the artifact you are about to finalize is an **instruction another agent
(or future-you) will execute**: a skill, an agent/subagent prompt, a slash-command, a spec, a
plan, a rule/CLAUDE.md entry. Ask: *is the output an instruction for someone else to act on?*
**YES → run the 4 checks. NO (product code, a one-off answer, a diff) → skip.**

It is NOT a general "think harder" — those are noise. It is the author-as-consumer pass: read
what you just wrote with the executor's eyes, stripped of the session context only you have.

## The 4 checks (each has a fix, not a feeling)

1. **Binary trigger.** Every "do X when Y" — is Y *verifiable*, or a vibe? A file-count or a
   keyword is often a false binary (">1 file → run the heavy pipeline" fires on every bug sweep).
   State the real discriminator (design-vs-execution, contract-vs-no-contract), not the symptom.
2. **No echo.** Is any rule stated more than once? Two statements drift apart on the next edit.
   Say it once, in the place the executor reads first.
3. **No contradiction.** Do two parts — or this artifact and its sibling (a command vs its skill,
   a reference vs its source) — say incompatible things? An executor entering by either door must
   get the same behavior. Reconcile to one.
4. **No tacit assumption.** Does a step assume context the executor lacks (a path, a prior
   decision, a file that "obviously" exists)? If only your session knows it, the executor fails.
   Name it, or point to where it lives.

## Why it catches what grill/completeness don't

grill attacks *what the plan gets wrong about the world*; completeness checks *coverage vs a
reference*. This checks *whether the instruction is literally executable by a reader without you* —
a different failure class (ambiguous wording, silent redundancy, cross-file contradiction).
