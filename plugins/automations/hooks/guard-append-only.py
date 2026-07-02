#!/usr/bin/env python3
"""PreToolUse(Edit|Write|MultiEdit): protege ficheros APPEND-ONLY ya commiteados
(p.ej. migraciones SQL aplicadas, ledgers de auditoría). Editarlos rompe la
inmutabilidad del historial — las correcciones deben ser ficheros/eventos NUEVOS.

Configurable por env APPEND_ONLY_GLOBS (lista separada por comas de patrones glob,
relativos a la raíz del repo). Por defecto cubre migraciones Drizzle/Prisma.
Solo bloquea si el fichero YA está trackeado en git (= ya existe en la historia).

FAIL-CLOSED (corregido): si el fichero ENCAJA con un glob append-only pero no
podemos determinar su estado en git (error de subproceso, repo corrupto…), se
BLOQUEA con exit 2 ("no pude verificar") en vez de permitir en silencio — que era
justo el agujero que esta protección debía cerrar. Solo se permite (exit 0) cuando
NO hay nada que proteger: sin file_path, fuera de un repo git, o el fichero no
encaja con ningún patrón append-only.
Override intencional: APPEND_ONLY_GLOBS="" (set-pero-vacío = guard desactivado;
unset = defaults). Los paths se resuelven con realpath (symlinks: /tmp→/private/tmp
en macOS) para que coincidan con lo que devuelve git.

Limitación honesta: el matcher del hook es Edit|Write|MultiEdit — NO cubre
mutaciones vía Bash (`sed -i`, `echo >>`, `mv`…). Es inherente al punto de
enganche; para cubrir Bash haría falta otro hook que parsee comandos.
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
    """True = en git; False = no trackeado; None = no se pudo determinar.
    Usa `git ls-files -- <rel>` (sin --error-unmatch) para no depender del idioma
    del mensaje de error de git: rc 0 + stdout con la ruta = trackeado; rc 0 +
    stdout vacío = no trackeado; rc != 0 = no se pudo determinar (fail-closed)."""
    try:
        rel = os.path.relpath(fp, root)
        out = subprocess.run(["git", "-C", root, "ls-files", "-z", "--", rel],
                             capture_output=True, text=True, timeout=5)
        if out.returncode != 0:
            return None  # error real → no sabemos
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
    # realpath (no abspath): git rev-parse resuelve symlinks (/tmp→/private/tmp en
    # macOS); si aquí no los resolvemos, el relpath sale por ../.. y el guard
    # fail-closea hasta la CREACIÓN de ficheros nuevos.
    fp = os.path.realpath(fp)

    root = git_root(os.path.dirname(fp))
    if not root:
        sys.exit(0)  # fuera de un repo git → nada commiteado que proteger
    root = os.path.realpath(root)

    # unset → defaults; set (aunque vacío) → lo que diga el usuario. Con set-pero-
    # vacío el guard queda DESACTIVADO explícitamente (el override documentado).
    env_globs = os.environ.get("APPEND_ONLY_GLOBS")
    if env_globs is None:
        globs = DEFAULT_GLOBS
    else:
        globs = [g.strip() for g in env_globs.split(",") if g.strip()]
        if not globs:
            sys.exit(0)  # APPEND_ONLY_GLOBS="" → override intencional, guard off
    rel = os.path.relpath(fp, root)
    matched = any(glob_match(rel, g) for g in globs)
    if not matched:
        sys.exit(0)  # no es un fichero append-only

    state = tracked(root, fp)
    base = os.path.basename(fp)

    if state is True:
        print(f"BLOQUEADO: '{base}' es append-only y ya está en git. No se edita una "
              f"migración/auditoría aplicada: crea un fichero NUEVO (corrección/migración "
              f"compensatoria). Override: APPEND_ONLY_GLOBS=\"\" si es intencional.",
              file=sys.stderr)
        sys.exit(2)

    if state is None:
        # Encaja con un patrón append-only pero no pudimos verificar git → fail-closed.
        print(f"BLOQUEADO (no pude verificar): '{base}' encaja con un patrón append-only "
              f"pero no pude consultar su estado en git. Me niego a permitir la edición a "
              f"ciegas (fail-closed). Verifica el repo, o override con APPEND_ONLY_GLOBS=\"\".",
              file=sys.stderr)
        sys.exit(2)

    sys.exit(0)  # encaja pero aún no está commiteado → se puede crear/editar libremente


if __name__ == "__main__":
    main()
