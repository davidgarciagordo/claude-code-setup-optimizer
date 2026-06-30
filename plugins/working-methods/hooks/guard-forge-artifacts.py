#!/usr/bin/env python3
"""PreToolUse(Bash): gates PR commands behind `node forge.js check-pr` (single source of truth).

Delegates ALL artifact-existence logic to `forge.js check-pr` so this hook
and forge.js can never drift on what "done" means.

Guards: gh pr create / gh pr ready / gh pr merge
Does NOT gate raw `git push` — per-phase pushes are mandated by the methodology.

Config (env):
  FORGE_ENFORCE        block (default) | warn | off
  CLAUDE_PLUGIN_ROOT   set by Claude Code when invoking the hook
"""
import sys, os, json, subprocess

# Only gate on PR lifecycle commands — NOT raw git push.
PR_MARKERS = ("gh pr create", "gh pr ready", "gh pr merge")


def out(msg):
    print(msg, file=sys.stderr)


def find_forge_js():
    """Return absolute path to forge.js, or None."""
    plugin_root = os.environ.get("CLAUDE_PLUGIN_ROOT", "")
    if plugin_root:
        p = os.path.join(plugin_root, "workflows", "forge.js")
        if os.path.exists(p):
            return p
    # Fallback: sibling of this hook file in the plugin tree
    hook_dir = os.path.dirname(os.path.realpath(__file__))
    p = os.path.normpath(os.path.join(hook_dir, "..", "workflows", "forge.js"))
    if os.path.exists(p):
        return p
    return None


def main():
    mode = os.environ.get("FORGE_ENFORCE", "block").lower()
    if mode == "off":
        sys.exit(0)

    try:
        data = json.load(sys.stdin)
    except Exception:
        sys.exit(0)  # not our event shape; don't interfere

    cmd = (data.get("tool_input") or {}).get("command", "") or ""
    if not any(mk in cmd for mk in PR_MARKERS):
        sys.exit(0)  # nothing to gate

    forge_js = find_forge_js()
    if not forge_js:
        out(
            "FORGE GATE: cannot locate forge.js — refusing to vouch for this PR (fail-closed). "
            "Ensure CLAUDE_PLUGIN_ROOT is set or set FORGE_ENFORCE=off to override."
        )
        sys.exit(2 if mode == "block" else 0)

    try:
        r = subprocess.run(
            ["node", forge_js, "check-pr"],
            capture_output=True, text=True, timeout=15
        )
    except Exception as exc:
        out(
            f"FORGE GATE: forge.js check-pr failed ({exc}) — refusing (fail-closed). "
            "Set FORGE_ENFORCE=off to override."
        )
        sys.exit(2 if mode == "block" else 0)

    if r.returncode == 0:
        sys.exit(0)  # OK or no active run

    msg = r.stderr.strip() or r.stdout.strip() or "check-pr blocked (no details)"
    verb = "blocked" if mode == "block" else "advisory — would block in 'block' mode"
    out(f"FORGE GATE: PR {verb} — {msg}")
    sys.exit(2 if mode == "block" else 0)


if __name__ == "__main__":
    main()
