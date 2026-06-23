---
description: Cierra la sesión y deja un relevo limpio para la siguiente (trabajo que sobrevive a la sesión).
argument-hint: [siguiente objetivo acordado]
---

# Handoff de sesión

Releva cuando: el contexto arrastra días/decenas de PRs (cada turno paga el historial) o se cierra un bloque natural. Una sesión fresca con buen handoff rinde más y cuesta menos que una larga compactada.

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
