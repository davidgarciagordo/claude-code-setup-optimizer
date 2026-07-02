[English](README.md) | **Español**

# claude-code-setup-optimizer — Ejemplos de uso

> Prompts copy-paste de cómo usar cada plugin: la skill del optimizer, los comandos, los hooks y los subagents.

Invocaciones reales — pega una en Claude Code tras instalar el marketplace. Cada una muestra qué escribir y qué obtienes.

---

## `/forge-run` — EL entrypoint (la columna vertebral codificada)

Para cualquier tarea sustancial, este es el único command. **Secuencia y enforda** toda la metodología — no llevas el orden a mano y no puedes saltarte una fase.

```
/forge-run añade idempotency keys al endpoint de charge de pagos
```

**Qué hace, en este orden fijo (gates checkeados por máquina):**

```
0.  init          → docs/forge/<slug>/run.json   (arma el gate de PR)
1.  align         → intent.md            (brainstorm + una tanda de preguntas de alto impacto)
2.  references    → references.md        (Reference Standard → req-ids enumerados)
3.  draft         → draft.md             (boceto de diseño concreto — barato de cambiar)
4.  grill ×3      → grill-verdicts.md    (/grill SOBRE EL BORRADOR: arquitecto · operador · ingeniero · completitud)
5.  checkpoint-1  → decisions-1.md       (DUEÑO: una tanda multi-select, recomendadas premarcadas)
6.  spec          → spec.md + acceptance-matrix.md   (la Definition of Done verificable)
7.  regrill ×2    → regrill-verdicts.md  (¿aguantan los fixes? + las costuras nuevas)
8.  checkpoint-2  → decisions-2.md       (DUEÑO: una tanda multi-select — spec cerrado)
9.  plan          → plan.md + execution-proposal.md  (plan global; multiagente por defecto)
10. execute       → context-pack.md      (worktrees + subagents disjuntos + context pack compartido)
11. verify        → verify.md            (reviewers + completeness-critic + design-review en diffs de UI)
12. handoff       → handoff.md           (/handoff; luego `forge.js complete`)
```

**Qué obtienes:** cada artefacto versionado en `docs/forge/<slug>/`, así el run sobrevive a la sesión. Un PR queda **bloqueado** (hook `guard-forge-artifacts`) hasta que existan spec + Acceptance Matrix + ambas actas de grill + ambos registros de decisiones + plan. El orden vive en `plugins/working-methods/workflows/forge.js`, no en un prompt que debas recordar.

```bash
node "$CLAUDE_PLUGIN_ROOT/workflows/forge.js" phases   # imprime la columna
node "$CLAUDE_PLUGIN_ROOT/workflows/forge.js" status   # dónde estoy, ¿gate abierto?
```

---

## `/install-family` — bootstrap de los 5 plugins (una vez)

```
/install-family
```

**Qué obtienes:** el marketplace añadido (idempotente), un chequeo de lo ya instalado, y los miembros que falten de la familia (`working-methods`, `automations`, `forge-methodology`, `design-review`) instalados — para que `/forge-run` tenga la herramienta de cada fase presente. `working-methods` (`forge-on-claude`) **requiere** `forge-methodology`; la fase verify llama a `design-review`.

---

## `/optimize-my-setup` — analiza el repo, tú eliges qué aplicar  *(setup, una vez)*

**Corto** — que analice y recomiende:

```
/optimize-my-setup
```

**Estructurado** — apúntale a lo que te importa:

```
/optimize-my-setup

Foco: flujo git (usamos Conventional Commits + trunk-based), seguridad de secretos, y reducir prompts de permisos.
Stack: monorepo pnpm, NestJS + Next.js, Drizzle/Postgres.
```

**Agnóstico de lenguaje:** funciona igual en un repo Python/Django, PHP/Laravel, Go, Rust o Ruby — detecta el stack desde `pyproject.toml`/`composer.json`/`go.mod`/`Cargo.toml`/`Gemfile`/`package.json` y adapta las recomendaciones (formateador, runner de tests, hook de lint) a ese ecosistema.

**Qué cubre:** *toda* la superficie `.claude` a medida de tu repo — `CLAUDE.md`, `settings.json` (permisos/hooks/env), `settings.local.json`, skills, **agents que genera por invariante detectado**, `workflows/*.js`, `.mcp.json`, `output-styles`. Si una necesidad encaja con uno de tus plugins, recomienda instalar el original en vez de reinventar.

**Qué obtienes:** un análisis read-only (convención de commits, branch naming, ADRs, stack, invariantes de dominio, config `.claude/` existente), luego 1–2 recomendaciones por superficie, y un **multi-check** para marcar qué aplicar — cada uno con su scope (project / global). No se escribe nada hasta que lo marcas. Ejemplo del paso final:

```
Marca qué aplicar (las que quieras, o ninguna) — cada una con [superficie · scope]:
 ☐ [CLAUDE.md · project]   bloque de rules que referencia tu marketplace de metodología
 ☐ [settings.json · project] allow-list de permisos (mata ~80% de prompts de Bash)
 ☐ [hook · project]        commit-msg lint con tu convención Conventional Commits
 ☐ [hook · project]        guard-append-only (bloquea editar migraciones aplicadas)
 ☐ [agent · project]       GENERA event-bus-reviewer tuneado a tu bus (ADR-xxxx)
 ☐ [.mcp.json · project]   añade Supabase + GitHub MCP (.example, secretos por ${VAR})
 ☐ [skill · user]          instala design-review@… para UI (original)
 ☐ [output-style · global] modo terse para sesiones largas
```

---

## `/grill` — adversarial ×3 sobre un spec o plan

```
/grill docs/specs/2026-rediseno-checkout.md
```

**Qué obtienes:** tres críticas independientes — **arquitecto** (reglas, precedentes, verificado contra el código con fichero:línea), **operador** (realidad del día a día, lo que rompe en el mostrador), **ingeniero** (concurrencia, edge cases, fallo bajo carga) — más una síntesis arbitrada y las decisiones que requieren tu input.

---

## `/handoff` — cierra sesión para que el trabajo sobreviva

```
/handoff siguiente: terminar el plan M1 de Expo, no tocar el módulo de billing
```

**Qué obtienes:** un MD de handoff versionado (prompt copy-paste para la siguiente sesión, trabajo en vuelo y cómo retomarlo, siguiente objetivo, qué NO tocar) + recordatorio de poner estado/memoria al día antes de cerrar.

---

## `/release` — PR de la rama de integración a producción

```
/release v1.4.0
```

**Qué obtienes:** notas de release generadas desde `git log <main>..<dev>`, agrupadas por tipo de commit, breaking changes marcados, y un PR `dev → main` creado (no mergeado — el release es un gate humano).

---

## Hook (pasivo — se dispara solo)

| Hook | Disparador | Qué hace |
|------|-----------|----------|
| `guard-append-only` | intentas editar una migración / log de auditoría ya commiteado | bloquea con mensaje: crea un fichero NUEVO (compensatorio) en su lugar — disciplina append-only |

Override de los globs append-only: `APPEND_ONLY_GLOBS="**/drizzle/*.sql,prisma/migrations/**"`.

---

## Reviewers de dominio — generados por repo, luego despachados

`optimize-my-setup` **no** shippea reviewers fijos. Detecta los invariantes de tu repo y, si los marcas, **genera reviewers tuneados en tu `.claude/agents/`** (adaptando `templates/reviewers/*` a tus nombres, rutas y ADRs reales). Una vez generados, los despachas como cualquier subagent:

```
Usa el subagent event-bus-reviewer en los cambios de <módulo> — comprueba que nada emite eventos ad-hoc.
```
```
Usa el subagent i18n-reviewer en <app> — caza strings de UI hardcoded y claves de locale faltantes.
```

Ejemplos de invariante → reviewer generado: event bus → `event-bus-reviewer` · catálogos i18n → `i18n-reviewer` · migraciones append-only → guard de migración · multi-tenancy → reviewer de aislamiento de tenant.

**Qué obtienes:** lista priorizada (CRITICAL/HIGH/MEDIUM) con fichero:línea y el fix concreto, o un "todo limpio" explícito.

---

## 🎯 Toda la metodología de una vez → eso es `/forge-run`

Antes esto era un prompt copy-paste que tenías que recordar y correr a mano — y por eso el orden se saltaba. **Ese prompt ahora es un command: `/forge-run` (arriba del todo).** Encadena las mismas piezas — `optimize-my-setup`/`install-family` para el setup → borrador + `/grill` ×3 + completitud → checkpoint #1 del dueño → spec + Acceptance Matrix → re-grill ×2 → checkpoint #2 del dueño → plan global + propuesta de ejecución → `forge-on-claude` (worktrees + context pack compartido) → reviewers + `completeness-critic` + `design-review` en UI → `/handoff` — pero el **orden está codificado** en `workflows/forge.js` y **gateado** por el hook `guard-forge-artifacts`, no a merced de la memoria.

```
/forge-run <tu tarea>
```

Para uso independiente, coge cualquier sección de arriba. `/forge-run` aplica `ultrathink` solo en las fases de razonamiento (grill, plan, verify).

---

## caveman — comunicación de bajo coste *(plugin original)*

caveman **no se bundlea** aquí — instala el original ([JuliusBrussee/caveman](https://github.com/JuliusBrussee/caveman)) y actívalo:

```
/caveman full
```
Comprime las respuestas ~75% manteniendo precisión técnica. Código, commits y seguridad en prosa normal. Apaga con `stop caveman`.
