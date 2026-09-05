#!/usr/bin/env python3
"""TEMPLATE — PreToolUse(Edit|Write|MultiEdit): blocks writing secrets into the
repo (API keys, tokens, private keys, connection strings with a password). Non-
negotiable rule: no secrets in git → only .env.example with placeholders.

Not an exhaustive scanner; covers the high-value patterns an agent might paste
by accident. For full auditing use gitleaks/trufflehog in CI.

Config (env):
  SECRETS_ALLOW_GLOBS   globs to NOT scan (default: *.example, *.sample,
                        *.md fixtures…). Comma-separated.
  SECRETS_GUARD_MODE    block (default) | warn

Wiring — copy to `.claude/hooks/secrets-guard.py` and add to settings.json under
PreToolUse matcher "Edit|Write|MultiEdit".
"""
import sys, os, json, re, fnmatch

DEFAULT_ALLOW = ["*.example", "*.sample", "*.example.*", "**/*.snap"]

# (readable name, regex). Designed for low false positives.
PATTERNS = [
    ("AWS access key id", r"\bAKIA[0-9A-Z]{16}\b"),
    ("AWS secret access key", r"(?i)aws_secret_access_key\s*[=:]\s*['\"]?[A-Za-z0-9/+=]{40}"),
    ("Private key block", r"-----BEGIN (RSA |EC |OPENSSH |DSA |PGP )?PRIVATE KEY-----"),
    ("GitHub token", r"\bgh[pousr]_[A-Za-z0-9]{36,}\b"),
    ("Slack token", r"\bxox[baprs]-[A-Za-z0-9-]{10,}\b"),
    ("Stripe live key", r"\bsk_live_[0-9a-zA-Z]{16,}\b"),
    ("Google API key", r"\bAIza[0-9A-Za-z\-_]{35}\b"),
    ("OpenAI/Anthropic-style key", r"\b(sk|sk-ant)-[A-Za-z0-9_\-]{20,}\b"),
    ("JWT", r"\beyJ[A-Za-z0-9_\-]{10,}\.[A-Za-z0-9_\-]{10,}\.[A-Za-z0-9_\-]{10,}\b"),
    ("Password in URL/DSN", r"(?i)(postgres|postgresql|mysql|mongodb(\+srv)?|redis|amqp)://[^\s:@/]+:[^\s:@/]+@"),
    ("Generic assigned secret", r"(?i)\b(api[_-]?key|secret|passwd|password|token|access[_-]?token)\b\s*[=:]\s*['\"][^'\"\s]{12,}['\"]"),
]


def allow_globs():
    raw = os.environ.get("SECRETS_ALLOW_GLOBS", "")
    items = [g.strip() for g in raw.split(",") if g.strip()]
    return items or DEFAULT_ALLOW


def content_of(ti):
    # Covers Write (content), Edit (new_string), MultiEdit (edits[].new_string).
    parts = []
    if ti.get("content"):
        parts.append(str(ti["content"]))
    if ti.get("new_string"):
        parts.append(str(ti["new_string"]))
    for e in ti.get("edits", []) or []:
        if isinstance(e, dict) and e.get("new_string"):
            parts.append(str(e["new_string"]))
    return "\n".join(parts)


def main():
    try:
        data = json.load(sys.stdin)
    except Exception:
        sys.exit(0)

    ti = data.get("tool_input") or {}
    fp = ti.get("file_path", "") or ""
    base = os.path.basename(fp)
    if any(fnmatch.fnmatch(base, g) or fnmatch.fnmatch(fp, g) for g in allow_globs()):
        sys.exit(0)

    text = content_of(ti)
    if not text:
        sys.exit(0)

    hits = [name for name, rx in PATTERNS if re.search(rx, text)]
    if not hits:
        sys.exit(0)

    mode = os.environ.get("SECRETS_GUARD_MODE", "block").lower()
    print(f"{'BLOCKED' if mode == 'block' else 'WARNING'}: this looks like a SECRET in "
          f"'{base or fp}' ({', '.join(sorted(set(hits)))}). No secrets in git: "
          f"use environment variables / a secret manager and commit only placeholders "
          f"(.env.example). False positive / fixture → rename to *.example or adjust "
          f"SECRETS_ALLOW_GLOBS.", file=sys.stderr)
    sys.exit(2 if mode == "block" else 0)


if __name__ == "__main__":
    main()
