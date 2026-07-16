---
name: optimize-my-setup
description: "Analiza el repo actual y optimiza TODA su config de Claude Code a su propia medida — CLAUDE.md, settings.json (permisos/hooks/env), settings.local.json, skills, agents, workflows, .mcp.json y output-styles. Reutiliza los plugins/skills del usuario donde encajan (no reinventa), genera a medida solo lo que falta, y SIEMPRE termina con un multi-check: no aplica nada sin que el usuario lo marque. Úsala cuando el usuario diga optimiza mi setup, invoque /optimize-my-setup, o pregunte qué le conviene configurar."
---

# Optimize my setup

Optimiza la config de Claude Code de ESTE repo en **todas** las superficies del directorio `.claude`,
a la medida del proyecto. **El usuario SIEMPRE decide** (multi-check) — nada se aplica sin marcarlo.

> **SETUP del repo, no un paso de feature** (eso es `/forge-run`). Córrela una vez y al cambiar stack/convenciones.

## Fase 0 — Detecta qué hay instalado (verifica, no asumas)
Con `claude plugin list`, mira qué plugins tiene el usuario. **Este plugin funciona standalone
completo** — ninguna fase depende de otro plugin. Si la familia del autor está instalada
(`working-methods`, `forge-methodology`, `design-review`, `token-economy`), aprovéchala en las
recomendaciones de Fase 3 (son plugins que ya tiene → regla de reuso). Si no está, NO la exijas:
sigue con el pipeline completo y, como mucho, inclúyela como recomendación opcional más del
multi-check (nunca como prerequisito ni como ítem #1).

## Fase 1 — Context pack (run the scanner, do NOT re-scan by hand)

```bash
node "${CLAUDE_PLUGIN_ROOT}/skills/optimize-my-setup/scan.mjs" --md
```

Read the emitted markdown pack. Interpret it — what does this project need, given its ecosystem,
commit convention, branches, existing `.claude` surfaces, and CI? The LLM does NOT redo the
mechanical scan; it adds the semantic interpretation the script cannot.

**Economía de tokens:** el orquestador lee el pack UNA vez y lo pasa a los sub-agentes de Fase 2.
Sub-agentes en Sonnet; salida terse (`OK`/`KO` + ≤8 palabras + hallazgos 1-línea). Sin preámbulo.

## Fase 2 — Fan-out por superficie (agentes paralelos, read-only, terse)

Lanza **un sub-agente read-only por superficie**, en paralelo (áreas disjuntas), cada uno recibe
el context-pack como entrada y devuelve `superficie · fichero · recomendación` (1 línea por ítem):

1. **settings** — allow-list de permisos reales del repo + hooks que aplican + env vars de sesión.
2. **hooks** — templates de `${CLAUDE_PLUGIN_ROOT}/templates/hooks/` que encajan con los invariantes detectados.
3. **agents** — reviewers a generar (uno por invariante de dominio detectado: event-bus, i18n,
   append-only, multi-tenant, auth…). Incluye siempre `completeness-critic` (sin tuning de dominio).
4. **mcp** — servidores MCP para el stack detectado.
5. **skills** — skills/plugins a instalar (referencia el original, no reimplementa).

## Fase 3 — Recomienda por superficie

**Regla: si una necesidad encaja con un plugin/skill del usuario, recomienda INSTALARLO** (referencia
el original); genera a medida solo lo que no tenga equivalente. Cada recomendación cita un fichero
del repo. **Todo lo que GENERES a medida (una regla de CLAUDE.md, un hook, un agente, un skill) es
una instrucción que un LLM ejecutará → pásale el executor-eye check antes de proponerlo** —
reléelo con los ojos del ejecutor, sin el contexto de tu sesión:
1. **Trigger binario** — cada "haz X cuando Y" tiene un Y verificable, no una vibra.
2. **Sin eco** — ninguna regla dicha dos veces (dos copias derivan en el siguiente edit).
3. **Sin contradicción** — no choca con la config que el repo ya tiene ni con su fichero hermano.
4. **Sin supuesto tácito** — ningún paso asume un path/decisión/fichero que solo tu sesión conoce.

(Fuente canónica ampliada: `references/executor-eye-check.md` del plugin `working-methods`,
si está instalado.) Cubre:

- **`CLAUDE.md`** — si falta, generalo; si existe, mejoras puntuales + bloque de referencia al
  marketplace (`${CLAUDE_PLUGIN_ROOT}/templates/claude-md-rules-reference.md`).
- **`settings.json`** — permissions (base: `${CLAUDE_PLUGIN_ROOT}/templates/permissions-allowlist.json`);
  hooks (`${CLAUDE_PLUGIN_ROOT}/templates/hooks/`); env vars de sesión no-secretas.
- **`settings.local.json`** — overrides personales gitignored (modelo, permisos extra). Nunca secretos.
- **`skills/`** — metodología → `forge-methodology`/`working-methods`; diseño → `design-review`; etc.
- **`agents/`** — reviewers tuneados al repo (partes de `${CLAUDE_PLUGIN_ROOT}/templates/reviewers/*`) + `completeness-critic`.
- **`workflows/*.js`** — orquestación multi-paso repetible si aplica.
- **`.mcp.json`** — entrega `.mcp.json.example` con `${VAR}` para secretos (nunca en git).
- **`output-styles/*.md`** — economía de SALIDA: recomienda el `frugal` de `token-economy` (resultado primero, sin play-by-play, resumen al final) y/o `caveman` (compresión de estilo). Apilan.
- **token economy (entrada+salida)** — si el repo orquesta multi-agente, recomienda instalar `token-economy@davidgarciagordo-plugins` (catálogo `davidgarciagordo/claude-plugins`): `scripts/context-pack.mjs` (discover-once), plantilla de agente read-only, adapter de memoria pluggable, y el output-style `frugal`. Es la fuente única; el resto de la familia la hereda (no se duplica).

**Scope por ítem:** marca **project** (compartido) o **global/user** (todos tus repos). Secretos nunca a git.

## Fase 4 — Multi-check del usuario (gate mecánico, OBLIGATORIO)

`AskUserQuestion` con `multiSelect: true`, ≤4 preguntas por llamada (si hay más ítems: varias
tandas, mayor impacto primero, di cuántas quedan). Cada opción con el formato fijo
`superficie · fichero · efecto · scope (project/global) · riesgo`. El usuario puede marcar cero.
**PROHIBIDO cualquier Write/Edit/instalación ANTES de que el multi-check devuelva** —
una recomendación sin marcar no existe.

## Fase 5 — Aplica SOLO lo marcado

Para cada ítem elegido, en su scope correcto:
- **Genera/escribe** el fichero real: reviewers tuneados, entradas en `settings.json`, etc.
- **Plugins/skills del usuario:** instala/referencia el original — **no copies** su contenido.
- **Contrato de los hooks:** fail-closed — bloquea en la duda (exit 2 "no pude verificar"), nunca
  permite en silencio. Degrada a aviso explícito solo donde bloquear PR sería desproporcionado.
- Resume qué quedó, en qué scope, y cómo revertir. Lo no marcado no se toca.

> Reusa antes de generar · el usuario siempre decide.
