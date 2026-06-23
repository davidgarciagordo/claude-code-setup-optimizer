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

```
/optimize-my-setup
```
Analiza tu repo (git, CLAUDE.md, `.claude/`, stack), recomienda 1–2 automatizaciones por categoría, y **termina con un multi-check: tú marcas qué aplicar** (puede ser nada). Solo aplica lo elegido. **El usuario siempre decide.** Agnóstico de lenguaje — JS/TS, Python, PHP, Go, Rust, Ruby.

## 📚 Ejemplos

Uso copy-paste de cada plugin, comando, hook y subagent → [examples/](examples/README.es.md).

## 🧩 Plugins

| Plugin | Origen | Contenido |
|--------|--------|-----------|
| 🧠 `working-methods` | local | `caveman` (comms low-cost) · `/grill` (adversarial ×3: arquitecto · operador · ingeniero) · `/handoff` (relevo de sesión). Routing por modelo integrado. |
| ⚡ `automations` | local | **Hook:** `guard-append-only` (bloquea editar migraciones/auditoría commiteadas — disciplina append-only). **Subagents:** `messagebus-reviewer`, `i18n-reviewer`. **Comando:** `/release`. **Skill:** `optimize-my-setup`. **Templates:** allow-list de permisos + bloque de rules para CLAUDE.md. |
| 🔨 `forge-methodology` | github | Loop Forja: alinear → spec → grill ×3 → plan global → ejecución → verify vs DoD → sign-off. |
| 🎨 `design-review` | github | Pipeline de diseño/rediseño/auditoría (jerarquía, IA, a11y, tokens, motion). |

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
