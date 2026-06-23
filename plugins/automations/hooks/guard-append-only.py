#!/usr/bin/env python3
"""PreToolUse(Edit|Write|MultiEdit): protege ficheros APPEND-ONLY ya commiteados
(p.ej. migraciones SQL aplicadas, ledgers de auditoría). Editarlos rompe la
inmutabilidad del historial — las correcciones deben ser ficheros/eventos NUEVOS.

Configurable por env APPEND_ONLY_GLOBS (lista separada por comas de patrones glob,
relativos a la raíz del repo). Por defecto cubre migraciones Drizzle/Prisma.
Solo bloquea si el fichero YA está trackeado en git (= ya existe en la historia).
Robusto: ante cualquier duda, PERMITE (exit 0)."""
import sys, json, os, subprocess, fnmatch

DEFAULT_GLOBS = [
    "**/drizzle/*.sql",
    "**/migrations/*.sql",
    "prisma/migrations/**/migration.sql",
]

def git_root(start):
    try:
        out = subprocess.run(["git", "-C", start, "rev-parse", "--show-toplevel"],
                             capture_output=True, text=True, timeout=5)
        return out.stdout.strip() or None
    except Exception:
        return None

def tracked(root, fp):
    try:
        rel = os.path.relpath(fp, root)
        out = subprocess.run(["git", "-C", root, "ls-files", "--error-unmatch", rel],
                             capture_output=True, text=True, timeout=5)
        return out.returncode == 0
    except Exception:
        return False

try:
    data = json.load(sys.stdin)
except Exception:
    sys.exit(0)

fp = (data.get("tool_input") or {}).get("file_path", "") or ""
if not fp:
    sys.exit(0)
fp = os.path.abspath(fp)
root = git_root(os.path.dirname(fp))
if not root:
    sys.exit(0)

globs = [g.strip() for g in os.environ.get("APPEND_ONLY_GLOBS", "").split(",") if g.strip()] or DEFAULT_GLOBS
rel = os.path.relpath(fp, root)
matched = any(fnmatch.fnmatch(rel, g) or fnmatch.fnmatch("/" + rel, "*/" + g.lstrip("*/")) for g in globs)
# fnmatch no maneja ** recursivo de forma nativa; normalizamos
def glob_match(path, pat):
    import re
    regex = re.escape(pat).replace(r"\*\*/", "(.*/)?").replace(r"\*\*", ".*").replace(r"\*", "[^/]*")
    return re.fullmatch(regex, path) is not None
matched = any(glob_match(rel, g) for g in globs)

if matched and tracked(root, fp):
    base = os.path.basename(fp)
    print(f"BLOQUEADO: '{base}' es append-only y ya está en git. No se edita una "
          f"migración/auditoría aplicada: crea un fichero NUEVO (corrección/migración "
          f"compensatoria). Override: APPEND_ONLY_GLOBS=\"\" si es intencional.",
          file=sys.stderr)
    sys.exit(2)
sys.exit(0)
