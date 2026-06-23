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

**Qué obtienes:** un análisis read-only (convención de commits detectada, branch naming, ADRs, stack, config `.claude/` existente), luego 1–2 recomendaciones por categoría, y un **multi-check** para marcar qué aplicar. No se escribe nada hasta que lo marcas. Ejemplo del paso final:

```
¿Qué automatizaciones aplico? (marca las que quieras, o ninguna)
 ☐ Hook: format-on-edit (formatea en cada Edit, cualquier lenguaje)  — riesgo bajo
 ☐ Hook: guard-append-only (bloquea editar migraciones aplicadas)
 ☐ Subagent: messagebus-reviewer (refuerza el bus de eventos)
 ☐ Permisos: allow-list (mata ~80% de prompts de Bash)
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

## Hooks (pasivos — se disparan solos)

| Hook | Disparador | Qué hace |
|------|-----------|----------|
| `format-on-edit` | editas/escribes un fichero fuente (**cualquier lenguaje**) | corre el formateador del proyecto — prettier/biome (JS/TS/CSS/MD), ruff/black (Python), gofmt/goimports (Go), rustfmt (Rust), pint/php-cs-fixer (PHP), rubocop (Ruby), shfmt (shell); silencioso, no bloquea, no instala |
| `guard-append-only` | intentas editar una migración / log de auditoría ya commiteado | bloquea con mensaje: crea un fichero NUEVO (compensatorio) en su lugar |

Override de los globs append-only: `APPEND_ONLY_GLOBS="**/drizzle/*.sql,prisma/migrations/**"`.

---

## Subagents (despáchalos cuando aplique)

```
Usa el subagent messagebus-reviewer en los cambios de modules/booking — comprueba que nada emite eventos ad-hoc.
```
```
Usa el subagent i18n-reviewer en apps/web — caza strings de UI hardcoded y claves de locale faltantes.
```

**Qué obtienes:** lista priorizada (CRITICAL/HIGH/MEDIUM) con fichero:línea y el fix concreto, o un "todo limpio" explícito.

---

## caveman — comunicación de bajo coste

```
/caveman full
```
Comprime las respuestas ~75% manteniendo precisión técnica. Código, commits y seguridad en prosa normal. Apaga con `stop caveman`.
