# Hook templates

Parametrizable, copy-into-your-repo enforcement hooks. `optimize-my-setup` wires the
ones you pick into `.claude/settings.json`; you can also copy them by hand.

| Hook | Event / matcher | What it enforces | Key env |
|------|-----------------|------------------|---------|
| `guard-main.py` | PreToolUse · `Bash` | No `git commit`/`push` direct to a protected branch — feature branch + PR only. (`/release` assumed this existed; now it ships.) | `PROTECTED_BRANCHES` |
| `commit-msg-lint.py` | PreToolUse · `Bash` | `git commit -m` follows Conventional Commits. | `COMMIT_TYPES`, `COMMIT_MIN_DESC` |
| `secrets-guard.py` | PreToolUse · `Edit\|Write\|MultiEdit` | Blocks writing secrets (keys, tokens, private keys, DSN passwords) into the repo. | `SECRETS_ALLOW_GLOBS`, `SECRETS_GUARD_MODE` |
| `ui-diff-design-review.py` | PostToolUse · `Edit\|Write\|MultiEdit` | On a UI diff, **fires** `design-review` (injects context) instead of just recommending it. | `UI_GLOBS` |

> The generic `guard-append-only.py` (block editing applied migrations) lives one level up
> in `../../hooks/` and is shipped as an active plugin hook — it's **fail-closed**.

## Design / exit-code contract
- **PreToolUse** hooks block with **exit 2** + a stderr message; **exit 0** allows.
- **PostToolUse** `ui-diff-design-review.py` never blocks — it returns
  `hookSpecificOutput.additionalContext` so Claude actually runs the review.
- **Fail-closed where it matters:** a guard that can't verify its precondition errs toward
  blocking (or, where blocking every PR would be wrong, toward an explicit advisory), never
  toward silent allow.

## Wiring — `.claude/settings.json`
Copy the hook files into `.claude/hooks/` and add (merge with any existing `hooks`):

```json
{
  "hooks": {
    "PreToolUse": [
      { "matcher": "Bash", "hooks": [
        { "type": "command", "command": "python3 \"$CLAUDE_PROJECT_DIR/.claude/hooks/guard-main.py\"" },
        { "type": "command", "command": "python3 \"$CLAUDE_PROJECT_DIR/.claude/hooks/commit-msg-lint.py\"" }
      ] },
      { "matcher": "Edit|Write|MultiEdit", "hooks": [
        { "type": "command", "command": "python3 \"$CLAUDE_PROJECT_DIR/.claude/hooks/secrets-guard.py\"" }
      ] }
    ],
    "PostToolUse": [
      { "matcher": "Edit|Write|MultiEdit", "hooks": [
        { "type": "command", "command": "python3 \"$CLAUDE_PROJECT_DIR/.claude/hooks/ui-diff-design-review.py\"" }
      ] }
    ]
  }
}
```

Set the env vars (e.g. `PROTECTED_BRANCHES=main,prod`) in `settings.json` `"env"` or your shell.
