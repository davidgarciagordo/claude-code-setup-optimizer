---
description: Cierra la sesión y deja un relevo limpio para la siguiente (trabajo que sobrevive a la sesión).
argument-hint: [siguiente objetivo acordado]
---

# Handoff de sesión

## Auto-propón el relevo — no esperes a que lo pidan (trigger binario, cada vez que cierras un hito)

El owner pidiéndolo es un ATAJO, no el disparador. Tras cada hito mergeado, evalúa DOS señales
verificables — si **AMBAS** valen, propón el relevo tú, en una frase:

1. **Sesión larga** (mides, no intuyes): el `ctx:%` del statusline está en zona alta (≳60%), **o**
   arrastras >1 día / ≥10 PRs de historial.
2. **Bloque cerrado**: el trabajo actual está mergeado · `git status` limpio · 0 PRs/worktrees en
   vuelo · el siguiente objetivo es independiente del contexto acumulado.

AMBAS → una frase: *"Momento óptimo de relevo — `<hito>` mergeado, contexto al ~X%. ¿Nueva sesión
con handoff? Rinde más que seguir compactando (tu norma)."* Solo una → sigue trabajando. Una sesión
larga con bloque cerrado que NO propone relevo está quemando la ventana en lugar de arrancar fresca.

> Nota: proponer ≠ ejecutar. Propones; el owner decide. Si dice sí → el checklist de abajo.

## Checklist (créalo como todos)
1. **El trabajo en background sobrevive al cierre:** workflows/agentes commitean **por fases** en su worktree/rama. Al cerrar, lo parcial queda en git → la sesión nueva retoma con `git log origin/main..HEAD` + agentes "CONTINÚA" (nunca rehacer desde cero).
2. **Escribe el handoff MD** versionado en el repo (`docs/.../handoffs/YYYY-MM-DD-next-session.md`):
   - **Prompt copy-paste** para la sesión nueva (1-2 líneas: "lee este fichero y continúa" + modo de trabajo).
   - Trabajos EN VUELO: dónde (worktree/rama), qué fase iba, cómo retomarlos.
   - Siguiente objetivo ($ARGUMENTS) y qué NO tocar.
   - Mapa de referencias: doc de estado, backlog, specs, memoria.
3. **Estado/memoria al día ANTES de cerrar:** doc de estado del proyecto, backlog y memoria persistente (decisiones, lecciones con nº de PR, principios del usuario). El handoff apunta, no duplica.
4. **Mergea el handoff** (el relevo no depende de la máquina ni de la sesión).

## Modo que el relevo hereda
- **Merge en verde:** review siempre antes de merge; limpieza de rama/worktree/claim al mergear.
- **Modelos por tarea:** Opus dirige/decide/revisa lo crítico · Sonnet ejecuta planes cerrados · Haiku lo trivial.
- **Workflows con memoria unificada:** fase 1 = context pack con `fichero:línea`; resultados encadenados entre fases; áreas disjuntas entre agentes paralelos.
- **Spec → plan → ejecución;** no adelantar trabajo que dependa de un estado que aún cambia.
