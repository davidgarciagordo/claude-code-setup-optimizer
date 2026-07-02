---
description: Repo setup (run once) — analyse this repo's whole .claude config and let you pick what to apply. Thin command wrapper around the optimize-my-setup skill, so it's invocable deterministically as a slash command. NOT part of a feature run; bootstrap once.
argument-hint: [optional focus, e.g. "git flow, secrets, fewer prompts"]
allowed-tools: Skill, Read, Glob, Grep, Bash(git log:*), Bash(git branch:*), Bash(node:*), Bash(claude plugin:*), AskUserQuestion, Write, Edit
---

# /optimize-my-setup — one-time repo setup

This is **repo setup**, not a step of building a feature. Run it **once** (and again when
your stack/conventions change). It is intentionally separate from `/forge-run`: the spine
assumes your `.claude` config already exists.

## Phase 0 — Family bootstrap check (verify, don't assume)

Before any recommendation, verify the **five-plugin family** is installed —
`working-methods`, `automations`, `forge-methodology`, `design-review`, `token-economy` —
with `claude plugin list`. If any is missing, recommending `/install-family` is the first
item in the multi-select. (Same order as the skill: family check comes FIRST.)

## Phase 1 — Context pack (run the script, do NOT re-scan by hand)

```bash
node "${CLAUDE_PLUGIN_ROOT}/skills/optimize-my-setup/scan.mjs" --md
```

Read the emitted markdown context-pack. Interpret it — infer what the project needs based
on the detected ecosystem, commit convention, branches, existing `.claude` surfaces, and CI.
Do NOT re-scan the repo by hand; the script already did the mechanical pass.

## Phase 2 — Surface fan-out (parallel read-only terse analyzers)

Dispatch **one read-only terse sub-agent per surface** in parallel (disjoint scopes; each
receives the context-pack as input, returns `OK`/`KO` + terse recommendations):

1. **settings** — permissions allowlist + hooks wiring + env vars
2. **hooks** — which hook templates apply to this repo's invariants
3. **agents** — which reviewer agents to generate (one per domain invariant detected)
4. **mcp** — MCP servers for the detected stack
5. **skills** — which skills/plugins to install or generate

Each sub-agent outputs: `surface · file · recommendation` (one line per item). No essays.
The orchestrator consolidates before presenting choices.

## Phase 3 — Recommend per surface

Consolidate the fan-out into recommendations, each citing a repo file. Reuse before
generating: if a need fits one of the user's plugins/skills, recommend INSTALLING it
(reference the original); generate bespoke only what has no equivalent.

## Phase 4 — You pick (multi-select)

Present everything as **multi-select** (`AskUserQuestion`, `multiSelect: true`): one option
per item with surface + effect + scope (project/global) + risk. Nothing is applied until you
check it.

## Phase 5 — Apply only what you chose

Apply in the correct scope. Reuse antes de generar — if a need fits a plugin, reference
the original; do not copy its content. For hooks: fail-closed contracts (block on doubt,
not silent-allow). Summarise what was applied and how to revert.

> Don't confuse this with `/forge-run`. `/optimize-my-setup` configures the workshop;
> `/forge-run` builds with it.
