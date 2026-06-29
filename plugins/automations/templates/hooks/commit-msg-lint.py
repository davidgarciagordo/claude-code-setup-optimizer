#!/usr/bin/env python3
"""TEMPLATE — PreToolUse(Bash): valida que el mensaje de un `git commit -m "..."`
sigue Conventional Commits (`type(scope)?: description`). Mata los commits que
rompen tu convención antes de que entren.

Config (env):
  COMMIT_TYPES   lista separada por comas (default: el set Conventional estándar)
  COMMIT_MIN_DESC  longitud mínima de la descripción (default: 1)

Wiring — copia a `.claude/hooks/commit-msg-lint.py` y añade a settings.json bajo
PreToolUse matcher "Bash" (igual que guard-main).

Nota: solo valida commits con `-m`/`--message` inline (los que un agente suele
hacer). Un commit interactivo (editor) lo valida tu hook git `commit-msg` clásico.
Ante un comando que no podamos parsear como commit con mensaje, NO bloquea (exit 0).
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
        sys.exit(0)  # sin -m inline → no es nuestro caso

    subject = msg.strip().splitlines()[0] if msg.strip() else ""
    min_desc = int(os.environ.get("COMMIT_MIN_DESC", "1") or "1")
    type_alt = "|".join(re.escape(t) for t in types())
    pattern = rf"^({type_alt})(\([^)]+\))?(!)?: .{{{min_desc},}}$"

    if re.match(pattern, subject):
        sys.exit(0)

    print("BLOQUEADO: el mensaje de commit no sigue Conventional Commits.\n"
          f"  recibido: {subject!r}\n"
          f"  esperado: <type>(<scope>)?: <description>\n"
          f"  types válidos: {', '.join(types())}\n"
          "  ej.: feat(api): add idempotency key to /charge\n"
          "  (ajusta con COMMIT_TYPES / COMMIT_MIN_DESC.)", file=sys.stderr)
    sys.exit(2)


if __name__ == "__main__":
    main()
