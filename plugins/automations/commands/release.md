---
description: Prepares a release PR from the integration branch to production (typically dev → main; detects the real branches with scan.mjs) with notes generated from git log.
argument-hint: [optional version, e.g. v1.4.0]
allowed-tools: Bash(git log:*), Bash(git diff:*), Bash(gh pr create:*), Bash(gh pr list:*), Bash(git fetch:*), Bash(node:*), Read
---

# Release (integration → production)

Prepares the push to production. **Don't assume `dev → main`:** read the real branches from the
scanner pack — `node "${CLAUDE_PLUGIN_ROOT}/skills/optimize-my-setup/scan.mjs" --json` emits
`branches.mainBranch` (production) and `branches.integrationBranch` (integration; `null` = the repo
works with feature branches straight to production → this command doesn't apply as-is, ask).
The steps below use `dev → main` as the example; substitute the detected branches.

## Steps
1. `git fetch --all --prune`.
2. Gather the range of changes since the last release:
   ```bash
   git log --oneline origin/main..origin/dev
   git diff --stat origin/main..origin/dev
   ```
3. Group by commit type (feat/fix/perf/refactor/…) and write readable **release notes** (what
   changes for the user, not the raw changelog). Flag breaking changes.
4. If `$ARGUMENTS` is passed as a version, head the notes with it.
5. Create the `dev → main` PR:
   ```bash
   gh pr create --base main --head dev --title "release: $ARGUMENTS" --body "<notes>"
   ```
6. **Don't merge yet.** Release = human gate: leave the PR for review/approval. CI green before merging.

Never commit directly to `main`. To make it impossible (not just a rule), install the
`guard-main.py` hook shipped at `${CLAUDE_PLUGIN_ROOT}/templates/hooks/guard-main.py`
(parameterizable via `PROTECTED_BRANCHES`; wiring in
`${CLAUDE_PLUGIN_ROOT}/templates/hooks/README.md`) — or let `/optimize-my-setup` wire it for you.
