---
name: optimize-my-setup
description: Analiza el repo actual y optimiza TODA su config de Claude Code a su propia medida — CLAUDE.md, settings.json (permisos/hooks/env), settings.local.json, skills, agents, workflows, .mcp.json y output-styles. Reutiliza los plugins/skills del usuario donde encajan (no reinventa), genera a medida solo lo que falta, y SIEMPRE termina con un multi-check: no aplica nada sin que el usuario lo marque. Úsala cuando el usuario diga optimiza mi setup, invoque /optimize-my-setup, o pregunte qué le conviene configurar.
---

# Optimize my setup

Optimiza la config de Claude Code de ESTE repo en **todas** las superficies del directorio `.claude`, a la medida del proyecto. **Reusa antes de generar**; **referencia los originales** (auto-actualizan, crédito al autor); **el usuario SIEMPRE decide** (multi-check) — nada se aplica sin marcarlo.

## Fase 1 — Analiza (read-only)
Infiere de los datos REALES del repo, no de supuestos (cita fichero/comando):
- **Stack:** `package.json`/`pyproject.toml`/`composer.json`/`go.mod`/`Cargo.toml`/`Gemfile`… → ecosistema, gestor, scripts, deps de lint/format/test, CI, monorepo vs single.
- **Git:** convención de commits (`git log --oneline -50`: ¿Conventional? scopes, idioma, `Co-Authored-By`/trailers, gitmoji), branch naming (`git branch -a`), ramas principales (`main`/`dev`), PR-flow.
- **Reglas y decisiones:** lee `CLAUDE.md`, `docs/adr/`, `CONTRIBUTING.md`, `.github/PULL_REQUEST_TEMPLATE*`, `CODEOWNERS`, `.github/workflows`, `commitlint`/`husky`/`lefthook`.
- **Config Claude existente:** `.claude/` (agents, commands, hooks, settings, output-styles, workflows), `CLAUDE.md`, `.mcp.json`. No recomiendes lo que ya está.
- **Invariantes de dominio de ESTE repo:** ¿event bus / outbox? ¿i18n con catálogos? ¿migraciones append-only / audit log? ¿multi-tenancy? ¿ports & adapters? ¿auth/pagos? — lo que el repo cuida, leído de su código + ADRs.

## Fase 2 — Recomienda por superficie del directorio `.claude` (1–2 por superficie, cada una citando un fichero del repo)
**Regla: si una necesidad encaja con un plugin/skill del usuario, recomienda INSTALARLO (referencia el original), no lo reimplementes.** Genera a medida solo lo que no tenga equivalente.

- **`CLAUDE.md`** (contexto/convenciones) — si falta, genéralo (qué es, stack, estructura, comandos, reglas no-negociables derivadas de los ADR, convención de commits/branch detectada); si existe, propón mejoras puntuales + un bloque que **referencie el marketplace de metodología** del usuario (template `templates/claude-md-rules-reference.md`).
- **`settings.json`** —
  - **permissions**: allow-list de los comandos seguros REALES del repo (mata prompts). Base: `templates/permissions-allowlist.json`, ajustado al ecosistema detectado.
  - **hooks**: append-only guard si hay migraciones/audit (`hooks/guard-append-only.py`, configurable por glob); commit-msg lint con la convención detectada; guard de secretos.
  - **env**: vars de sesión NO secretas que el repo necesita.
- **`settings.local.json`** — overrides personales (gitignored): modelo, permisos extra. Nunca secretos.
- **`skills/`** — encaja con un plugin del usuario → **recomienda instalarlo**: metodología → `forge-methodology`/`working-methods`; diseño/UI → `design-review`; comms low-cost → `caveman` (original `JuliusBrussee/caveman`). Genera una skill propia SOLO si hay un workflow repetible del repo sin equivalente.
- **`agents/`** — **genera un reviewer por invariante detectado**, adaptado a los nombres/rutas/ADR del repo: event bus → `event-bus-reviewer`; i18n → `i18n-reviewer`; append-only; multi-tenancy; auth. Parte de `templates/reviewers/*` y **tunéalos al repo concreto** (no los copies tal cual).
- **`workflows/*.js`** — si hay orquestación multi-paso repetible (review por dimensiones, migración masiva, auditoría), propón un workflow determinista.
- **`.mcp.json`** — servidores MCP del stack detectado (Supabase si Supabase, Postgres, GitHub, Playwright si front, context7 para docs…). Entrega **`.mcp.json.example`** con secretos por `${VAR}` (nunca en git; regla de secretos).
- **`output-styles/*.md`** — propón un estilo si aporta (terse/caveman para sesiones largas, o un tono de dominio).

**Scope por ítem:** marca **project** (va al repo, compartido por el equipo) o **global/user** (todos tus repos). Secretos nunca a git.

## Fase 3 — El usuario elige (OBLIGATORIO)
**Nunca apliques nada aquí.** Presenta TODO como **multi-select** (AskUserQuestion, `multiSelect: true`): una opción por ítem con superficie + efecto + **scope** + riesgo. Agrupa en 2–4 preguntas por superficie si hay muchos. El usuario marca lo que quiera (puede marcar cero).

## Fase 4 — Aplica SOLO lo marcado
Para cada ítem elegido, en su scope correcto:
- **Genera/escribe** el fichero real: reviewers tuneados en `.claude/agents/`, entradas en `settings.json`, `.mcp.json.example`, `output-styles/*.md`, `workflows/*.js`, bloque en `CLAUDE.md`.
- **Plugins/skills del usuario:** instala/referencia el original (`claude plugin install <p>@claude-code-setup-optimizer`, `/plugin marketplace add JuliusBrussee/caveman`, `npx skills add autor/repo`) — **no copies** contenido de terceros.
- Hooks **fail-open** (ante error, exit 0). Verifica (`claude plugin validate` / dry-run del hook).
- Resume qué quedó, en qué scope, y **cómo revertir**. Lo no marcado no se toca. Ofrece re-correr cuando quiera.

> Reusa antes de generar · referencia originales (frescura + crédito) · el usuario siempre decide.
