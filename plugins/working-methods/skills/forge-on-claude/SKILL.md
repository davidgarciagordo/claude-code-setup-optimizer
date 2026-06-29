---
name: forge-on-claude
description: Mapea la metodología Forge (vendor-neutral) a las herramientas concretas de Claude Code — ultrathink para grill/plan, ultracode/Workflow para orquestar, git worktrees para aislamiento, subagents Task para unidades disjuntas, context pack encadenado para memoria compartida, /handoff como resume capsule. Úsala cuando ejecutes Forge en Claude Code y quieras saber qué herramienta usar en cada paso.
---

# Forge en Claude Code — mapa de herramientas

> **Dependencia declarada:** este skill **requiere el plugin `forge-methodology`**. `forge-on-claude` NO redefine la metodología — mapea el **loop neutral de 7 pasos del skill `forge-methodology`** a las herramientas de Claude Code. Sin él, la referencia de abajo al "loop neutral completo" cuelga. Instálalo con `/install-family` (o `claude plugin install forge-methodology@claude-code-setup-optimizer`). El command que EJECUTA este mapa en orden es **`/forge-run`**.

Forge es vendor-neutral (habla de "deep-reasoning tier", "isolated workspace", "context pack"). Aquí está el equivalente concreto en **Claude Code**. No cambia la metodología; solo dice qué botón pulsar.

| Concepto Forge (neutral) | En Claude Code |
|---|---|
| **Deep-reasoning tier** (grill ×3, plan global, arbitraje, review crítico) | **`ultrathink`** en el prompt (razonamiento profundo) + modelo **Opus**. |
| **Gate de entrada + gate al usuario** (dudas del grill → owner decide: acepta/cambia/añade/discrepa) | **`AskUserQuestion`** con `multiSelect: true` (≤4 preguntas/llamada, 2–4 opciones; recomendada con "(recomendada)"; "Other" = añade-la-tuya / discrepa). **Lo corre el orquestador, NUNCA un subagente** (los subagentes no preguntan al owner). |
| **Orquestar unidades disjuntas en paralelo** | **`ultracode`** / la tool **Workflow** (fan-out determinista) o varios **subagents `Task`** en un mismo mensaje (corren en paralelo). |
| **Isolated workspace** (1 unidad = 1 workspace) | **git worktree + rama por unidad** (`git worktree add`). Si el repo trae un flujo propio (p.ej. `/new-session`), úsalo. **1 sesión = 1 worktree = 1 rama.** |
| **Ownership claim** (declarar qué tocas antes) | Fichero de claim trackeado / asignación visible; subagents de una sesión = **áreas DISJUNTAS** (un fichero = un solo agente). |
| **Context pack compartido** (memoria unificada, no re-descubrir) | Fase 1 = subagents lectores que devuelven un **mapa con `file:line`** (salida estructurada); encadena esos resultados como **input** de la fase siguiente. No hagas que cada agente re-lea lo que otro ya mapeó. |
| **Resume capsule** (sobrevive a la sesión) | **`/handoff`** + un `state.md` commiteado por fase; retomar = leerlo, no re-derivar. |
| **Right capability per unit** (model routing) | **Opus** dirige/decide/grilla/revisa · **Sonnet** ejecuta planes cerrados / refactors / migraciones · **Haiku** lo trivial. |
| **Automate before spending capability** | Scripts/CLI (`rg`, `sed`, `jq`) para buscar/transformar/contar antes de gastar tokens. |
| **Verify independiente** | Subagents **adversariales** que intentan refutar el hallazgo (no el mismo agente que lo produjo). |
| **Checkpoint preventivo (~80% cuota)** | Commit por fase en el worktree; al saltar el límite, la sesión nueva retoma del último checkpoint. |

## Regla de oro
El **usuario siempre decide**: el plan global se aprueba antes de ejecutar, y los hallazgos/cambios se presentan para que elija (multi-check), nunca se aplican a ciegas. Ver el loop neutral completo en el skill `forge-methodology`.
