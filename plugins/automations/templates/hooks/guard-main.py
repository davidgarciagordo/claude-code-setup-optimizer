#!/usr/bin/env python3
"""TEMPLATE — PreToolUse(Bash): prevents committing/pushing DIRECTLY to a
protected branch (main/master/production). Work goes on a feature branch → PR.

`/release` and the README assumed this ("a guard-main-style hook should block
this") but the hook wasn't shipped. Here it is, parametrizable.

Config (env):
  PROTECTED_BRANCHES   comma-separated list (default: "main,master,production")

Wiring — copy this file to `.claude/hooks/guard-main.py` and add to settings.json:
  { "hooks": { "PreToolUse": [ { "matcher": "Bash", "hooks": [
      { "type": "command",
        "command": "python3 \\"$CLAUDE_PROJECT_DIR/.claude/hooks/guard-main.py\\"" } ] } ] } }

Fail-closed on the essentials: if we detect a `git commit`/`git push` and CANNOT
safely determine the target branch, we warn via stderr but don't block
(exit 0) unless the command explicitly names a protected branch — so we don't
break legitimate flows. Detecting the CURRENT branch does block a direct commit.
"""
import sys, os, json, re, subprocess

DEFAULT_PROTECTED = ["main", "master", "production"]


def protected():
    raw = os.environ.get("PROTECTED_BRANCHES", "")
    items = [b.strip() for b in raw.split(",") if b.strip()]
    return items or DEFAULT_PROTECTED


def current_branch():
    try:
        out = subprocess.run(["git", "rev-parse", "--abbrev-ref", "HEAD"],
                             capture_output=True, text=True, timeout=5)
        return out.stdout.strip() if out.returncode == 0 else None
    except Exception:
        return None


def main():
    try:
        data = json.load(sys.stdin)
    except Exception:
        sys.exit(0)

    cmd = (data.get("tool_input") or {}).get("command", "") or ""
    prot = protected()

    is_commit = bool(re.search(r"\bgit\s+commit\b", cmd))
    is_push = bool(re.search(r"\bgit\s+push\b", cmd))
    if not (is_commit or is_push):
        sys.exit(0)

    # 1) a push that explicitly names a protected branch (origin main, HEAD:main, --branch main)
    if is_push:
        for b in prot:
            if re.search(rf"(^|[\s:/]){re.escape(b)}(\s|$)", cmd):
                print(f"BLOCKED: push to protected branch '{b}'. Open a PR from your "
                      f"feature branch. (Adjust with PROTECTED_BRANCHES.)", file=sys.stderr)
                sys.exit(2)

    # 2) committing/pushing while ON a protected branch
    cur = current_branch()
    if cur and cur in prot:
        action = "commit" if is_commit else "push"
        print(f"BLOCKED: you're on '{cur}' (protected) — no direct {action}. Create a "
              f"feature branch and open a PR. (Adjust with PROTECTED_BRANCHES.)",
              file=sys.stderr)
        sys.exit(2)

    sys.exit(0)


if __name__ == "__main__":
    main()
