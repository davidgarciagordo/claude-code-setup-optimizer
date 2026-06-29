#!/usr/bin/env python3
"""PreToolUse(Bash): turns the Forge loop from advisory into CHECKED.

When you try to open a PR (`gh pr create`) or push a branch, this verifies the
ACTIVE Forge run has its versioned artifacts on disk — the spec, the grill
record (acta) and the Acceptance Matrix — before the change can leave your
machine. If they're missing, the order was skipped; we block.

It only governs repos that actually started a run (`docs/forge/*/run.json` with
status=active, written by `forge.js init` / `/forge-run`). No active run → this
hook is a no-op, so it's safe to install everywhere.

FAIL-CLOSED: if a run IS active but we cannot read its manifest, we refuse to
vouch (exit 2 "could not verify") instead of waving the PR through. The only
"allow on doubt" case is "there is no run to govern".

Config (env):
  FORGE_ENFORCE        block (default) | warn | off
  FORGE_RUN_MANIFEST   explicit path to a run.json (skips auto-discovery)
"""
import sys, os, json, glob, subprocess

PR_MARKERS = ("gh pr create", "git push")


def out(msg):
    print(msg, file=sys.stderr)


def git_root(start):
    try:
        r = subprocess.run(["git", "-C", start, "rev-parse", "--show-toplevel"],
                           capture_output=True, text=True, timeout=5)
        return r.stdout.strip() or None
    except Exception:
        return None


def find_manifest(root):
    env = os.environ.get("FORGE_RUN_MANIFEST")
    if env:
        p = env if os.path.isabs(env) else os.path.join(root, env)
        return p if os.path.exists(p) else None
    active = []
    for m in glob.glob(os.path.join(root, "docs", "forge", "*", "run.json")):
        try:
            with open(m, encoding="utf-8") as fh:
                j = json.load(fh)
            if j.get("status") == "active":
                active.append((j.get("createdAt", ""), m))
        except Exception:
            # An active-looking manifest we can't parse must not be silently skipped.
            active.append(("￿", m))  # sort last; treated as unreadable below
    if not active:
        return None
    active.sort(reverse=True)
    return active[0][1]


def non_empty(p):
    try:
        return os.path.getsize(p) > 0
    except OSError:
        return False


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
        sys.exit(0)  # only guard the PR / push moment

    root = git_root(os.getcwd()) or os.getcwd()
    manifest = find_manifest(root)
    if not manifest:
        sys.exit(0)  # no Forge run to govern → nothing to enforce

    try:
        with open(manifest, encoding="utf-8") as fh:
            j = json.load(fh)
    except Exception:
        # Active run exists but manifest is unreadable → fail-closed.
        out("FORGE GATE: a Forge run is active but its run.json is unreadable — "
            "refusing to vouch for this PR (fail-closed). Fix the manifest or set "
            "FORGE_ENFORCE=off to override.")
        sys.exit(2 if mode == "block" else 0)

    run_dir = os.path.join(root, j.get("dir", ""))
    required = j.get("preMergeArtifacts") or ["spec.md", "grill.md", "acceptance-matrix.md", "plan.md"]
    missing = [a for a in required if not non_empty(os.path.join(run_dir, a))]

    if not missing:
        sys.exit(0)

    rel = j.get("dir", "docs/forge/<run>")
    verb = "blocked" if mode == "block" else "advisory — would block in 'block' mode"
    msg = (f"FORGE GATE: PR/push {verb} — the active Forge run "
           f"\"{j.get('slug', '?')}\" is missing versioned artifacts: "
           + ", ".join(os.path.join(rel, a) for a in missing) + ". "
           "Produce them through /forge-run (spec → /grill → Acceptance Matrix → plan) "
           "before opening the PR. Done with this run? `node forge.js complete`. "
           "Override: FORGE_ENFORCE=warn (advise only) or off.")
    out(msg)
    sys.exit(2 if mode == "block" else 0)


if __name__ == "__main__":
    main()
