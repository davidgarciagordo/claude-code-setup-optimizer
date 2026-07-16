[English](README.md) | **Español**

# working-methods — la capa de enforcement de Forge en Claude Code

Este plugin es la **capa de enforcement de la metodología Forge en Claude Code**: el orden de
fases vive en código ([`workflows/forge.js`](workflows/forge.js)), los gates se comprueban a
máquina (`gate`/`advance` rechazan con exit 2 si falta un artefacto), y un hook PreToolUse
**bloquea `gh pr create`/`ready`/`merge`** hasta que los artefactos del run están versionados.
No es una checklist en prosa que un agente tenga que recordar — saltarse una fase es un comando
que falla, no un párrafo olvidado.

## Quickstart

```
/install-family          # una vez por máquina: instala/verifica la familia de 5 plugins
/forge-run <tarea>       # el entrypoint: conduce las 12 fases de abajo, con gates
```

`/forge-run` lo conduce todo a través del conductor determinista. Mira la columna tú mismo
(output real de `node workflows/forge.js phases`, extracto):

```
Forge run spine — codified order (gates are machine-checked):

  1. align  —  Align intent + brainstorm
       invokes : superpowers:brainstorming if installed (NOT a declared dep) — fallback: native guided brainstorm (value question first + explicit options, one batch)
       produces: intent.md
  2. reference-decomposition  —  Reference decomposition (req-ids)
       invokes : forge-methodology:reference-decomposer → enumerated Reference Standard
       gate-in : needs intent.md
       produces: references.md
  ...
  12. handoff  —  Handoff (owner sign-off recorded)
       invokes : /handoff
       gate-in : needs verify.md
       produces: handoff.md

  Pre-PR / pre-merge gate: spec.md, acceptance-matrix.md, grill-verdicts.md, decisions-1.md,
  regrill-verdicts.md, decisions-2.md, plan.md must exist & be non-empty.
```

Cuándo correrlo: el discriminador es **diseño vs ejecución**, no el número de ficheros.
Feature/producto/integración nueva, decisión de arquitectura o seguridad, un contrato de
comportamiento del que otros dependen → `/forge-run`. Ejecutar algo ya decidido (bug fix,
barrido mecánico, aplicar un plan escrito) → trabaja directo.

## La columna — 12 fases, cada una con gate por artefactos

Generado desde `node workflows/forge.js phases` (ese comando es la fuente única de verdad; si
esta tabla y el script discrepan, gana el script):

| # | Fase | Necesita (gate-in) | Produce |
|---|------|--------------------|---------|
| 1 | `align` — intención + brainstorm | — | `intent.md` |
| 2 | `reference-decomposition` — req-ids | `intent.md` | `references.md` |
| 3 | `draft` — borrador concreto, barato de cambiar | `references.md` | `draft.md` |
| 4 | `grill` — ×3 + lente de completitud SOBRE EL BORRADOR | `draft.md` | `grill-verdicts.md` |
| 5 | `checkpoint-1` — tanda del owner #1 | `grill-verdicts.md` | `decisions-1.md` |
| 6 | `spec` — spec versionado + Acceptance Matrix | `decisions-1.md` | `spec.md`, `acceptance-matrix.md` |
| 7 | `regrill` — ×2 enfocado en el SPEC | `spec.md`, `acceptance-matrix.md` | `regrill-verdicts.md` |
| 8 | `checkpoint-2` — tanda del owner #2, spec bloqueado | `regrill-verdicts.md` | `decisions-2.md` |
| 9 | `plan` — plan global + propuesta de ejecución | `decisions-2.md` | `plan.md`, `execution-proposal.md` |
| 10 | `execute` — worktrees + UN context pack compartido | `spec.md`, `acceptance-matrix.md`, `plan.md`, `execution-proposal.md` | `context-pack.md` |
| 11 | `verify` — audita la MATRIZ, no el diff | `acceptance-matrix.md`, `plan.md` | `verify.md` |
| 12 | `handoff` — sign-off del owner registrado | `verify.md` | `handoff.md` |

Todos los artefactos se versionan bajo `docs/forge/<slug>/`. Al owner se le interrumpe
**exactamente dos veces** (checkpoints 5 y 8), cada una UNA tanda multi-select con las
recomendaciones premarcadas. Gate pre-PR: `spec.md`, `acceptance-matrix.md`,
`grill-verdicts.md`, `decisions-1.md`, `regrill-verdicts.md`, `decisions-2.md`, `plan.md`
deben existir y no estar vacíos.

## Componentes

| Componente | Ruta | Qué hace |
|---|---|---|
| `/forge-run` | [`commands/forge-run.md`](commands/forge-run.md) | EL entrypoint — conduce las 12 fases vía forge.js |
| `/grill` | [`commands/grill.md`](commands/grill.md) | Ataque adversarial ×3(+1) a un artefacto — también standalone |
| `/handoff` | [`commands/handoff.md`](commands/handoff.md) | Relevo de sesión (vivo o autónomo) — también standalone |
| `/install-family` | [`commands/install-family.md`](commands/install-family.md) | Bootstrap de la familia de 5 plugins, una vez por máquina |
| `forge-on-claude` | [`skills/forge-on-claude/SKILL.md`](skills/forge-on-claude/SKILL.md) | Mapea cada concepto neutral de Forge a la herramienta concreta de Claude Code |
| `grill-architect` / `grill-operator` / `grill-engineer` | [`agents/`](agents/) | Las 3 lentes read-only del grill (salida terse, context pack compartido) |
| `forge.js` | [`workflows/forge.js`](workflows/forge.js) | Máquina de estados, cero deps: `phases · init · status · gate · advance · check-pr · complete` |
| `grill-context.mjs` | [`workflows/grill-context.mjs`](workflows/grill-context.mjs) | Ensamblador determinista del context-pack para las lentes |
| `guard-forge-artifacts` | [`hooks/guard-forge-artifacts.py`](hooks/guard-forge-artifacts.py) | Hook PreToolUse(Bash): gatea los comandos de PR tras `forge.js check-pr` (fail-closed) |
| executor-eye check | [`references/executor-eye-check.md`](references/executor-eye-check.md) | Relee instrucciones como el agente que las va a ejecutar (4 checks) |

La 4ª lente del grill, `completeness-critic`, **no viene en este plugin** — la trae la
dependencia obligatoria `forge-methodology` y se invoca como
`forge-methodology:completeness-critic`.

## Dependencias — qué se degrada sin cada una

| Plugin | Estado | Para qué | Sin él |
|---|---|---|---|
| `forge-methodology` | **obligatoria** (declarada) | El loop neutral que mapea `forge-on-claude`; los agentes `completeness-critic`, `reference-decomposer` e `independent-verifier`; plantillas de spec; `grill-me` | Las fases 2, 4 (4ª lente) y 11 pierden sus agentes; las referencias de `forge-on-claude` quedan colgando. No lo corras sin ella |
| `design-review` | **obligatoria** (declarada) | La fase verify la dispara sobre cualquier diff de UI | Los cambios de UI se quedan sin pipeline de diseño en verify — calidad visual sin verificar |
| `superpowers` | **opcional** (externo, [obra/superpowers](https://github.com/obra/superpowers) — deliberadamente NO declarada para que las instalaciones nunca rompan por un catálogo de terceros ausente) | `align` invoca `superpowers:brainstorming`; `plan` invoca `superpowers:writing-plans` — cuando está | Fallback explícito (codificado en la tabla de fases de forge.js): brainstorm guiado nativo / `plan.md` versionado a pelo. El run funciona, esas dos fases van más magras |
| `token-economy` | recomendada | Las normas de context-pack + salida frugal que siguen los agentes del grill | Todo corre; las lentes simplemente cuestan más tokens |

## `/grill` y `/handoff` valen standalone

No necesitas un run de Forge para usarlos:

- **`/grill <artefacto>`** ataca cualquier spec/plan/diseño con 3 lentes adversariales
  (+completitud cuando hay Acceptance Matrix), criterio binario de hallazgo y un gate al owner
  en tanda. No lo confundas con **`forge-methodology:grill-me`**: `/grill` ataca **un
  artefacto** (agentes read-only cazan lo que rompe, citando `fichero:línea`); `grill-me` te
  entrevista **a ti, el humano**, sobre un plan hasta resolver cada rama del árbol de
  decisiones. Uno grilla el documento; el otro, a su autor.
- **`/handoff`** cierra la sesión con un relevo versionado (trabajos en vuelo, prompt de
  resume, guía de scheduler durable para modo autónomo) — útil tras CUALQUIER sesión larga.

## Limitaciones conocidas (lista honesta)

- **El gate de PR solo ve lo que pasa por la tool Bash de Claude Code.** Crear el PR desde la
  web de GitHub, pushear desde otra terminal, o cualquier flujo fuera de Claude lo bypassea.
  Es un guardarraíl para el agente, no una branch protection de servidor.
- **`FORGE_ENFORCE=off` desactiva el hook** (y `warn` lo deja en aviso). Es a propósito — el
  owner siempre puede anular — pero significa que el enforcement es opt-out, no absoluto.
- **El hook arranca `python3` en cada llamada a la tool Bash** (sale al instante cuando el
  comando no es `gh pr create/ready/merge`, pero el arranque del intérprete se paga cada vez).
- Un run activo por repo: `forge.js init` rechaza mientras otro `docs/forge/*/run.json` esté
  `active` (se anula con `FORGE_RUN_MANIFEST`).
- Los gates comprueban que los artefactos **existen y no están vacíos** — no pueden juzgar la
  calidad del contenido. Para eso están las lentes del grill y los checkpoints del owner.
