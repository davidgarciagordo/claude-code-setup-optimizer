**English** | [Español](README.es.md)

# claude-code-setup-optimizer — Usage Examples

> Copy-paste prompts showing how to drive each plugin: the optimizer skill, the commands, the hooks, and the subagents.

These are real invocations — paste one into Claude Code after installing the marketplace. Each shows what to type and what you get back.

---

## `/forge-run` — THE entrypoint (the codified spine)

For any substantial task, this is the one command. It **sequences and enforces** the whole
methodology — you don't drive the order by hand, and you can't skip a phase.

```
/forge-run add idempotency keys to the payments charge endpoint
```

**What it does, in this fixed order (gates are machine-checked):**

```
0.  init          → docs/forge/<slug>/run.json   (arms the PR gate)
1.  align         → intent.md            (brainstorm + one batch of high-impact questions)
2.  references    → references.md        (Reference Standard → enumerated req-ids)
3.  draft         → draft.md             (concrete design sketch — cheap to change)
4.  grill ×3      → grill-verdicts.md    (/grill ON THE DRAFT: architect · operator · engineer · completeness)
5.  checkpoint-1  → decisions-1.md       (OWNER: one multi-select batch, recommendations pre-marked)
6.  spec          → spec.md + acceptance-matrix.md   (the verifiable Definition of Done)
7.  regrill ×2    → regrill-verdicts.md  (do the fixes hold? + the new seams)
8.  checkpoint-2  → decisions-2.md       (OWNER: one multi-select batch — spec locked)
9.  plan          → plan.md + execution-proposal.md  (global plan; multi-agent by default)
10. execute       → context-pack.md      (worktrees + disjoint subagents + shared context pack)
11. verify        → verify.md            (reviewers + completeness-critic + design-review on UI diffs)
12. handoff       → handoff.md           (/handoff; then `forge.js complete`)
```

**What you get:** every artifact versioned under `docs/forge/<slug>/`, so the run survives the
session. A PR is **blocked** (by the `guard-forge-artifacts` hook) until spec + Acceptance
Matrix + both grill verdicts + both decision records + plan exist. The order lives in `plugins/working-methods/workflows/forge.js`,
not in a prompt you have to remember. Inspect it anytime:

```bash
node "$CLAUDE_PLUGIN_ROOT/workflows/forge.js" phases   # print the spine
node "$CLAUDE_PLUGIN_ROOT/workflows/forge.js" status   # where am I, is the next gate open
```

---

## `/install-family` — bootstrap the five plugins (run once)

```
/install-family
```

**What you get:** the marketplace added (idempotent), a check of what's installed, and the
missing members of the family (`working-methods`, `automations`, `forge-methodology`,
`design-review`) installed — so `/forge-run` has every phase's tool present. `working-methods`
(`forge-on-claude`) **requires** `forge-methodology`; the verify phase calls `design-review`.

---

## `/optimize-my-setup` — analyse repo, you choose what to apply  *(one-time setup)*

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

## Hooks (passive — they just fire)

**Active in the plugins:**

| Hook | Trigger | What happens |
|------|---------|--------------|
| `guard-append-only` (automations) | you try to Edit a committed migration / audit file | blocks: create a new (compensating) file instead. **fail-closed** — if it can't verify git state it blocks ("could not verify"), never silently allows. |
| `guard-forge-artifacts` (working-methods) | `gh pr create` / `gh pr ready` / `gh pr merge` while a Forge run is active | blocks until `spec.md` + `acceptance-matrix.md` + `grill-verdicts.md` + `decisions-1.md` + `regrill-verdicts.md` + `decisions-2.md` + `plan.md` are versioned. No active run → no-op. `FORGE_ENFORCE=warn\|off` to soften. |

Override the append-only globs: `APPEND_ONLY_GLOBS="**/drizzle/*.sql,prisma/migrations/**"`.

**Shipped as templates** (`plugins/automations/templates/hooks/` — `optimize-my-setup` wires the ones you pick; or copy by hand, see that folder's README):

| Template hook | Event | Enforces | Env |
|---------------|-------|----------|-----|
| `guard-main` | PreToolUse · Bash | no commit/push direct to a protected branch | `PROTECTED_BRANCHES` |
| `commit-msg-lint` | PreToolUse · Bash | `git commit -m` follows Conventional Commits | `COMMIT_TYPES` |
| `secrets-guard` | PreToolUse · Edit/Write | blocks writing secrets into the repo | `SECRETS_ALLOW_GLOBS` |
| `ui-diff-design-review` | PostToolUse · Edit/Write | **fires** `design-review` on a UI diff (not just recommends) | `UI_GLOBS` |

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

## 🎯 The whole methodology in one go → that's `/forge-run`

It used to be a copy-paste prompt here that you had to remember and run by hand — which meant
the order got skipped. **That prompt is now a command: `/forge-run` (top of this page).** It
chains the same pieces — `optimize-my-setup`/`install-family` for setup → draft + `/grill` ×3 +
completeness → owner checkpoint #1 → spec + Acceptance Matrix → re-grill ×2 → owner checkpoint #2 →
global plan + execution proposal → `forge-on-claude` (worktrees + shared context pack) → reviewers +
`completeness-critic` + `design-review` on UI → `/handoff` — but the **order is codified** in
`workflows/forge.js` and **gated** by the `guard-forge-artifacts` hook, not left to memory.

```
/forge-run <your task>
```

Run any single section above standalone instead when you only need that one piece. `ultrathink`
is applied automatically by `/forge-run` for the reasoning-heavy phases (grill, plan, verify).

---

## caveman — low-cost comms *(original plugin)*

caveman is **not bundled** here — install the original ([JuliusBrussee/caveman](https://github.com/JuliusBrussee/caveman)) and toggle it:

```
/caveman full
```
Compresses replies ~75% while keeping full technical accuracy. Code, commits and security stay in normal prose. Turn off with `stop caveman`.
