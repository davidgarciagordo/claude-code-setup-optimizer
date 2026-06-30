---
description: Grilla adversarial ×3 de un spec/diseño/plan, con 3 lentes fijas. Un supuesto no verificado contra el repo es un hallazgo.
argument-hint: [ruta al spec/plan, o describe qué grillar]
---

# Grill ×3 (adversarial)

Ataca el artefacto ($ARGUMENTS) con **tres lentes SIEMPRE**, en paralelo (un agente por lente, áreas disjuntas). Cada lente devuelve un acta de hallazgos. El orquestador (Opus) arbitra los conflictos y produce la versión siguiente del spec.

El grill corre **automático**, pero la convergencia automática esconde los momentos donde un juicio humano cambia el resultado. Dos gates los hacen explícitos sin frenar la máquina:

```
A. Gate de entrada   → dudas de alto impacto, ancladas en código + brief, en UNA tanda multi-select.
B. Grill ×3          → las tres lentes corren automáticas. Sin interrumpir al owner.
C. Gate al usuario   → las dudas que surgen, cada una con tu recomendada + alternativas,
                       para que el owner acepte / cambie / añada / discrepe — en UNA tanda multi-select.
D. Re-grill informado → una pasada automática más con las decisiones del owner. Luego, conclusiones.
```

### A. Gate de entrada (antes de las lentes)
Lee el artefacto y el repo primero. **Lo que puedas verificar leyendo el código, NO lo preguntes.** Presenta las decisiones de alto impacto que SOLO el owner puede resolver como UNA tanda `AskUserQuestion`: cada pregunta con 2–4 respuestas candidatas, la tuya recomendada primero y marcada "(recomendada)", y el campo "Other" para que añada la suya. Solo lo que cambia la dirección del grill — un puñado, una tanda, no un interrogatorio.

### B0. Context-pack — run the script, then hand it to the lenses (mecanismo de coste, no opcional)
Before dispatching the lenses, the orchestrator runs:

```bash
node "${CLAUDE_PLUGIN_ROOT}/workflows/grill-context.mjs" <artifact>
```

This writes `.forge/grill-context.md` deterministically: the target content, the repo map
(`file:line` of ADRs / CLAUDE.md / invariants / domain-keyword matches) and an empty `SHARED-FOUND`
section. **The 3–4 lenses read this pack; they do NOT re-scan the repo or re-derive what
`SHARED-FOUND` already lists.** The LLM only adds semantic relevance the script cannot derive
(e.g. resolving ambiguous terms in the artifact against repo intent); it does NOT redo the
mechanical file scan.

## Las 3 lentes (no negociables) — agentes READ-ONLY, salida TERSE
Despáchalas **en paralelo como sub-agentes con tool-list read-only** (no pueden editar — solo devuelven
hallazgos) pasándoles `.forge/grill-context.md`. Cada agente devuelve TERSE (`OK`/`KO` + hallazgos 1-línea
`Pn · fichero:línea · problema → fix`):
1. **`grill-architect`** (`agents/grill-architect.md`) — reglas, bounded contexts, precedentes; verifica cada supuesto contra el código real, cita `fichero:línea`.
2. **`grill-operator`** (`agents/grill-operator.md`) — el día a día en el mostrador con mala idea y prisa; flujos rotos, fricción, lo que el usuario hará MAL.
3. **`grill-engineer`** (`agents/grill-engineer.md`) — concurrencia, idempotencia, edge cases, fallos parciales, lo que rompe en producción.

### 4ª lente — Completitud (cuando hay Acceptance Matrix)
Si grillas un spec con **Acceptance Matrix** (p.ej. dentro de `/forge-run`), añade el agente
**`completeness-critic`** (`agents/completeness-critic.md`, bundled in this plugin — read-only + terse,
recibe el mismo pack): ¿cubre **cada fila** de la matriz? ¿Hay **contradicciones/huecos en la intención
del owner**? Cada fila sin cobertura o contradicción = hallazgo. Detecta el gap ANTES de ejecutar.

## Reglas (mecanismo, no consejo)
- **Lentes READ-ONLY** (tool-list sin Edit/Write): son diagnóstico, no aplican nada. El owner decide
  (gate C) y solo entonces se aplica — fuera del grill. Una lente que edita se salta el gate.
- **Un supuesto no verificado contra el repo = hallazgo.** Citan `fichero:línea`.
- **Salida terse** (forzada en cada agent def): hallazgos 1-línea, sin ensayos. El último mensaje del
  sub-agente es DATO para el orquestador, no un informe humano.
- Modelo: lentes en Sonnet (barrido); el orquestador (arbitraje + gate al usuario) en Opus.

## C. Gate al usuario (tras las 3 actas, ANTES de las conclusiones)
No resuelvas en silencio las dudas que surgen. Para cada duda / contradicción / supuesto sin verificar, calcula tu **respuesta recomendada + las alternativas vivas**, y preséntalas como UNA tanda multi-select:
- Cada ítem: la duda en cristiano + tu recomendada (premarcada) + las alternativas + la(s) lente(s) que la levantó.
- El owner puede **aceptar**, **elegir otra**, **añadir la suya**, o **discrepar** (rechazar + nota).
- Agrupa por severidad (blocking → significant → minor) para que sea escaneable; premarca las recomendadas.
- `AskUserQuestion` con `multiSelect: true` (≤4 preguntas/llamada, 2–4 opciones; su "Other" = añade-la-tuya / discrepa). Si quedan más dudas, varias tandas, las más críticas primero, y di cuántas quedan.
- **Lo corre el orquestador, NUNCA un subagente griller** — los subagentes no pueden preguntar al owner. Las lentes producen hallazgos + recomendadas; el orquestador las presenta y recoge las decisiones.

## D. Re-grill informado
Mete las decisiones del owner y corre **una pasada automática más**, enfocada en: las costuras que abren las respuestas elegidas + lo que el owner discrepó o añadió y las lentes no consideraron. Repite el gate solo si el re-grill levanta dudas blocking genuinamente nuevas — no marees al owner con lo ya cerrado.

## Salida
Tres actas + síntesis arbitrada + el **gate al usuario resuelto** (decisiones del owner registradas) + la versión siguiente del spec.
