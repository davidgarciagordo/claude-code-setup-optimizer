---
name: optimize-my-setup
description: Analiza el repo actual (git, CLAUDE.md, carpeta .claude, stack) y recomienda automatizaciones de Claude Code (hooks, subagents, skills, commands, MCP, permisos) que optimicen la forma de trabajar. SIEMPRE termina dejando que el usuario elija qué aplicar mediante un multi-check, y no aplica nada sin que el usuario lo marque. Úsala cuando el usuario diga optimiza mi setup, invoque /optimize-my-setup, o pregunte qué automatizaciones le convienen.
---

# Optimize my setup

Recomienda y, solo con permiso explícito, aplica automatizaciones de Claude Code a este repo. **El usuario SIEMPRE decide qué se hace.**

## Fase 1 — Analiza (read-only)
Reúne señales del repo, sin modificar nada. **Infiere las convenciones de los datos reales, no de supuestos** (cita fichero/comando):
- **Stack:** `package.json`/`pyproject.toml`/`go.mod`/`Cargo.toml`… (gestor, scripts, deps de lint/format/test/CI, monorepo vs single).
- **Config Claude existente:** `.claude/` (agents, commands, hooks, settings), `CLAUDE.md`, `.mcp.json`.
- **Convención de commits:** `git log --oneline -50` → ¿Conventional Commits (`feat:`/`fix:`/`chore:`…)? ¿scopes? ¿idioma del mensaje? ¿política `Co-Authored-By` o trailers? ¿gitmoji?
- **Estrategia de branch naming:** `git branch -a` + ramas remotas → patrón (`feat/…`, `f<n>/<area>-<desc>`, `release/…`), ramas principales (`main`/`dev`), si hay PR-flow.
- **ADRs y procedimientos:** detecta y **lee** `docs/adr/` (o `docs/decisions/`), `CONTRIBUTING.md`, `.github/PULL_REQUEST_TEMPLATE*`, `CODEOWNERS`, `.github/workflows` (CI/release), `commitlint`/`husky`/`lefthook`. Extrae las invariantes para no recomendar lo que ya existe ni violarlas.
- **Reglas del proyecto:** `CLAUDE.md` + `~/.claude/rules` referenciadas.
- **Gaps:** formato/lint sin automatizar; convención de commits sin enforcement (sin commit-msg hook / commitlint); branch naming sin guard; ficheros sensibles o append-only sin protección; reglas no-negociables/ADRs sin reviewer; permisos que disparan prompts constantes; MCP útiles ausentes para el stack.

Las convenciones detectadas **alimentan las recomendaciones**: p.ej. un hook `commit-msg` que valida tu formato real de commits, un guard de branch-name con tu patrón, o un subagent ADR-aware que verifica el código contra tus decisiones registradas.

## Fase 2 — Recomienda (1–2 por categoría, específico al repo)
Para cada candidato indica: **qué**, **por qué** (señal concreta del repo, citando fichero), **dónde se instala**, y **riesgo**. Categorías: Hooks · Subagents · Skills/Commands · MCP · Permisos. No recomiendes lo que ya está. Ve más allá de listas genéricas: usa web search para el stack concreto si hace falta.

## Fase 3 — El usuario elige (OBLIGATORIO)
**Nunca apliques nada en este punto.** Presenta las recomendaciones como un **multi-select** (AskUserQuestion, `multiSelect: true`) con una opción por automatización propuesta, label corto + descripción del efecto y riesgo. El usuario marca las que quiera (puede marcar cero). Si hay muchas, agrupa en 2–3 preguntas multi-check por categoría.

## Fase 4 — Aplica SOLO lo marcado
Para cada ítem elegido:
- Escribe el fichero real (hook + entrada en `settings.json`, agente en `.claude/agents/`, command/skill, entrada en `.mcp.json`, o allow-list en `settings.json`).
- Hooks: robustos y **fail-open** (ante error, exit 0; no rompas el flujo).
- Verifica (`claude plugin validate` si aplica; o un dry-run del hook).
- Resume qué quedó instalado y cómo revertirlo.

Lo no marcado: no se toca. Ofrece volver a correr la skill cuando quiera.
