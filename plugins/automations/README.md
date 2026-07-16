**English** | [Español](README.es.md)

# ⚡ automations — tailor a repo's whole Claude Code setup, you tick what applies

One command — `/optimize-my-setup` — scans the repo deterministically, fans out one read-only
agent per `.claude` surface, and presents **every** recommendation as a multi-select checklist.
Nothing touches disk until you tick it.

## Why not just `/init`?

`/init` writes you a `CLAUDE.md`. That's one surface out of eight, and it applies its own output.

| | Vanilla `/init` | `automations` `/optimize-my-setup` |
|---|---|---|
| Surfaces covered | 1 (`CLAUDE.md`) | 8 — `CLAUDE.md`, `settings.json` (permissions/hooks/env), `settings.local.json`, `skills/`, `agents/`, `workflows/`, `.mcp.json`, `output-styles/` |
| How the repo is analysed | Model reads around | Deterministic `scan.mjs` (no deps, stable output) + per-surface read-only agents interpreting the pack |
| Who decides what's applied | Applies as it goes | **Multi-check gate**: every item is a checkbox; unchecked = untouched |
| Enforcement | Prose advice | Fail-closed hooks (exit 2 on "couldn't verify", never silent allow) |
| Domain reviewers | None | **Generated per repo** from templates, one per detected invariant |
| Existing plugins/skills | Ignores them | Reuse-before-generate: recommends installing the original, never copies it |

## What's inside

| Piece | Path | What it does |
|---|---|---|
| Skill `optimize-my-setup` | `skills/optimize-my-setup/SKILL.md` | The 5-phase pipeline: detect installed plugins → context pack → per-surface fan-out → **mandatory multi-check** → apply only what's ticked |
| Deterministic scanner | `skills/optimize-my-setup/scan.mjs` | Repo → context pack (ecosystem, commit convention, branches, `.claude` surfaces, CI, domain invariants from `CLAUDE.md` **+ code signals**). No deps, no randomness — same repo, same output |
| Command `/optimize-my-setup` | `commands/optimize-my-setup.md` | Thin slash-command wrapper around the skill (single source — it doesn't re-derive the phases) |
| Command `/release` | `commands/release.md` | Integration → production release PR with human-readable notes; reads the real branch names from the scanner pack instead of assuming `dev → main` |
| Active hook `guard-append-only` | `hooks/guard-append-only.py` | Ships enabled. Blocks editing committed append-only files (applied migrations, ledgers). **Fail-closed**: can't verify git state → blocks with exit 2 |
| Hook templates ×4 | `templates/hooks/` | `guard-main` (no direct commit/push to protected branches), `commit-msg-lint` (Conventional Commits), `secrets-guard` (11 secret patterns), `ui-diff-design-review` (UI diff fires a design review). Wiring guide in `templates/hooks/README.md` |
| Reviewer templates ×5 | `templates/reviewers/` | `completeness-critic` (generic, usable as-is) + 4 domain reviewers the skill **adapts per repo**: `ds-adoption-reviewer`, `defense-and-coverage-reviewer`, `event-bus-reviewer`, `i18n-reviewer` |
| Permissions allowlist | `templates/permissions-allowlist.json` | Read-only + safe-dev commands base to kill repeated permission prompts; adapt to your ecosystem |
| CLAUDE.md rules block | `templates/claude-md-rules-reference.md` | Template for referencing your always-on norms from a repo's `CLAUDE.md` (point, don't copy) |

## 60-second demo

```
/optimize-my-setup
```

The scanner runs, five read-only agents report, and you get a multi-select like:

```
Pick what to apply (0..n) — unchecked items are not touched:

[ ] settings · .claude/settings.json · allowlist for git/gh/pnpm read-only cmds · project · low
[ ] hooks    · .claude/hooks/guard-main.py · block direct commit/push to main · project · low
[ ] agents   · .claude/agents/i18n-reviewer.md · generated for locales/{en,es} + t() · project · low
[ ] mcp      · .mcp.json.example · postgres MCP with ${DATABASE_URL} placeholder · project · med

3 more items in the next batch (skills, output-styles, CLAUDE.md).
```

Tick two, leave the rest — only those two files are written, each with scope and a revert note.

## The multi-check guarantee

The gate is a hard rule in the skill (`skills/optimize-my-setup/SKILL.md`, Fase 4), quoted verbatim:

> **PROHIBIDO cualquier Write/Edit/instalación ANTES de que el multi-check devuelva** —
> una recomendación sin marcar no existe.

("Any Write/Edit/install BEFORE the multi-check returns is FORBIDDEN — an unchecked
recommendation does not exist.") You can tick zero items and walk away with an unchanged repo.

## Design principles

- **Deterministic scan.** The mechanical part (ecosystem, branches, commit convention,
  invariants) is a dependency-free script, not model guesswork — same input, same pack. The
  model only adds the semantic layer on top.
- **Fail-closed hooks.** A guard that cannot verify its precondition blocks (exit 2 with
  "couldn't verify"), it never allows silently. `guard-append-only.py` documents its honest
  limitation too: it hooks Edit/Write, not Bash mutations.
- **Reuse before generate.** A need that an existing plugin/skill already covers becomes
  "install the original" — content is referenced, never vendored, so it stays current at its
  source and authors keep credit.
- **Reviewers are generated, not shipped.** The plugin ships reviewer *templates*; the skill
  instantiates one agent per invariant it actually detects (multi-tenant, i18n, event bus,
  append-only…), tuned with the repo's real package names, tables and paths. No fixed agents
  polluting every project.

## Standalone vs the family

**Everything here works standalone** — no other plugin is a prerequisite. If the author's wider
family is installed (`working-methods`, `forge-methodology`, `design-review`, `token-economy`),
the skill reuses it where it fits: `/forge-run` as the build spine, `design-review` fired by the
`ui-diff-design-review` hook, `token-economy`'s frugal output-style and context-pack helpers.
Family missing → the pipeline runs complete anyway, and installing the family is at most one
more optional item in the multi-check.

Install:

```bash
/plugin marketplace add davidgarciagordo/claude-code-setup-optimizer
/plugin install automations@claude-code-setup-optimizer
```

---
<sub>Part of [claude-code-setup-optimizer](../../README.md) · Made by
[David García Gordo](https://github.com/davidgarciagordo) · MIT</sub>
