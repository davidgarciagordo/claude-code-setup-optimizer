---
description: Grilla adversarial ×3 de un spec/diseño/plan, con 3 lentes fijas. Un supuesto no verificado contra el repo es un hallazgo.
argument-hint: [ruta al spec/plan, o describe qué grillar]
---

# Grill ×3 (adversarial)

Ataca el artefacto ($ARGUMENTS) con **tres lentes SIEMPRE**, en paralelo (un agente por lente, áreas disjuntas). Cada lente devuelve un acta de hallazgos. El orquestador (Opus) arbitra los conflictos y produce la versión siguiente del spec.

El grill corre **automático**, pero la convergencia automática esconde los momentos donde un juicio humano cambia el resultado. Dos gates los hacen explícitos sin frenar la máquina:

```
A. Gate de entrada   → dudas de alto impacto, ancladas en código + brief, en UNA tanda multi-select.
B. Grill ×3          → las tres lentes corren automáticas. Sin interrumpir al owner.
C. Gate al usuario   → las dudas que surgen, cada una con tu recomendada + alternativas,
                       para que el owner acepte / cambie / añada / discrepe — en UNA tanda multi-select.
D. Re-grill informado → una pasada automática más con las decisiones del owner. Luego, conclusiones.
```

### A. Gate de entrada (antes de las lentes)
Lee el artefacto y el repo primero. **Lo que puedas verificar leyendo el código, NO lo preguntes.** Presenta las decisiones de alto impacto que SOLO el owner puede resolver como UNA tanda `AskUserQuestion`: cada pregunta con 2–4 respuestas candidatas, la tuya recomendada primero y marcada "(recomendada)", y el campo "Other" para que añada la suya. Solo lo que cambia la dirección del grill — un puñado, una tanda, no un interrogatorio.

## Las 3 lentes (no negociables)
1. **Arquitecto de la plataforma** — reglas, bounded contexts, precedentes del repo. **Verifica cada supuesto contra el código real citando `fichero:línea`.** ¿Rompe una invariante? ¿Crea acoplamiento cruzado? ¿Hay ya un precedente que contradice el diseño?
2. **Operador / usuario real** — el día a día en el mostrador con mala idea y prisa. "El producto se gana en el mostrador, no en la base de datos." Casos límite de uso, flujos rotos, fricción, lo que el usuario hará MAL.
3. **Ingeniero del dominio técnico** — concurrencia, idempotencia, edge cases, fallos parciales, lo que rompe en producción bajo carga o datos sucios.

## Reglas
- **Un supuesto no verificado contra el repo = hallazgo.** No aceptes "se asume que…": ve a comprobarlo.
- Los grillers citan `fichero:línea` cuando verifican.
- Modelo: lentes en agentes (Sonnet para barrido, Opus para arbitrar). Lo que decide el resultado → Opus.

## C. Gate al usuario (tras las 3 actas, ANTES de las conclusiones)
No resuelvas en silencio las dudas que surgen. Para cada duda / contradicción / supuesto sin verificar, calcula tu **respuesta recomendada + las alternativas vivas**, y preséntalas como UNA tanda multi-select:
- Cada ítem: la duda en cristiano + tu recomendada (premarcada) + las alternativas + la(s) lente(s) que la levantó.
- El owner puede **aceptar**, **elegir otra**, **añadir la suya**, o **discrepar** (rechazar + nota).
- Agrupa por severidad (blocking → significant → minor) para que sea escaneable; premarca las recomendadas.
- `AskUserQuestion` con `multiSelect: true` (≤4 preguntas/llamada, 2–4 opciones; su "Other" = añade-la-tuya / discrepa). Si quedan más dudas, varias tandas, las más críticas primero, y di cuántas quedan.
- **Lo corre el orquestador, NUNCA un subagente griller** — los subagentes no pueden preguntar al owner. Las lentes producen hallazgos + recomendadas; el orquestador las presenta y recoge las decisiones.

## D. Re-grill informado
Mete las decisiones del owner y corre **una pasada automática más**, enfocada en: las costuras que abren las respuestas elegidas + lo que el owner discrepó o añadió y las lentes no consideraron. Repite el gate solo si el re-grill levanta dudas blocking genuinamente nuevas — no marees al owner con lo ya cerrado.

## Salida
Tres actas + síntesis arbitrada + el **gate al usuario resuelto** (decisiones del owner registradas) + la versión siguiente del spec.
