---
description: Prepara un PR de release de la rama de integración a producción (típicamente dev → main; detecta las ramas reales con scan.mjs) con notas generadas desde git log.
argument-hint: [versión opcional, p.ej. v1.4.0]
allowed-tools: Bash(git log:*), Bash(git diff:*), Bash(gh pr create:*), Bash(gh pr list:*), Bash(git fetch:*), Bash(node:*), Read
---

# Release (integración → producción)

Prepara la subida a producción. **No asumas `dev → main`:** lee las ramas reales del pack del
scanner — `node "${CLAUDE_PLUGIN_ROOT}/skills/optimize-my-setup/scan.mjs" --json` emite
`branches.mainBranch` (producción) y `branches.integrationBranch` (integración; `null` = el repo
trabaja con feature-branches directas a producción → este comando no aplica tal cual, pregunta).
Los pasos de abajo usan `dev → main` como ejemplo; sustituye por las ramas detectadas.

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

Nunca commitees directo a `main`. Para que sea imposible (no solo una norma), instala el hook `guard-main.py` que se shippea en `${CLAUDE_PLUGIN_ROOT}/templates/hooks/guard-main.py` (parametrizable por `PROTECTED_BRANCHES`; wiring en `${CLAUDE_PLUGIN_ROOT}/templates/hooks/README.md`) — o deja que `/optimize-my-setup` lo cablee.
