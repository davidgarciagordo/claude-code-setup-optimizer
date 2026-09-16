---
description: Closes the session and leaves a clean relay for the next one (work that survives the session).
argument-hint: [agreed next objective]
---

# Session Handoff

## FIRST: LIVE conversation or AUTONOMOUS mode? (this decides whether you ask or execute alone)

The handoff is autonomous on BOTH sides — in **requesting** it and in **executing** it — but the
trigger changes depending on whether there's a human present. Detect this before anything else:

- **LIVE (the user is present / responding):** the handoff **NEVER executes without their OK**.
  Auto-propose the relay when it's optimal (binary trigger, below) and **ASK**. If they say yes,
  **execute it yourself, autonomously, in THIS same conversation** — run the whole checklist, don't
  leave the MD half-done or stop after writing it. Asking is mandatory; once approved, execution is yours.
- **AUTONOMOUS (no human watching: cron/`/loop`/background/`$CLAUDE_JOB_DIR`/overnight work):**
  there's no one to ask → **execute the handoff alone** when the block closes (checklist + arm the
  active continuation trigger). Here, writing the MD is a checkpoint, NOT a stop.

**Golden rule: user present → ask (and execute in-session if they say yes); no user → execute alone.**
Never the other way around: don't auto-execute the relay with the owner present without their OK,
and don't sit waiting for input that isn't coming if you're alone.

## Auto-propose the relay — don't wait to be asked (binary trigger, every time you close a milestone)

The owner asking for it is a SHORTCUT, not the trigger. After every merged milestone, evaluate TWO
verifiable signals — if **BOTH** hold, propose the relay yourself, in one sentence:

1. **Long session** (you measure, don't guess): the statusline's `ctx:%` is in the high zone (≳60%),
   **or** you're carrying >1 day / ≥10 PRs of history.
2. **Closed block**: the current work is merged · `git status` clean · 0 PRs/worktrees in flight ·
   the next objective is independent of the accumulated context.

BOTH → one sentence: *"Good moment for a relay — `<milestone>` merged, context at ~X%. New session
with a handoff? Works better than continuing to compact (your own rule)."* Only one → keep working.
A long session with a closed block that does NOT propose a relay is burning the window instead of
starting fresh.

> Note: proposing ≠ executing. You propose; the owner decides. If they say yes → the checklist below.

## AUTONOMOUS mode — arm the continuation, don't wait for them to wake up (mechanism, not a note)

Detect whether there's NO human watching: the session was started by cron/`/loop`, runs in the
background (`$CLAUDE_JOB_DIR` set), or is unattended overnight work. In that mode the handoff MD is a
**checkpoint, NOT a stop.** Writing the MD and stopping leaves the chain broken: a passive document
needs a human to read it and launch the new session — and if you're asleep, that doesn't happen. The
turn's MANDATORY last act is to arm an **active trigger** (this is what a command/skill does NOT do
on its own):

- **Context remains + the session is still alive** → `ScheduleWakeup` / `CronCreate` with the resume
  prompt (below): they re-enter THIS same session after the delay and continue the SAME task.
  **DOUBLE WARNING (verify it, don't assume it):** (1) these tools are **specific to some harnesses,
  NOT a Claude Code standard** — check they exist in your tool list before relying on them; (2) where
  they exist, in many harnesses they are **session-only** — in-memory, they die when the session
  closes (`CronCreate`: "gone when Claude exits", `durable` has no effect). They work to continue
  WHILE the session is alive, **NOT** to survive its death.
- **The session might die / context exhausted** → you need a scheduler that's **DURABLE outside the
  session**: the **`schedule`** skill (cloud routines that run server-side) or an **OS-level / external
  cron** whose prompt is the resume. This is the ONLY thing that starts a NEW session surviving this
  one ending. An in-memory `CronCreate`/`ScheduleWakeup` does **NOT** count here (it dies with the
  session). Check the scheduler's durability BEFORE trusting it with the relay; if it's not durable,
  the relay is lost when it sleeps.

**Hard rule — endings, don't mix them up (the classic bug is treating autonomous+pending as a stop):**

| Situation | Correct action |
|---|---|
| **LIVE** + good moment for a relay | **ASK** the owner; if they say yes, execute the autonomous handoff in-session (do NOT auto-execute without their OK) |
| **AUTONOMOUS** + PENDING work (even with context exhausted) | Execute the handoff alone + **trigger the continuation with a DURABLE scheduler** (cloud `schedule` skill / external cron if the session might die; `ScheduleWakeup`/`CronCreate` only if it's still alive — they're session-only); do NOT stop to wait for a human |
| Closed block + objective met | Actually stop |
| Blocked on human input (auth, an expensive/irreversible decision) | Stop and wait — here, YES, human or not |

### Resume prompt — DETERMINISTIC, executable, idempotent (not a bare "continue")
Imperative and self-sufficient; the new session does NOT re-plan, it resumes against git:
> *Read `docs/.../handoffs/<latest>.md`. Run `git log origin/<base>..HEAD` and `gh pr list` FIRST to
> see what's ALREADY merged (don't redo it). Resume work IN FLIGHT with agents "CONTINUE from
> `<phase>`". Autonomous mode: isolated worktrees, merge in green (YOU verify the tests), commit per
> phase. Return to `/handoff` when each milestone closes.*

### Guardrails (so the overnight auto-start doesn't run out of control)
- **Cycle cap:** max N auto-continuations (e.g. 6) → no infinite loop, no surprise bill.
- **Budget guard:** stop if the turn's token budget runs out.
- **Kill switch:** env flag to disable the re-start without touching the command.
- **Night log:** one line per cycle (what it did) → in the morning you see the trail without rereading everything.
- **Commit per phase** (already in the checklist): the work survives even if a cycle dies mid-way.

## Checklist (create it like all the others)
1. **Background work survives the close:** workflows/agents commit **per phase** in their
   worktree/branch. When it closes, the partial work stays in git → the new session resumes with
   `git log origin/main..HEAD` + "CONTINUE" agents (never redo from scratch).
2. **Write the handoff MD** versioned in the repo (`docs/.../handoffs/YYYY-MM-DD-next-session.md`):
   - **Copy-paste prompt** for the new session (1-2 lines: "read this file and continue" + the working mode).
   - Work IN FLIGHT: where (worktree/branch), what phase it was at, how to resume it.
   - Next objective ($ARGUMENTS) and what NOT to touch.
   - Reference map: status doc, backlog, specs, memory.
3. **State/memory up to date BEFORE closing:** project status doc, backlog, and persistent memory
   (decisions, lessons with PR number, the user's principles). The handoff points, it doesn't duplicate.
4. **Merge the handoff** (the relay doesn't depend on the machine or the session).
5. **PRINT the launch prompt IN-SESSION** (ALWAYS, last step): after writing/merging the MD, drop
   the copy-paste prompt the owner should launch in the new session into the chat, in a fenced block
   (```), ready to copy WITHOUT opening the file. Burying it only in the MD is NOT enough — the owner
   wants it visible in the conversation. In autonomous mode the prompt is what feeds
   `ScheduleWakeup`/`CronCreate` (same text); in live mode it's printed so the owner can paste it. The
   prompt is the same one that goes inside the MD (§ "Copy-paste prompt"): DETERMINISTIC and
   idempotent against git, not a bare "continue".

## Mode the relay inherits
- **Merge in green:** always review before merging; clean up branch/worktree/claim on merge.
- **Models per task:** Opus directs/decides/reviews the critical work · Sonnet executes closed plans · Haiku the trivial.
- **Workflows with unified memory:** phase 1 = context pack with `file:line`; results chained between phases; disjoint areas across parallel agents.
- **Spec → plan → execution;** don't get ahead of work that depends on a state that's still changing.
