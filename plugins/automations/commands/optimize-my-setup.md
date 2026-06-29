---
description: Repo setup (run once) — analyse this repo's whole .claude config and let you pick what to apply. Thin command wrapper around the optimize-my-setup skill, so it's invocable deterministically as a slash command. NOT part of a feature run; bootstrap once.
argument-hint: [optional focus, e.g. "git flow, secrets, fewer prompts"]
allowed-tools: Skill, Read, Glob, Grep, Bash(git log:*), Bash(git branch:*), AskUserQuestion, Write, Edit
---

# /optimize-my-setup — one-time repo setup

This is **repo setup**, not a step of building a feature. Run it **once** (and again when
your stack/conventions change). It is intentionally separate from `/forge-run`: the spine
assumes your `.claude` config already exists.

Invoke the skill that does the work:

> Use the **`optimize-my-setup`** skill on this repo. Focus: `$ARGUMENTS`.

The skill:
1. **Analyses** (read-only) the stack, git/commit convention, ADRs, domain invariants and
   existing `.claude/` config.
2. **Bootstraps the family** — verifies the four plugins (`working-methods`, `automations`,
   `forge-methodology`, `design-review`) are installed; if missing, points you to
   `/install-family`. The spine (`/forge-run`) needs them present.
3. **Recommends** 1–2 items per `.claude` surface (each citing a repo file), reusing your
   plugins where they fit instead of reinventing — including the **hook templates** in
   `templates/hooks/` (`guard-main`, `commit-msg-lint`, `secrets-guard`, `ui-diff-design-review`)
   and the **reviewer templates** (incl. the generic `completeness-critic`).
4. **You pick** (multi-select). Nothing is applied until you check it.
5. **Applies** only what you chose, in the right scope, and tells you how to revert.

> Don't confuse this with `/forge-run`. `/optimize-my-setup` configures the workshop;
> `/forge-run` builds with it.
