---
description: Prepara un PR de release de la rama de integración a producción (dev → main) con notas generadas desde git log.
argument-hint: [versión opcional, p.ej. v1.4.0]
allowed-tools: Bash(git log:*), Bash(git diff:*), Bash(gh pr create:*), Bash(gh pr list:*), Bash(git fetch:*), Read
---

# Release (dev → main)

Prepara la subida a producción. Asume `main`=producción y `dev`=integración (ajusta si tu repo usa otros nombres).

## Pasos
1. `git fetch --all --prune`.
2. Reúne el rango de cambios desde el último release:
   ```bash
   git log --oneline origin/main..origin/dev
   git diff --stat origin/main..origin/dev
   ```
3. Agrupa por tipo de commit (feat/fix/perf/refactor/…) y redacta **notas de release** legibles (qué cambia para el usuario, no el changelog crudo). Marca breaking changes.
4. Si pasas `$ARGUMENTS` como versión, encabeza las notas con ella.
5. Crea el PR `dev → main`:
   ```bash
   gh pr create --base main --head dev --title "release: $ARGUMENTS" --body "<notas>"
   ```
6. **No mergees aún.** Release = gate humano: deja el PR para revisión/aprobación. Verde en CI antes de mergear.

Nunca commitees directo a `main`. Para que sea imposible (no solo una norma), instala el hook `guard-main.py` que se shippea en `templates/hooks/` (parametrizable por `PROTECTED_BRANCHES`; wiring en `templates/hooks/README.md`) — o deja que `/optimize-my-setup` lo cablee.
