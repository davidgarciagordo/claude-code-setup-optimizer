#!/usr/bin/env python3
"""TEMPLATE — PostToolUse(Edit|Write|MultiEdit): when a change touches UI, it FIRES
the design review instead of only recommending it. Never blocks: it injects context
(additionalContext) telling Claude to run the `design-review` skill and the design
reviewers on the touched surface before closing.

This makes the integration real: design is reviewed by default on UI diffs, not
"if you remember". `/forge-run` already does this in its verify phase; this hook
extends it to ANY UI edit outside a run.

Config (env):
  UI_GLOBS   comma-separated UI globs (default: common front-end paths)

Wiring — copy to `.claude/hooks/ui-diff-design-review.py` and add to settings.json:
  { "hooks": { "PostToolUse": [ { "matcher": "Edit|Write|MultiEdit", "hooks": [
      { "type": "command",
        "command": "python3 \\"$CLAUDE_PROJECT_DIR/.claude/hooks/ui-diff-design-review.py\\"" } ] } ] } }
"""
import sys, os, json, fnmatch

DEFAULT_UI_GLOBS = [
    "*.tsx", "*.jsx", "*.vue", "*.svelte", "*.css", "*.scss",
    "**/components/**", "**/app/**", "**/pages/**", "**/ui/**",
    "**/*.stories.*", "**/emails/**", "**/*.mjml",
]


def ui_globs():
    raw = os.environ.get("UI_GLOBS", "")
    items = [g.strip() for g in raw.split(",") if g.strip()]
    return items or DEFAULT_UI_GLOBS


def is_ui(fp):
    base = os.path.basename(fp)
    for g in ui_globs():
        if fnmatch.fnmatch(fp, g) or fnmatch.fnmatch(base, g):
            return True
    return False


def main():
    try:
        data = json.load(sys.stdin)
    except Exception:
        sys.exit(0)

    fp = (data.get("tool_input") or {}).get("file_path", "") or ""
    if not fp or not is_ui(fp):
        sys.exit(0)

    msg = (f"UI changed: {os.path.basename(fp)}. Before considering this done, run the "
           f"`design-review` skill on the affected surface (Storybook story or route) and "
           f"dispatch the design reviewers — apply it, don't just note it. This is the "
           f"codified verify step for UI diffs.")
    out = {
        "hookSpecificOutput": {
            "hookEventName": "PostToolUse",
            "additionalContext": msg,
        }
    }
    print(json.dumps(out))
    sys.exit(0)


if __name__ == "__main__":
    main()
