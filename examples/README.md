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

**What you get:** a read-only analysis (detected commit convention, branch naming, ADRs, stack, existing `.claude/` config), then 1–2 recommendations per category, and a **multi-select checklist** to pick what to apply. Nothing is written until you check it. Example of the final step:

```
Which automations should I apply? (pick any, or none)
 ☐ Hook: format-on-edit (prettier on every Edit)            — low risk
 ☐ Hook: guard-append-only (block editing applied migrations)
 ☐ Subagent: messagebus-reviewer (enforce the event bus)
 ☐ Permissions: allow-list (kills ~80% of Bash prompts)
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

## Hooks (passive — they just fire)

| Hook | Trigger | What happens |
|------|---------|--------------|
| `format-on-edit` | you Edit/Write a source file (**any language**) | runs the project's formatter for that file — prettier/biome (JS/TS/CSS/MD), ruff/black (Python), gofmt/goimports (Go), rustfmt (Rust), pint/php-cs-fixer (PHP), rubocop (Ruby), shfmt (shell); silent, never blocks, never installs |
| `guard-append-only` | you try to Edit a committed migration / audit file | blocks with a message: create a new (compensating) file instead |

Override the append-only globs: `APPEND_ONLY_GLOBS="**/drizzle/*.sql,prisma/migrations/**"`.

---

## Subagents (dispatch when relevant)

```
Use the messagebus-reviewer subagent on the changes in modules/booking — check nothing emits events ad-hoc.
```
```
Use the i18n-reviewer subagent on apps/web — find hardcoded UI strings and missing locale keys.
```

**What you get:** a prioritised list (CRITICAL/HIGH/MEDIUM) with file:line and the concrete fix, or an explicit "all clean".

---

## caveman — low-cost comms

```
/caveman full
```
Compresses replies ~75% while keeping full technical accuracy. Code, commits and security stay in normal prose. Turn off with `stop caveman`.
