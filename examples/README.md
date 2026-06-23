**English** | [Español](README.es.md)

# claude-code-setup-optimizer — Usage Examples

> Copy-paste prompts showing how to drive each plugin: the optimizer skill, the commands, the hooks, and the subagents.

These are real invocations — paste one into Claude Code after installing the marketplace. Each shows what to type and what you get back.

---

## `/optimize-my-setup` — analyse repo, you choose what to apply

**Short** — let it analyse and recommend:

```
/optimize-my-setup
```

**Structured** — point it at concerns you care about:

```
/optimize-my-setup

Focus: git flow (we use Conventional Commits + trunk-based), secrets safety, and cutting permission prompts.
Stack: pnpm monorepo, NestJS + Next.js, Drizzle/Postgres.
```

**Language-agnostic:** works the same on a Python/Django, PHP/Laravel, Go, Rust or Ruby repo — it detects the stack from `pyproject.toml`/`composer.json`/`go.mod`/`Cargo.toml`/`Gemfile`/`package.json` and tailors the recommendations (formatter, test runner, lint hook) to that ecosystem.

**What it covers:** the *whole* `.claude` surface, tailored to your repo — `CLAUDE.md`, `settings.json` (permissions/hooks/env), `settings.local.json`, skills, **agents it generates per detected invariant**, `workflows/*.js`, `.mcp.json`, `output-styles`. Where a need matches one of your plugins it recommends installing the original instead of reinventing.

**What you get:** a read-only analysis (commit convention, branch naming, ADRs, stack, domain invariants, existing `.claude/` config), then 1–2 recommendations per surface, and a **multi-select checklist** to pick what to apply — each tagged with its scope (project / global). Nothing is written until you check it. Example of the final step:

```
Pick what to apply (any, or none) — each shows [surface · scope]:
 ☐ [CLAUDE.md · project]   add a rules block referencing your methodology marketplace
 ☐ [settings.json · project] permissions allow-list (kills ~80% of Bash prompts)
 ☐ [hook · project]        commit-msg lint enforcing your Conventional Commits
 ☐ [hook · project]        guard-append-only (block editing applied migrations)
 ☐ [agent · project]       GENERATE event-bus-reviewer tuned to your bus (ADR-xxxx)
 ☐ [.mcp.json · project]   add Supabase + GitHub MCP (.example, secrets via ${VAR})
 ☐ [skill · user]          install design-review@… for UI work (original)
 ☐ [output-style · global] terse mode for long sessions
```

---

## `/grill` — adversarial ×3 on a spec or plan

```
/grill docs/specs/2026-checkout-redesign.md
```

**What you get:** three independent critiques — **architect** (rules, precedents, verified against the code with file:line), **operator** (day-to-day reality, what breaks at the counter), **engineer** (concurrency, edge cases, failure under load) — plus an arbitrated synthesis and the decisions that need your input.

---

## `/handoff` — close a session so work survives

```
/handoff next: finish the Expo M1 plan, don't touch the billing module
```

**What you get:** a versioned handoff MD (copy-paste prompt for the next session, in-flight work and how to resume it, the next goal, what NOT to touch) + a reminder to bring state/memory up to date before closing.

---

## `/release` — PR from integration branch to production

```
/release v1.4.0
```

**What you get:** release notes generated from `git log <main>..<dev>`, grouped by commit type, breaking changes flagged, and a `dev → main` PR created (not merged — release is a human gate).

---

## Hook (passive — it just fires)

| Hook | Trigger | What happens |
|------|---------|--------------|
| `guard-append-only` | you try to Edit a committed migration / audit file | blocks with a message: create a new (compensating) file instead — append-only discipline |

Override the append-only globs: `APPEND_ONLY_GLOBS="**/drizzle/*.sql,prisma/migrations/**"`.

---

## Domain reviewers — generated per repo, then dispatched

`optimize-my-setup` does **not** ship fixed reviewers. It detects your repo's invariants and, if you pick them, **generates tuned reviewer agents into your `.claude/agents/`** (adapting `templates/reviewers/*` to your real names, paths and ADRs). Once generated, dispatch them like any subagent:

```
Use the event-bus-reviewer subagent on the changes in <module> — check nothing emits events ad-hoc.
```
```
Use the i18n-reviewer subagent on <app> — find hardcoded UI strings and missing locale keys.
```

Examples of invariant → generated reviewer: event bus → `event-bus-reviewer` · i18n catalogs → `i18n-reviewer` · append-only migrations → migration guard · multi-tenancy → tenant-isolation reviewer.

**What you get:** a prioritised list (CRITICAL/HIGH/MEDIUM) with file:line and the concrete fix, or an explicit "all clean".

---

## 🎯 One prompt for all — a full Forge-on-Claude run

Each section above runs **one** skill on its own. To drive the whole methodology in a single go, compose them:

```
ultrathink. Run this through the Forge end to end:

Task: <your task>
1. /optimize-my-setup first — detect my stack, commit convention and ADRs, and apply only the automations I confirm.
2. Spec it, then /grill the spec ×3 (architect · operator · engineer); resolve the findings.
3. Plan globally; execute disjoint units, each in its own git worktree (forge-on-claude), sharing ONE context pack (file:line) so nothing gets re-discovered.
4. Verify against the definition of done with adversarial subagents (messagebus-reviewer / i18n-reviewer where relevant).
5. /handoff at the end so the next session resumes cleanly.
Show me the decisions that need my input; never apply anything I didn't pick.
```

This chains `optimize-my-setup` → `/grill` → `forge-on-claude` (worktrees + context pack) → reviewers → `/handoff`. Pick any single section above to run that piece standalone instead.

---

## caveman — low-cost comms *(original plugin)*

caveman is **not bundled** here — install the original ([JuliusBrussee/caveman](https://github.com/JuliusBrussee/caveman)) and toggle it:

```
/caveman full
```
Compresses replies ~75% while keeping full technical accuracy. Code, commits and security stay in normal prose. Turn off with `stop caveman`.
