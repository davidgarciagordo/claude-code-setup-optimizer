# claude-code-setup-optimizer

Marketplace de plugins para **optimizar tu forma de trabajar con Claude Code** en cualquier repo. Junta la metodología cross-project + automatizaciones reales (hooks, subagents, comandos) + una skill que analiza tu repo y **te deja elegir qué aplicar**. Fuente única, instalable una vez — sin copiar config repo a repo.

## Instalar
```bash
/plugin marketplace add davidgarciagordo/claude-code-setup-optimizer
/plugin install working-methods@claude-code-setup-optimizer
/plugin install automations@claude-code-setup-optimizer
/plugin install forge-methodology@claude-code-setup-optimizer
/plugin install design-review@claude-code-setup-optimizer
```

## Empezar
```
/optimize-my-setup
```
Analiza el repo (git, CLAUDE.md, .claude/, stack), recomienda 1–2 automatizaciones por categoría y **termina con un multi-check: tú marcas qué aplicar** (puede ser nada). Solo aplica lo elegido. El usuario siempre decide.

## Plugins
| Plugin | Origen | Contenido |
|--------|--------|-----------|
| `working-methods` | local | `caveman` (comms low-cost) · `/grill` (adversarial ×3: arquitecto · operador · ingeniero) · `/handoff` (relevo de sesión). Routing por modelo integrado. |
| `automations` | local | **Hooks:** `format-on-edit` (prettier/biome al editar), `guard-append-only` (bloquea editar migraciones/auditoría ya commiteadas). **Subagents:** `messagebus-reviewer`, `i18n-reviewer`. **Command:** `/release` (PR dev→main con notas). **Skill:** `optimize-my-setup`. **Templates:** allow-list de permisos + bloque de rules para CLAUDE.md. |
| `forge-methodology` | github externo | Loop Forja: align → spec → grill×3 → plan global → ejecución → verify vs DoD → sign-off. |
| `design-review` | github externo | Diseño/rediseño/auditoría integral (jerarquía, IA, a11y, tokens, motion). |

## Normas always-on
Estilo/testing/seguridad/orquestación son guía **permanente**, no skills on-demand → no las inyecta un plugin. Referéncialas en el `CLAUDE.md` de cada repo: usa `plugins/automations/templates/claude-md-rules-reference.md`.

## Estructura
```
.claude-plugin/marketplace.json          # 4 plugins (2 locales + 2 github externos)
plugins/working-methods/  ·  plugins/automations/
```
Validar: `claude plugin validate . --strict`.
