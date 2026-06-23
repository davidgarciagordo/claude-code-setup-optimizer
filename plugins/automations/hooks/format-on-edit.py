#!/usr/bin/env python3
"""PostToolUse(Edit|Write|MultiEdit): formatea el fichero editado con la herramienta
del proyecto (prettier/biome), si está disponible. Genérico y NO bloqueante:
ante cualquier cosa rara, sale 0 sin tocar nada.

Detección (en orden): biome.json -> `biome format --write`; prettier (config o dep)
-> `prettier --write`. Solo formatea extensiones soportadas y ficheros existentes."""
import sys, json, os, subprocess, shutil

FORMATTABLE = {".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".json", ".jsonc",
               ".css", ".scss", ".md", ".mdx", ".yml", ".yaml", ".html"}

def project_root(start):
    d = os.path.abspath(start)
    while d != "/":
        if os.path.exists(os.path.join(d, "package.json")):
            return d
        d = os.path.dirname(d)
    return None

try:
    data = json.load(sys.stdin)
except Exception:
    sys.exit(0)

fp = (data.get("tool_input") or {}).get("file_path", "") or ""
if not fp or not os.path.isfile(fp):
    sys.exit(0)
if os.path.splitext(fp)[1].lower() not in FORMATTABLE:
    sys.exit(0)

root = project_root(os.path.dirname(fp)) or os.getcwd()
try:
    # Biome primero si el repo lo usa
    if any(os.path.exists(os.path.join(root, f)) for f in ("biome.json", "biome.jsonc")):
        if shutil.which("npx"):
            subprocess.run(["npx", "--no-install", "biome", "format", "--write", fp],
                           cwd=root, capture_output=True, timeout=30)
            sys.exit(0)
    # Prettier si hay config o dep
    has_prettier = any(os.path.exists(os.path.join(root, f)) for f in (
        ".prettierrc", ".prettierrc.json", ".prettierrc.js", ".prettierrc.cjs",
        ".prettierrc.yaml", ".prettierrc.yml", "prettier.config.js", "prettier.config.cjs"))
    if not has_prettier:
        try:
            with open(os.path.join(root, "package.json")) as f:
                pkg = json.load(f)
            deps = {**pkg.get("devDependencies", {}), **pkg.get("dependencies", {})}
            has_prettier = "prettier" in deps
        except Exception:
            pass
    if has_prettier and shutil.which("npx"):
        subprocess.run(["npx", "--no-install", "prettier", "--write", "--log-level", "warn", fp],
                       cwd=root, capture_output=True, timeout=30)
except Exception:
    pass
sys.exit(0)
