#!/usr/bin/env python3
"""PostToolUse(Edit|Write|MultiEdit): formatea el fichero editado con el formateador
del proyecto, en CUALQUIER lenguaje. Genérico y NO bloqueante: ante cualquier cosa
rara, sale 0 sin tocar nada.

Por extensión, prueba en orden los formateadores típicos y ejecuta el PRIMERO que
esté disponible (binario en PATH o en el vendor/bin del proyecto). Si ninguno está,
no hace nada. Nunca instala nada."""
import sys, json, os, subprocess, shutil

def project_root(start):
    d = os.path.abspath(start)
    while d != "/":
        if any(os.path.exists(os.path.join(d, m)) for m in
               ("package.json", "pyproject.toml", "composer.json", "go.mod", "Cargo.toml", "Gemfile", ".git")):
            return d
        d = os.path.dirname(d)
    return os.path.abspath(start)

def has(bin_): return shutil.which(bin_) is not None

def run(cmd, root):
    try:
        subprocess.run(cmd, cwd=root, capture_output=True, timeout=45)
    except Exception:
        pass

try:
    data = json.load(sys.stdin)
except Exception:
    sys.exit(0)

fp = (data.get("tool_input") or {}).get("file_path", "") or ""
if not fp or not os.path.isfile(fp):
    sys.exit(0)

ext = os.path.splitext(fp)[1].lower()
root = project_root(os.path.dirname(fp))

def vendor(bin_):  # binario local de PHP/Node en el repo
    p = os.path.join(root, "vendor", "bin", bin_)
    return p if os.path.exists(p) else None

# ---- JS/TS/web: biome (si el repo lo usa) o prettier ----
WEB = {".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".json", ".jsonc",
       ".css", ".scss", ".less", ".md", ".mdx", ".yml", ".yaml", ".html", ".vue", ".svelte"}
if ext in WEB:
    if any(os.path.exists(os.path.join(root, f)) for f in ("biome.json", "biome.jsonc")) and has("npx"):
        run(["npx", "--no-install", "biome", "format", "--write", fp], root); sys.exit(0)
    if has("npx"):
        run(["npx", "--no-install", "prettier", "--write", "--log-level", "warn", fp], root)
    sys.exit(0)

# ---- Python: ruff (preferente) o black ----
if ext in {".py", ".pyi"}:
    if has("ruff"):
        run(["ruff", "format", fp], root); run(["ruff", "check", "--fix", "--quiet", fp], root)
    elif has("black"):
        run(["black", "-q", fp], root)
    sys.exit(0)

# ---- PHP: pint (Laravel) o php-cs-fixer (vendor/bin o global) ----
if ext == ".php":
    pint = vendor("pint") or (shutil.which("pint") if has("pint") else None)
    if pint:
        run([pint, fp], root); sys.exit(0)
    fixer = vendor("php-cs-fixer") or (shutil.which("php-cs-fixer") if has("php-cs-fixer") else None)
    if fixer:
        run([fixer, "fix", fp], root)
    sys.exit(0)

# ---- Go: gofmt / goimports ----
if ext == ".go":
    if has("goimports"): run(["goimports", "-w", fp], root)
    elif has("gofmt"): run(["gofmt", "-w", fp], root)
    sys.exit(0)

# ---- Rust ----
if ext == ".rs" and has("rustfmt"):
    run(["rustfmt", fp], root); sys.exit(0)

# ---- Ruby ----
if ext == ".rb":
    if has("rubocop"): run(["rubocop", "-A", "--no-color", fp], root)
    elif has("standardrb"): run(["standardrb", "--fix", fp], root)
    sys.exit(0)

# ---- Shell ----
if ext in {".sh", ".bash"} and has("shfmt"):
    run(["shfmt", "-w", fp], root); sys.exit(0)

sys.exit(0)
