[English](README.md) | **Español**

# ⚡ automations — optimiza TODO el setup de Claude Code de un repo; tú marcas qué se aplica

Un comando — `/optimize-my-setup` — escanea el repo de forma determinista, lanza un agente
read-only por superficie `.claude`, y presenta **cada** recomendación como un checklist
multi-select. Nada toca disco hasta que lo marcas.

## ¿Por qué no basta `/init`?

`/init` te escribe un `CLAUDE.md`. Eso es una superficie de ocho, y aplica su output sin preguntar.

| | `/init` vanilla | `automations` `/optimize-my-setup` |
|---|---|---|
| Superficies cubiertas | 1 (`CLAUDE.md`) | 8 — `CLAUDE.md`, `settings.json` (permisos/hooks/env), `settings.local.json`, `skills/`, `agents/`, `workflows/`, `.mcp.json`, `output-styles/` |
| Cómo se analiza el repo | El modelo lee por ahí | `scan.mjs` determinista (sin deps, output estable) + agentes read-only por superficie interpretando el pack |
| Quién decide qué se aplica | Aplica sobre la marcha | **Gate multi-check**: cada ítem es un checkbox; sin marcar = sin tocar |
| Enforcement | Consejo en prosa | Hooks fail-closed (exit 2 en "no pude verificar", nunca permitir en silencio) |
| Reviewers de dominio | Ninguno | **Generados por repo** desde templates, uno por invariante detectado |
| Tus plugins/skills existentes | Los ignora | Reusar-antes-de-generar: recomienda instalar el original, nunca lo copia |

## Qué hay dentro

| Pieza | Ruta | Qué hace |
|---|---|---|
| Skill `optimize-my-setup` | `skills/optimize-my-setup/SKILL.md` | El pipeline de 5 fases: detectar plugins instalados → context pack → fan-out por superficie → **multi-check obligatorio** → aplicar solo lo marcado |
| Scanner determinista | `skills/optimize-my-setup/scan.mjs` | Repo → context pack (ecosistema, convención de commits, ramas, superficies `.claude`, CI, invariantes de dominio desde `CLAUDE.md` **+ señales de código**). Sin deps, sin aleatoriedad — mismo repo, mismo output |
| Comando `/optimize-my-setup` | `commands/optimize-my-setup.md` | Wrapper fino del skill como slash-command (fuente única — no re-deriva las fases) |
| Comando `/release` | `commands/release.md` | PR de release integración → producción con notas legibles; lee las ramas reales del pack del scanner en vez de asumir `dev → main` |
| Hook activo `guard-append-only` | `hooks/guard-append-only.py` | Viene activado. Bloquea editar ficheros append-only ya commiteados (migraciones aplicadas, ledgers). **Fail-closed**: no puede verificar git → bloquea con exit 2 |
| Hook templates ×4 | `templates/hooks/` | `guard-main` (nada de commit/push directo a ramas protegidas), `commit-msg-lint` (Conventional Commits), `secrets-guard` (11 patrones de secretos), `ui-diff-design-review` (un diff de UI dispara design review). Wiring en `templates/hooks/README.md` |
| Reviewer templates ×5 | `templates/reviewers/` | `completeness-critic` (genérico, usable tal cual) + 4 reviewers de dominio que el skill **adapta por repo**: `ds-adoption-reviewer`, `defense-and-coverage-reviewer`, `event-bus-reviewer`, `i18n-reviewer` |
| Allowlist de permisos | `templates/permissions-allowlist.json` | Base de comandos read-only + dev seguros para matar prompts repetidos; adáptala a tu ecosistema |
| Bloque de rules para CLAUDE.md | `templates/claude-md-rules-reference.md` | Plantilla para referenciar tus normas always-on desde el `CLAUDE.md` del repo (apuntar, no copiar) |

## Demo de 60 segundos

```
/optimize-my-setup
```

Corre el scanner, reportan cinco agentes read-only, y recibes un multi-select como:

```
Marca qué aplicar (0..n) — lo no marcado no se toca:

[ ] settings · .claude/settings.json · allowlist para git/gh/pnpm read-only · project · bajo
[ ] hooks    · .claude/hooks/guard-main.py · bloquear commit/push directo a main · project · bajo
[ ] agents   · .claude/agents/i18n-reviewer.md · generado para locales/{en,es} + t() · project · bajo
[ ] mcp      · .mcp.json.example · MCP de postgres con placeholder ${DATABASE_URL} · project · medio

Quedan 3 ítems en la siguiente tanda (skills, output-styles, CLAUDE.md).
```

Marcas dos, dejas el resto — solo esos dos ficheros se escriben, cada uno con su scope y cómo revertir.

## La garantía del multi-check

El gate es regla dura del skill (`skills/optimize-my-setup/SKILL.md`, Fase 4), citado literal:

> **PROHIBIDO cualquier Write/Edit/instalación ANTES de que el multi-check devuelva** —
> una recomendación sin marcar no existe.

Puedes marcar cero ítems e irte con el repo intacto.

## Principios de diseño

- **Scan determinista.** La parte mecánica (ecosistema, ramas, convención de commits,
  invariantes) es un script sin dependencias, no adivinación del modelo — mismo input, mismo
  pack. El modelo solo añade la capa semántica encima.
- **Hooks fail-closed.** Un guard que no puede verificar su precondición bloquea (exit 2 con
  "no pude verificar"), nunca permite en silencio. `guard-append-only.py` documenta también su
  limitación honesta: engancha Edit/Write, no mutaciones vía Bash.
- **Reusar antes de generar.** Una necesidad que ya cubre un plugin/skill existente se convierte
  en "instala el original" — se referencia el contenido, nunca se vendoriza, así se mantiene al
  día en su fuente y el autor conserva el crédito.
- **Los reviewers se generan, no se shippean.** El plugin trae *templates* de reviewer; el skill
  instancia un agente por invariante que detecta de verdad (multi-tenant, i18n, event bus,
  append-only…), tuneado con los nombres reales de paquetes, tablas y rutas del repo. Sin
  agentes fijos contaminando todos los proyectos.

## Standalone vs la familia

**Todo lo de aquí funciona standalone** — ningún otro plugin es prerequisito. Si la familia del
autor está instalada (`working-methods`, `forge-methodology`, `design-review`, `token-economy`),
el skill la reutiliza donde encaja: `/forge-run` como columna de construcción, `design-review`
disparado por el hook `ui-diff-design-review`, el output-style frugal y los helpers de
context-pack de `token-economy`. Sin la familia → el pipeline corre completo igualmente, y
instalarla es como mucho un ítem opcional más del multi-check.

Instalación:

```bash
/plugin marketplace add davidgarciagordo/claude-code-setup-optimizer
/plugin install automations@claude-code-setup-optimizer
```

---
<sub>Parte de [claude-code-setup-optimizer](../../README.es.md) · Hecho por
[David García Gordo](https://github.com/davidgarciagordo) · MIT</sub>
