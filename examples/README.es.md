[English](README.md) | **Español**

# claude-code-setup-optimizer — Ejemplos de uso

> Prompts copy-paste de cómo usar cada plugin: la skill del optimizer, los comandos, los hooks y los subagents.

Invocaciones reales — pega una en Claude Code tras instalar el marketplace. Cada una muestra qué escribir y qué obtienes.

---

## `/optimize-my-setup` — analiza el repo, tú eliges qué aplicar

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

## 🎯 Un prompt para todos — una pasada completa de Forge-on-Claude

Cada sección de arriba ejecuta **una** skill por separado. Para usar toda la metodología de una vez, compónlas:

```
ultrathink. Pasa esto por la Forja de principio a fin:

Tarea: <tu tarea>
1. /optimize-my-setup primero — detecta mi stack, convención de commits y ADRs, y aplica solo las automatizaciones que confirme.
2. Especifícalo, luego /grill al spec ×3 (arquitecto · operador · ingeniero); resuelve los hallazgos.
3. Planifica global; ejecuta unidades disjuntas, cada una en su git worktree (forge-on-claude), compartiendo UN context pack (file:line) para no re-descubrir nada.
4. Verifica contra la definición de done con subagents adversariales (messagebus-reviewer / i18n-reviewer si aplica).
5. /handoff al final para que la siguiente sesión retome limpio.
Muéstrame las decisiones que requieren mi input; nunca apliques nada que yo no haya elegido.
```

Encadena `optimize-my-setup` → `/grill` → `forge-on-claude` (worktrees + context pack) → reviewers → `/handoff`. Para uso independiente, coge cualquier sección de arriba.

---

## caveman — comunicación de bajo coste *(plugin original)*

caveman **no se bundlea** aquí — instala el original ([JuliusBrussee/caveman](https://github.com/JuliusBrussee/caveman)) y actívalo:

```
/caveman full
```
Comprime las respuestas ~75% manteniendo precisión técnica. Código, commits y seguridad en prosa normal. Apaga con `stop caveman`.
