#!/usr/bin/env python3
"""PreToolUse(Edit|Write|MultiEdit): protects already-committed APPEND-ONLY files
(e.g. applied SQL migrations, audit ledgers). Editing them breaks history
immutability — corrections must be NEW files/events.

Configurable via env APPEND_ONLY_GLOBS (comma-separated list of glob patterns,
relative to the repo root). Covers Drizzle/Prisma migrations by default.
Only blocks if the file is ALREADY tracked in git (= already exists in history).

FAIL-CLOSED (fixed): if the file MATCHES an append-only glob but we can't
determine its git status (subprocess error, corrupt repo…), it BLOCKS with
exit 2 ("couldn't verify") instead of silently allowing it — which was
exactly the hole this guard was meant to close. It only allows (exit 0) when
there's NOTHING to protect: no file_path, outside a git repo, or the file
doesn't match any append-only pattern.
Intentional override: APPEND_ONLY_GLOBS="" (set-but-empty = guard disabled;
unset = defaults). Paths are resolved with realpath (symlinks: /tmp→/private/tmp
on macOS) so they match what git returns.

Honest limitation: the hook's matcher is Edit|Write|MultiEdit — it does NOT cover
mutations via Bash (`sed -i`, `echo >>`, `mv`…). That's inherent to the hook
point; covering Bash would need a separate hook that parses commands.
"""
import sys, os, json, re, subprocess

DEFAULT_GLOBS = [
    "**/drizzle/*.sql",
    "**/migrations/*.sql",
    "prisma/migrations/**/migration.sql",
]


def git_root(start):
    try:
        out = subprocess.run(["git", "-C", start, "rev-parse", "--show-toplevel"],
                             capture_output=True, text=True, timeout=5)
        return (out.stdout.strip() or None) if out.returncode == 0 else None
    except Exception:
        return None


def tracked(root, fp):
    """True = tracked in git; False = untracked; None = couldn't determine.
    Uses `git ls-files -- <rel>` (no --error-unmatch) so it doesn't depend on git's
    error-message language: rc 0 + stdout with the path = tracked; rc 0 +
    empty stdout = untracked; rc != 0 = couldn't determine (fail-closed)."""
    try:
        rel = os.path.relpath(fp, root)
        out = subprocess.run(["git", "-C", root, "ls-files", "-z", "--", rel],
                             capture_output=True, text=True, timeout=5)
        if out.returncode != 0:
            return None  # real error → we don't know
        return bool(out.stdout.strip("\x00").strip())
    except Exception:
        return None


def glob_match(path, pat):
    regex = re.escape(pat).replace(r"\*\*/", "(.*/)?").replace(r"\*\*", ".*").replace(r"\*", "[^/]*")
    return re.fullmatch(regex, path) is not None


def main():
    try:
        data = json.load(sys.stdin)
    except Exception:
        sys.exit(0)

    fp = (data.get("tool_input") or {}).get("file_path", "") or ""
    if not fp:
        sys.exit(0)
    # realpath (not abspath): git rev-parse resolves symlinks (/tmp→/private/tmp on
    # macOS); if we don't resolve them here, the relpath comes out via ../.. and the
    # guard fail-closes even on the CREATION of new files.
    fp = os.path.realpath(fp)

    root = git_root(os.path.dirname(fp))
    if not root:
        sys.exit(0)  # outside a git repo → nothing committed to protect
    root = os.path.realpath(root)

    # unset → defaults; set (even if empty) → whatever the user said. Set-but-
    # empty leaves the guard explicitly DISABLED (the documented override).
    env_globs = os.environ.get("APPEND_ONLY_GLOBS")
    if env_globs is None:
        globs = DEFAULT_GLOBS
    else:
        globs = [g.strip() for g in env_globs.split(",") if g.strip()]
        if not globs:
            sys.exit(0)  # APPEND_ONLY_GLOBS="" → intentional override, guard off
    rel = os.path.relpath(fp, root)
    matched = any(glob_match(rel, g) for g in globs)
    if not matched:
        sys.exit(0)  # not an append-only file

    state = tracked(root, fp)
    base = os.path.basename(fp)

    if state is True:
        print(f"BLOCKED: '{base}' is append-only and already in git. Don't edit an "
              f"applied migration/ledger: create a NEW file (a compensating "
              f"correction/migration). Override: APPEND_ONLY_GLOBS=\"\" if intentional.",
              file=sys.stderr)
        sys.exit(2)

    if state is None:
        # Matches an append-only pattern but we couldn't verify git → fail-closed.
        print(f"BLOCKED (couldn't verify): '{base}' matches an append-only pattern "
              f"but its git status couldn't be checked. Refusing to allow the edit "
              f"blind (fail-closed). Check the repo, or override with APPEND_ONLY_GLOBS=\"\".",
              file=sys.stderr)
        sys.exit(2)

    sys.exit(0)  # matches but isn't committed yet → free to create/edit


if __name__ == "__main__":
    main()
