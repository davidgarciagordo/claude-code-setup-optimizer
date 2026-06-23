<!--
PLANTILLA: cómo referenciar las normas always-on desde el CLAUDE.md de un repo.

Las normas always-on (estilo, testing, seguridad, orquestación por modelo) son guía
PERMANENTE, no skills on-demand. Un plugin no las inyecta al system prompt; el sitio
correcto es el CLAUDE.md del repo (o el global ~/.claude/CLAUDE.md), que SÍ es always-on.

Pega el bloque de abajo en tu CLAUDE.md y ajusta las rutas. Single-source: apunta, no copies.
-->

## Cómo trabajamos (normas always-on)

Este repo sigue las normas de trabajo cross-project. Fuente única, no duplicar:

- **Estilo, testing, seguridad, performance:** `~/.claude/rules/common/*` (instaladas por cuenta) — inmutabilidad, ficheros pequeños, 80% cobertura, nada de secretos en git, validación en boundaries.
- **Orquestación y modelos:** Opus dirige/decide/revisa lo crítico · Sonnet ejecuta planes cerrados · Haiku lo trivial. Áreas disjuntas entre agentes paralelos; context-pack con `fichero:línea` entre fases.
- **Metodología y comandos:** instala el marketplace `claude-code-setup-optimizer`
  (`/plugin marketplace add davidgarciagordo/claude-code-setup-optimizer`) → Forja, `/grill`, `/handoff`, caveman.
- **Flujo git:** rama de feature → PR contra la rama de integración; merge en verde (review antes de merge); nunca commit directo a producción.
