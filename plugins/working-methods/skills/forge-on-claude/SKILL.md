---
name: forge-on-claude
description: Maps the (vendor-neutral) Forge methodology to concrete Claude Code tools — ultrathink for grill/plan, several Task subagents in one message to orchestrate in parallel, git worktrees for isolation, a chained context pack for shared memory, /handoff as the resume capsule. Use it when running Forge on Claude Code and you need to know which tool to use at each step.
---

# Forge on Claude Code — tool map

> **Declared dependency:** this skill **requires the `forge-methodology` plugin** — it doesn't redefine the methodology, it maps its neutral loop (align+brainstorm → reference-decomposition → draft + grill ×3 → checkpoint #1 → spec → re-grill ×2 → checkpoint #2 → global plan + execution proposal → execute → verify → sign-off; 2 batched owner interruptions) to Claude Code tools. Install it with `/install-family` (or `claude plugin install forge-methodology@davidgarciagordo-plugins`, catalog `davidgarciagordo/claude-plugins`). The command that EXECUTES this map in order is **`/forge-run`**.

Forge is vendor-neutral; this table gives the concrete equivalent in **Claude Code**. It doesn't change the methodology.

| Forge concept (neutral) | In Claude Code |
|---|---|
| **Deep-reasoning tier** (grill ×3, global plan, arbitration, critical review) | **`ultrathink`** in the prompt (deep reasoning) + **Opus** model. |
| **Entry gate + owner gate** (grill doubts → owner decides: accept/change/add/disagree) | **`AskUserQuestion`** with `multiSelect: true` (≤4 questions/call, 2–4 options; recommendation marked "(recommended)"; "Other" = add-your-own / disagree). **Run by the orchestrator, NEVER a subagent** (subagents don't ask the owner). |
| **Orchestrate disjoint units in parallel** | Several **`Task` subagents in one message** (they run in parallel). This is the standard, portable way in Claude Code; if your harness ships its own fan-out orchestrator, you can use it, but don't assume it. |
| **Isolated workspace** (1 unit = 1 workspace) | **git worktree + branch per unit** (`git worktree add`). If the repo has its own flow (e.g. `/new-session`), use it. **1 session = 1 worktree = 1 branch.** |
| **Ownership claim** (declare what you're touching beforehand) | Tracked claim file / visible assignment; subagents in a session = **DISJOINT areas** (one file = one agent only). |
| **Shared context pack** (unified memory, no rediscovery) | Phase 1 = reader subagents that return a **`file:line` map** (structured output); chain those results as **input** to the next phase. Don't make each agent re-read what another already mapped. |
| **Resume capsule** (survives the session) | **`/handoff`** + a `state.md` committed per phase; resuming = reading it, not re-deriving it. |
| **Right capability per unit** (model routing) | **Opus** directs/decides/grills/reviews · **Sonnet** executes closed plans / refactors / migrations · **Haiku** the trivial. |
| **Automate before spending capability** | Scripts/CLI (`rg`, `sed`, `jq`) to search/transform/count before spending tokens. |
| **Independent verify** | **Adversarial** subagents that try to disprove the finding (not the same agent that produced it). |
| **Preventive checkpoint (~80% quota)** | Commit per phase in the worktree; when the limit is hit, the new session resumes from the last checkpoint. |

## Golden rule
**The user always decides**: the global plan is approved before execution, and findings/changes are presented for them to choose (multi-check), never applied blindly. See the full neutral loop in the `forge-methodology` skill.
