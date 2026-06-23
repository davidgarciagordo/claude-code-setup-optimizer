# david-methodology — Claude Code marketplace

Marketplace de plugins con la **metodología de trabajo cross-project de David**. Fuente única, instalable una vez, reproducible en cualquier repo/Mac/cuenta/cloud-agent. Evita copiar metodología repo a repo (anti doble-fuente-de-verdad).

## Instalar
```bash
/plugin marketplace add davidgarciagordo/claude-methodology
/plugin install forge-methodology@david-methodology
/plugin install design-review@david-methodology
/plugin install working-methods@david-methodology
```

## Plugins
| Plugin | Origen | Qué aporta |
|--------|--------|------------|
| `forge-methodology` | repo externo `davidgarciagordo/forge-methodology` | Loop Forja: align → spec → grill×3 → plan global → ejecución → verify vs DoD → sign-off. |
| `design-review` | repo externo `davidgarciagordo/design-review` | Diseño/rediseño/auditoría integral (jerarquía, IA, a11y, tokens, motion). |
| `working-methods` | local (`./plugins/working-methods`) | `caveman` (comms low-cost) + `/grill` (adversarial ×3) + `/handoff` (relevo de sesión). Routing por modelo (Opus dirige/revisa · Sonnet ejecuta · Haiku trivial) integrado en los commands. |

## Estructura
```
.claude-plugin/marketplace.json     # lista los 3 plugins (2 externos github + 1 local)
plugins/working-methods/
  .claude-plugin/plugin.json
  skills/caveman/SKILL.md
  commands/grill.md
  commands/handoff.md
```

## Pendiente / decisión abierta
Las **normas always-on** de `~/.claude/rules/common/*` (coding-style, testing, security, orchestration-and-tokens) son guía permanente, no skills on-demand → un plugin no las inyecta al system prompt como hace `~/.claude/rules`. Opciones: (a) dejarlas como rules globales por-Mac, (b) que cada repo las referencie en su `CLAUDE.md`, (c) shippear las que tengan sentido on-demand como skills aquí. Sin resolver hasta decidir con David.
