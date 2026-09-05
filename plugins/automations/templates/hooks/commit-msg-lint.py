#!/usr/bin/env python3
"""TEMPLATE — PreToolUse(Bash): validates that a `git commit -m "..."` message
follows Conventional Commits (`type(scope)?: description`). Kills commits that
break your convention before they land.

Config (env):
  COMMIT_TYPES   comma-separated list (default: the standard Conventional set)
  COMMIT_MIN_DESC  minimum description length (default: 1)

Wiring — copy to `.claude/hooks/commit-msg-lint.py` and add to settings.json under
PreToolUse matcher "Bash" (same as guard-main).

Note: only validates commits with an inline `-m`/`--message` (what an agent
usually does). An interactive commit (editor) is validated by your classic git
`commit-msg` hook instead. On a command we can't parse as a commit with a
message, it does NOT block (exit 0).
"""
import sys, os, json, re

DEFAULT_TYPES = ["feat", "fix", "docs", "style", "refactor", "perf", "test",
                 "build", "ci", "chore", "revert"]


def types():
    raw = os.environ.get("COMMIT_TYPES", "")
    items = [t.strip() for t in raw.split(",") if t.strip()]
    return items or DEFAULT_TYPES


def extract_message(cmd):
    # -m "msg" | -m 'msg' | --message=msg | --message "msg"
    for pat in (r"-m\s+\"([^\"]*)\"", r"-m\s+'([^']*)'",
                r"--message\s*=\s*\"([^\"]*)\"", r"--message\s*=\s*'([^']*)'",
                r"--message\s+\"([^\"]*)\"", r"--message\s+'([^']*)'"):
        m = re.search(pat, cmd)
        if m:
            return m.group(1)
    return None


def main():
    try:
        data = json.load(sys.stdin)
    except Exception:
        sys.exit(0)

    cmd = (data.get("tool_input") or {}).get("command", "") or ""
    if not re.search(r"\bgit\s+commit\b", cmd):
        sys.exit(0)

    msg = extract_message(cmd)
    if msg is None:
        sys.exit(0)  # no inline -m → not our case

    subject = msg.strip().splitlines()[0] if msg.strip() else ""
    min_desc = int(os.environ.get("COMMIT_MIN_DESC", "1") or "1")
    type_alt = "|".join(re.escape(t) for t in types())
    pattern = rf"^({type_alt})(\([^)]+\))?(!)?: .{{{min_desc},}}$"

    if re.match(pattern, subject):
        sys.exit(0)

    print("BLOCKED: the commit message doesn't follow Conventional Commits.\n"
          f"  got: {subject!r}\n"
          f"  expected: <type>(<scope>)?: <description>\n"
          f"  valid types: {', '.join(types())}\n"
          "  e.g.: feat(api): add idempotency key to /charge\n"
          "  (adjust with COMMIT_TYPES / COMMIT_MIN_DESC.)", file=sys.stderr)
    sys.exit(2)


if __name__ == "__main__":
    main()
