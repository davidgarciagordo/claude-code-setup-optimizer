---
description: Cierra la sesión y deja un relevo limpio para la siguiente (trabajo que sobrevive a la sesión).
argument-hint: [siguiente objetivo acordado]
---

# Handoff de sesión

## PRIMERO: ¿conversación VIVA o modo AUTÓNOMO? (esto decide si preguntas o ejecutas solo)

El handoff es autónomo en las DOS caras — en **pedirlo** y en **ejecutarlo** — pero el disparo cambia
según haya o no un humano delante. Detéctalo antes de nada:

- **VIVA (el usuario está presente / respondiendo):** el handoff **NUNCA se ejecuta sin su OK**.
  Auto-propón el relevo cuando sea óptimo (trigger binario, abajo) y **PREGUNTA**. Si dice que sí,
  **ejecútalo tú, autónomo, en ESTA misma conversación** — corre el checklist entero, no dejes el MD a
  medias ni pares tras escribirlo. Preguntar es obligatorio; una vez aprobado, la ejecución es tuya.
- **AUTÓNOMA (sin humano mirando: cron/`/loop`/background/`$CLAUDE_JOB_DIR`/trabajo nocturno):** no hay
  a quién preguntar → **ejecuta el handoff solo** cuando el bloque se cierra (checklist + arma el trigger
  activo de continuación). Aquí escribir el MD es un checkpoint, NO un stop.

**Regla de oro: usuario presente → preguntar (y ejecutar en-sesión si dice sí); sin usuario → ejecutar
solo.** Nunca al revés: no auto-ejecutes el relevo con el owner delante sin su OK, ni te quedes esperando
un input que no va a llegar si estás solo.

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

## Modo AUTÓNOMO — arma la continuación, no esperes a que despierten (mecanismo, no nota)

Detecta si NO hay humano mirando: la sesión la arrancó cron/`/loop`, corre en background
(`$CLAUDE_JOB_DIR` seteado), o es trabajo nocturno desatendido. En ese modo el handoff MD es un
**checkpoint, NO un stop.** Escribir el MD y parar deja la cadena rota: un documento pasivo necesita
que un humano lo lea y lance la sesión nueva — y si duermes, no pasa. El último acto OBLIGATORIO del
turno es armar un **trigger activo** (esto es lo que un command/skill NO hace solo):

- **Queda contexto + la sesión sigue viva** → `ScheduleWakeup` / `CronCreate` con el prompt de resume
  (abajo): re-entran en ESTA sesión tras el delay y siguen la MISMA tarea. **AVISO doble (verifícalo,
  no lo asumas):** (1) estas tools son **propias de algunos harnesses, NO estándar de Claude Code** —
  comprueba que existen en tu tool-list antes de contar con ellas; (2) donde existen, en muchos
  harnesses son **session-only** — in-memory, mueren al cerrar la sesión
  (`CronCreate`: "gone when Claude exits", `durable` sin efecto). Sirven para continuar MIENTRAS la
  sesión vive, **NO** para sobrevivir a su muerte.
- **La sesión puede morir / contexto agotado** → hace falta un scheduler **DURABLE fuera de la sesión**:
  el skill **`schedule`** (routines cloud que corren server-side) o un **cron del SO / externo** cuyo
  prompt sea el resume. Es lo ÚNICO que arranca una sesión NUEVA sobreviviendo a que esta se acabe. Un
  `CronCreate`/`ScheduleWakeup` en memoria **NO** cuenta aquí (se van con la sesión). Comprueba la
  durabilidad del scheduler ANTES de confiarle el relevo; si no es durable, el relevo se pierde al dormir.

**Regla dura — finales, no los confundas (el bug clásico es tratar autónomo+pendiente como stop):**

| Situación | Acción correcta |
|---|---|
| **VIVO** + momento óptimo de relevo | **PREGUNTA** al owner; si dice sí, ejecuta el handoff autónomo en-sesión (NO auto-ejecutes sin su OK) |
| **AUTÓNOMO** + trabajo PENDIENTE (aun con contexto agotado) | Ejecuta el handoff solo + **dispara la continuación con un scheduler DURABLE** (skill `schedule` cloud / cron externo si la sesión puede morir; `ScheduleWakeup`/`CronCreate` solo si sigue viva — son session-only); NO pares a esperar humano |
| Bloque cerrado + objetivo cumplido | Parar de verdad |
| Bloqueado en input humano (auth, decisión cara/irreversible) | Parar y esperar — aquí SÍ, haya o no humano |

### Prompt de resume — DETERMINISTA, ejecutable, idempotente (no "continúa" a secas)
Imperativo y autosuficiente; la sesión nueva NO re-planifica, retoma contra git:
> *Lee `docs/.../handoffs/<último>.md`. Corre PRIMERO `git log origin/<base>..HEAD` y `gh pr list`
> para ver qué YA está mergeado (no lo rehagas). Retoma los trabajos EN VUELO con agentes "CONTINÚA
> desde `<fase>`". Modo autónomo: worktrees aislados, merge en verde (verifica TÚ los tests), commit
> por fase. Al cerrar cada hito vuelve a `/handoff`.*

### Guardrails (para que el auto-arranque nocturno no se descontrole)
- **Tope de ciclos:** máx N auto-continuaciones (p.ej. 6) → sin loop infinito ni factura sorpresa.
- **Budget guard:** parar si se agota el presupuesto de tokens del turno.
- **Kill-switch:** env-flag para desactivar el re-arranque sin tocar el command.
- **Night-log:** una línea por ciclo (qué hizo) → por la mañana ves el rastro sin releer todo.
- **Commit por fase** (ya en el checklist): el trabajo sobrevive aunque un ciclo muera a mitad.

## Checklist (créalo como todos)
1. **El trabajo en background sobrevive al cierre:** workflows/agentes commitean **por fases** en su worktree/rama. Al cerrar, lo parcial queda en git → la sesión nueva retoma con `git log origin/main..HEAD` + agentes "CONTINÚA" (nunca rehacer desde cero).
2. **Escribe el handoff MD** versionado en el repo (`docs/.../handoffs/YYYY-MM-DD-next-session.md`):
   - **Prompt copy-paste** para la sesión nueva (1-2 líneas: "lee este fichero y continúa" + modo de trabajo).
   - Trabajos EN VUELO: dónde (worktree/rama), qué fase iba, cómo retomarlos.
   - Siguiente objetivo ($ARGUMENTS) y qué NO tocar.
   - Mapa de referencias: doc de estado, backlog, specs, memoria.
3. **Estado/memoria al día ANTES de cerrar:** doc de estado del proyecto, backlog y memoria persistente (decisiones, lecciones con nº de PR, principios del usuario). El handoff apunta, no duplica.
4. **Mergea el handoff** (el relevo no depende de la máquina ni de la sesión).
5. **IMPRIME el prompt de lanzamiento EN-SESIÓN** (SIEMPRE, último paso): tras escribir/mergear el MD,
   echa al chat el prompt copy-paste que el owner debe lanzar en la sesión nueva, en un bloque cercado
   (```), listo para copiar SIN abrir el fichero. Enterrarlo solo en el MD NO basta — el owner lo quiere
   a la vista en la conversación. En modo autónomo el prompt es el que alimenta el `ScheduleWakeup`/
   `CronCreate` (mismo texto); en modo vivo se imprime para que el owner lo pegue. El prompt es el mismo
   que va dentro del MD (§ "Prompt copy-paste"): DETERMINISTA e idempotente contra git, no "continúa" a secas.

## Modo que el relevo hereda
- **Merge en verde:** review siempre antes de merge; limpieza de rama/worktree/claim al mergear.
- **Modelos por tarea:** Opus dirige/decide/revisa lo crítico · Sonnet ejecuta planes cerrados · Haiku lo trivial.
- **Workflows con memoria unificada:** fase 1 = context pack con `fichero:línea`; resultados encadenados entre fases; áreas disjuntas entre agentes paralelos.
- **Spec → plan → ejecución;** no adelantar trabajo que dependa de un estado que aún cambia.
