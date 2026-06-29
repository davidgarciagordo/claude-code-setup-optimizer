---
name: optimize-my-setup
description: Analiza el repo actual y optimiza TODA su config de Claude Code a su propia medida — CLAUDE.md, settings.json (permisos/hooks/env), settings.local.json, skills, agents, workflows, .mcp.json y output-styles. Reutiliza los plugins/skills del usuario donde encajan (no reinventa), genera a medida solo lo que falta, y SIEMPRE termina con un multi-check: no aplica nada sin que el usuario lo marque. Úsala cuando el usuario diga optimiza mi setup, invoque /optimize-my-setup, o pregunte qué le conviene configurar.
---

# Optimize my setup

Optimiza la config de Claude Code de ESTE repo en **todas** las superficies del directorio `.claude`, a la medida del proyecto. **Reusa antes de generar**; **referencia los originales** (auto-actualizan, crédito al autor); **el usuario SIEMPRE decide** (multi-check) — nada se aplica sin marcarlo.

> **Esto es SETUP del repo, no un paso de construir una feature.** Configura el taller; el run que construye es `/forge-run`. Córrela una vez (y al cambiar stack/convenciones).

## Fase 0 — Bootstrap de la familia (verifica, no asumas)
Antes de recomendar nada, comprueba que la **familia de 4 plugins** está instalada — `working-methods`, `automations`, `forge-methodology`, `design-review` — con `claude plugin list`. La metodología solo "aplica" si los 4 están: `/forge-run` (working-methods) delega en el skill `forge-methodology` y dispara `design-review` en su fase verify. Si falta alguno, recomienda correr **`/install-family`** (lo instala/verifica como unidad) como primer ítem del multi-check.

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
  - **hooks**: cablea los **templates parametrizables de `templates/hooks/`** que apliquen al repo (wiring en `templates/hooks/README.md`): `guard-append-only` (migraciones/audit, **fail-closed**, ya activo en el plugin); `guard-main` (no commit/push directo a rama protegida — `PROTECTED_BRANCHES`); `commit-msg-lint` (la convención de commits detectada — `COMMIT_TYPES`); `secrets-guard` (nada de secretos en git); `ui-diff-design-review` (PostToolUse: dispara `design-review` en diffs de UI).
  - **env**: vars de sesión NO secretas que el repo necesita.
- **`settings.local.json`** — overrides personales (gitignored): modelo, permisos extra. Nunca secretos.
- **`skills/`** — encaja con un plugin del usuario → **recomienda instalarlo**: metodología → `forge-methodology`/`working-methods`; diseño/UI → `design-review`; comms low-cost → `caveman` (original `JuliusBrussee/caveman`). Genera una skill propia SOLO si hay un workflow repetible del repo sin equivalente.
- **`agents/`** — **genera un reviewer por invariante detectado**, adaptado a los nombres/rutas/ADR del repo: event bus → `event-bus-reviewer`; i18n → `i18n-reviewer`; append-only; multi-tenancy; auth. Parte de `templates/reviewers/*` y **tunéalos al repo concreto** (no los copies tal cual). Incluye el reviewer genérico **`completeness-critic`** (verifica completitud contra la Acceptance Matrix; lo usa el `/grill` como 4ª lente y el `/forge-run` en verify) — este NO necesita tuneo de dominio.
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
- **Contrato de los hooks (importante):** un guard que protege un invariante es **fail-closed** — si NO puede verificar su precondición (error de git, manifest ilegible…), **bloquea (exit 2 "no pude verificar")**, no permite en silencio (ese silencio era el agujero original del append-only). Solo permite (exit 0) cuando, comprobado, no hay nada que proteger. Donde bloquear cada PR sería desproporcionado, degrada a aviso explícito (modo `warn`), nunca a allow mudo. Verifica (`claude plugin validate` / dry-run del hook).
- Resume qué quedó, en qué scope, y **cómo revertir**. Lo no marcado no se toca. Ofrece re-correr cuando quiera.

> Reusa antes de generar · referencia originales (frescura + crédito) · el usuario siempre decide.
