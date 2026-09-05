---
name: optimize-my-setup
description: "Analyzes the current repo and tailors ALL of its Claude Code config to it — CLAUDE.md, settings.json (permissions/hooks/env), settings.local.json, skills, agents, workflows, .mcp.json and output-styles. Reuses the user's own plugins/skills where they fit (never reinvents), generates custom-made only what's missing, and ALWAYS ends with a multi-check: nothing is applied unless the user ticks it. Use when the user says optimize my setup, invokes /optimize-my-setup, or asks what they should configure."
---

# Optimize my setup

Tailors THIS repo's Claude Code config across **every** surface of the `.claude` directory,
fitted to the project. **The user ALWAYS decides** (multi-check) — nothing is applied without
ticking it.

> **Repo SETUP, not a feature step** (that's `/forge-run`). Run it once, and again when the stack/conventions change.

## Phase 0 — Detect what's installed (verify, don't assume)
Using `claude plugin list`, check which plugins the user has. **This plugin works fully
standalone** — no phase depends on another plugin. If the author's family is installed
(`working-methods`, `forge-methodology`, `design-review`, `token-economy`), leverage it in the
Phase 3 recommendations (they're plugins the user already has → reuse rule). If it isn't, do NOT
require it: keep running the full pipeline and, at most, include it as one more optional
recommendation in the multi-check (never as a prerequisite or item #1).

## Phase 1 — Context pack (run the scanner, do NOT re-scan by hand)

```bash
node "${CLAUDE_PLUGIN_ROOT}/skills/optimize-my-setup/scan.mjs" --md
```

Read the emitted markdown pack. Interpret it — what does this project need, given its ecosystem,
commit convention, branches, existing `.claude` surfaces, and CI? The LLM does NOT redo the
mechanical scan; it adds the semantic interpretation the script cannot.

**Token economy:** the orchestrator reads the pack ONCE and passes it to the Phase 2 sub-agents.
Sub-agents on Sonnet; terse output (`OK`/`KO` + ≤8 words + one-line findings). No preamble.

## Phase 2 — Fan-out by surface (parallel, read-only, terse agents)

Launch **one read-only sub-agent per surface**, in parallel (disjoint areas), each receiving
the context-pack as input and returning `surface · file · recommendation` (1 line per item):

1. **settings** — the repo's real permissions allow-list + applicable hooks + non-secret session env vars.
2. **hooks** — templates from `${CLAUDE_PLUGIN_ROOT}/templates/hooks/` that fit the detected invariants.
3. **agents** — reviewers to generate (one per detected domain invariant: event-bus, i18n,
   append-only, multi-tenant, auth…). Always includes `completeness-critic` (no domain tuning).
4. **mcp** — MCP servers for the detected stack.
5. **skills** — skills/plugins to install (references the original, never reimplements).

## Phase 3 — Recommend per surface

**Rule: if a need fits a plugin/skill the user already has, recommend INSTALLING it** (reference
the original); only generate a custom version for what has no equivalent. Every recommendation
cites a file in the repo. **Everything you GENERATE custom-made (a CLAUDE.md rule, a hook, an
agent, a skill) is an instruction an LLM will execute → run it through the executor-eye check
before proposing it** — reread it through the executor's eyes, without your session's context:
1. **Binary trigger** — every "do X when Y" has a verifiable Y, not a vibe.
2. **No echo** — no rule stated twice (two copies drift on the next edit).
3. **No contradiction** — doesn't clash with config the repo already has or its sibling file.
4. **No tacit assumption** — no step assumes a path/decision/file only your session knows about.

(Canonical extended source: `references/executor-eye-check.md` from the `working-methods` plugin,
if installed.) Covers:

- **`CLAUDE.md`** — generate it if missing; if it exists, targeted improvements + a reference
  block to the marketplace (`${CLAUDE_PLUGIN_ROOT}/templates/claude-md-rules-reference.md`).
- **`settings.json`** — permissions (base: `${CLAUDE_PLUGIN_ROOT}/templates/permissions-allowlist.json`);
  hooks (`${CLAUDE_PLUGIN_ROOT}/templates/hooks/`); non-secret session env vars.
- **`settings.local.json`** — gitignored personal overrides (model, extra permissions). Never secrets.
- **`skills/`** — methodology → `forge-methodology`/`working-methods`; design → `design-review`; etc.
- **`agents/`** — reviewers tuned to the repo (parts of `${CLAUDE_PLUGIN_ROOT}/templates/reviewers/*`) + `completeness-critic`.
- **`workflows/*.js`** — repeatable multi-step orchestration where it applies.
- **`.mcp.json`** — deliver `.mcp.json.example` with `${VAR}` placeholders for secrets (never in git).
- **`output-styles/*.md`** — OUTPUT economy: recommend `token-economy`'s `frugal` (result first, no play-by-play, one closing summary) and/or `caveman` (style compression). They stack.
- **token economy (input+output)** — if the repo orchestrates multi-agent work, recommend installing `token-economy@davidgarciagordo-plugins` (catalog `davidgarciagordo/claude-plugins`): `scripts/context-pack.mjs` (discover-once), a read-only agent template, a pluggable memory adapter, and the `frugal` output-style. It's the single source; the rest of the family inherits it (never duplicated).

**Scope per item:** mark **project** (shared) or **global/user** (all your repos). Secrets never go to git.

## Phase 4 — User multi-check (mechanical gate, MANDATORY)

`AskUserQuestion` with `multiSelect: true`, ≤4 questions per call (more items: several
batches, highest impact first, say how many remain). Each option in the fixed format
`surface · file · effect · scope (project/global) · risk`. The user can tick zero.
**Any Write/Edit/install BEFORE the multi-check returns is FORBIDDEN** —
an unticked recommendation doesn't exist.

## Phase 5 — Apply ONLY what was ticked

For each chosen item, in its correct scope:
- **Generate/write** the real file: tuned reviewers, `settings.json` entries, etc.
- **User's plugins/skills:** install/reference the original — **never copy** its content.
- **Hook contract:** fail-closed — block when in doubt (exit 2 "couldn't verify"), never
  silently allow. Degrade to an explicit warning only where blocking the PR would be disproportionate.
- Summarize what landed, in which scope, and how to revert. What wasn't ticked stays untouched.

> Reuse before generating · the user always decides.
