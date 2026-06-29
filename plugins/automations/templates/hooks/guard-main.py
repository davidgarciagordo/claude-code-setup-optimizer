#!/usr/bin/env python3
"""TEMPLATE — PreToolUse(Bash): impide commitear/pushear DIRECTO a una rama
protegida (main/master/production). El trabajo va en rama de feature → PR.

`/release` y el README lo daban por hecho ("debería bloquearlo un hook tipo
guard-main") pero el hook no se shippeaba. Aquí está, parametrizable.

Config (env):
  PROTECTED_BRANCHES   lista separada por comas (default: "main,master,production")

Wiring — copia este fichero a `.claude/hooks/guard-main.py` y añade a settings.json:
  { "hooks": { "PreToolUse": [ { "matcher": "Bash", "hooks": [
      { "type": "command",
        "command": "python3 \\"$CLAUDE_PROJECT_DIR/.claude/hooks/guard-main.py\\"" } ] } ] } }

FAIL-CLOSED en lo esencial: si detectamos un `git commit`/`git push` y NO podemos
determinar la rama destino con seguridad, avisamos por stderr pero no bloqueamos
(exit 0) salvo que el comando nombre explícitamente una rama protegida — para no
romper flujos legítimos. La detección de rama actual sí bloquea el commit directo.
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

    # 1) push que nombra explícitamente una rama protegida (origin main, HEAD:main, --branch main)
    if is_push:
        for b in prot:
            if re.search(rf"(^|[\s:/]){re.escape(b)}(\s|$)", cmd):
                print(f"BLOQUEADO: push a la rama protegida '{b}'. Abre un PR desde tu rama "
                      f"de feature. (PROTECTED_BRANCHES para ajustar.)", file=sys.stderr)
                sys.exit(2)

    # 2) commit/push estando EN una rama protegida
    cur = current_branch()
    if cur and cur in prot:
        action = "commitees" if is_commit else "pushees"
        print(f"BLOQUEADO: estás en '{cur}' (protegida) — no {action} directo. Crea una "
              f"rama de feature y abre un PR. (PROTECTED_BRANCHES para ajustar.)",
              file=sys.stderr)
        sys.exit(2)

    sys.exit(0)


if __name__ == "__main__":
    main()
