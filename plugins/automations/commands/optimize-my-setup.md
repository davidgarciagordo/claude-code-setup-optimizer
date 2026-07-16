---
description: Repo setup (run once) — analyse this repo's whole .claude config and let you pick what to apply. Thin command wrapper around the optimize-my-setup skill, so it's invocable deterministically as a slash command. NOT part of a feature run; bootstrap once.
argument-hint: [optional focus, e.g. "git flow, secrets, fewer prompts"]
allowed-tools: Skill, Read, Glob, Grep, Bash(git log:*), Bash(git branch:*), Bash(node:*), Bash(claude plugin:*), AskUserQuestion, Write, Edit
---

# /optimize-my-setup — one-time repo setup

Repo setup, run **once** (and again when stack/conventions change). NOT a step of building
a feature — `/forge-run` assumes the `.claude` config already exists.

**Invoke the `optimize-my-setup` skill and follow it end to end.** The skill is the single
source for the 5 phases (detect installed plugins → `scan.mjs` context pack → surface fan-out →
multi-check → apply only what's checked). Do not re-derive the phases here.

`$ARGUMENTS` (optional focus): prioritize those surfaces in the fan-out and put their items
first in the multi-check. Still cover ALL surfaces — focus reorders, it does not cut scope.

Hard gates (identical to the skill's; restated because they are non-negotiable):
- **Works standalone** — no other plugin is a prerequisite. `claude plugin list` first only to
  know what the user already has, so recommendations reuse it instead of duplicating it.
- **Nothing is written/installed before the multi-check returns**; unchecked = untouched.
- Reuse before generating: a need that fits an existing plugin/skill → recommend installing
  the original, never copy its content.
