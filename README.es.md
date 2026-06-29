[English](README.md) | **Español**

# 🛠️ claude-code-setup-optimizer

[![Claude Code plugin](https://img.shields.io/badge/Claude_Code-marketplace-D97757)](https://github.com/davidgarciagordo/claude-code-setup-optimizer) [![skills.sh](https://img.shields.io/badge/skills.sh-skill-111111)](https://skills.sh) ![License MIT](https://img.shields.io/badge/license-MIT-2da44e) ![Version](https://img.shields.io/badge/version-0.1.0-blue)

> El hub que optimiza tu forma de trabajar con Claude Code en cualquier repo — metodología + automatizaciones reales + una skill que analiza tu repo y **te deja elegir qué aplicar**.

### 🧩 La familia — misma firma, tres repos

| | Repo | Rol |
|---|---|---|
| 🛠️ | [**claude-code-setup-optimizer**](https://github.com/davidgarciagordo/claude-code-setup-optimizer) · *estás aquí* | **El hub** — empaqueta todo lo de abajo + automatizaciones (hooks · subagents · comandos) + `/optimize-my-setup` |
| 🔨 | [**forge-methodology**](https://github.com/davidgarciagordo/forge-methodology) | Estructura *qué construir* — alinear → spec → grill ×3 → plan → verificar |
| 🎨 | [**design-review**](https://github.com/davidgarciagordo/design-review) | Pule *cómo se ve* — estructura → auditoría → anti-slop → a11y → check en vivo |

## 📦 Instalación

```bash
# 🛠️ Añade el marketplace hub (trae los cuatro plugins)
/plugin marketplace add davidgarciagordo/claude-code-setup-optimizer

/plugin install working-methods@claude-code-setup-optimizer
/plugin install automations@claude-code-setup-optimizer
/plugin install forge-methodology@claude-code-setup-optimizer
/plugin install design-review@claude-code-setup-optimizer
```
Cada plugin se instala también suelto (forge/design-review son su propio marketplace).

## 🚀 Empieza aquí

El hub tiene una **columna vertebral** — un único entrypoint que *secuencia y enforda* la metodología, para que el orden no viva en un prompt copy-paste que tengas que recordar.

**1. Prepara el taller (una vez):**
```
/install-family        # verifica/instala los 4 plugins como unidad
/optimize-my-setup     # ajusta la config .claude de ESTE repo — tú eliges qué aplicar
```

**2. Construye con la columna (cada tarea sustancial):**
```
/forge-run <tu tarea>
```
`/forge-run` corre el loop entero **en orden CODIFICADO con gates checkeados por máquina**:

```
align → reference-decomposition → spec (+ Acceptance Matrix)
      → /grill ×3 + completitud → plan global (sign-off del dueño)
      → ejecución (worktrees + context pack compartido)
      → verify (reviewers + completeness-critic + design-review en diffs de UI)
      → /handoff
```

El orden vive en `plugins/working-methods/workflows/forge.js` (fuente única), no en prosa. Cada fase **invoca** el command/skill/agente real — *aplica* `forge-methodology` y `design-review`, no solo recomienda instalarlos. Un PR no sale hasta que el spec, el acta de grill, la Acceptance Matrix y el plan estén versionados en `docs/forge/<slug>/` — lo enforda el hook `guard-forge-artifacts`. **El usuario siempre decide** (gates de plan + grill).

> `/optimize-my-setup` es **setup del repo** (una vez), no un paso de construir una feature. Agnóstico de lenguaje — JS/TS, Python, PHP, Go, Rust, Ruby.

## 📚 Ejemplos

Uso copy-paste de cada plugin, comando, hook y subagent → [examples/](examples/README.es.md).

## 🧩 Plugins

| Plugin | Origen | Contenido |
|--------|--------|-----------|
| 🧠 `working-methods` | local | `/grill` (adversarial ×3: arquitecto · operador · ingeniero) · `/handoff` (relevo de sesión) · `forge-on-claude` (mapea Forge a herramientas de Claude Code: ultrathink, ultracode/Workflow, worktrees, subagents, context pack). Routing por modelo integrado. *(comms low-cost → usa el original [caveman](https://github.com/JuliusBrussee/caveman))* |
| ⚡ `automations` | local | **Skill `optimize-my-setup`** — optimiza TODA la config `.claude` de un repo a su medida: `CLAUDE.md`, `settings.json` (permisos/hooks/env), skills, **agents generados por invariante detectado**, `workflows/*.js`, `.mcp.json`, `output-styles` — reutilizando tus plugins donde encajan. Además: hook genérico `guard-append-only`, `/release`, y **templates** (allow-list de permisos, bloque de rules para CLAUDE.md, templates de reviewers de dominio). |
| 🔨 `forge-methodology` | github | Loop Forja: alinear → spec → grill ×3 → plan global → ejecución → verify vs DoD → sign-off. |
| 🎨 `design-review` | github | Pipeline de diseño/rediseño/auditoría (jerarquía, IA, a11y, tokens, motion). |

## 🙏 Créditos — referencia, no copia

Este marketplace **referencia y organiza** buen trabajo; no vendoriza copias, así todo se mantiene al día en su origen y el crédito queda en sus autores.

- **forge-methodology**, **design-review** — de [David García Gordo](https://github.com/davidgarciagordo) (esta familia).
- **caveman** (comms low-cost) — de [JuliusBrussee](https://github.com/JuliusBrussee/caveman). Instala el original: `/plugin marketplace add JuliusBrussee/caveman`.
- El **pipeline de design-review** orquesta skills de sus autores originales — `impeccable`, `taste-skill`, `emil-design-eng`, `ui-ux-pro-max`, `huashu-design`, `web-accessibility`, `seo` — instaladas desde su fuente vía el preflight (ver *Attribution* de design-review). Nada bundleado; cada una se actualiza en su origen.

## 📌 Normas always-on

Estilo/testing/seguridad/orquestación son guía **permanente**, no skills on-demand → un plugin no las inyecta en el system prompt. Referéncialas desde el `CLAUDE.md` de cada repo con `plugins/automations/templates/claude-md-rules-reference.md`.

## 🗂️ Estructura
```
.claude-plugin/marketplace.json          # 4 plugins (2 locales + 2 github)
plugins/working-methods/  ·  plugins/automations/
```
Valida: `claude plugin validate . --strict`.

---
<sub>Hecho por [David García Gordo](https://github.com/davidgarciagordo) · MIT</sub>
