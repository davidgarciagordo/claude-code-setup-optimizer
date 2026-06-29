#!/usr/bin/env python3
"""TEMPLATE — PostToolUse(Edit|Write|MultiEdit): cuando un cambio toca UI, DISPARA
la revisión de diseño en vez de solo recomendar instalarla. No bloquea: inyecta
contexto (additionalContext) que le dice a Claude que pase el `design-review` skill
+ los reviewers de diseño por la superficie tocada antes de cerrar.

Esto hace la integración REAL: el diseño se revisa por defecto en diffs de UI, no
"si te acuerdas". El `/forge-run` ya lo hace en su fase verify de forma codificada;
este hook lo extiende a CUALQUIER edición de UI fuera de un run.

Config (env):
  UI_GLOBS   globs de UI separados por comas (default: front-end común)

Wiring — copia a `.claude/hooks/ui-diff-design-review.py` y añade a settings.json:
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
