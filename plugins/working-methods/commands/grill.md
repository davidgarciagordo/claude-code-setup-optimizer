---
description: Grilla adversarial ×3 de un spec/diseño/plan, con 3 lentes fijas. Un supuesto no verificado contra el repo es un hallazgo.
argument-hint: [ruta al spec/plan, o describe qué grillar]
---

# Grill ×3 (adversarial)

Ataca el artefacto ($ARGUMENTS) con **tres lentes SIEMPRE**, en paralelo (un agente por lente, áreas disjuntas). Cada lente devuelve un acta de hallazgos. El orquestador (Opus) arbitra los conflictos y produce la versión siguiente del spec.

## Las 3 lentes (no negociables)
1. **Arquitecto de la plataforma** — reglas, bounded contexts, precedentes del repo. **Verifica cada supuesto contra el código real citando `fichero:línea`.** ¿Rompe una invariante? ¿Crea acoplamiento cruzado? ¿Hay ya un precedente que contradice el diseño?
2. **Operador / usuario real** — el día a día en el mostrador con mala idea y prisa. "El producto se gana en el mostrador, no en la base de datos." Casos límite de uso, flujos rotos, fricción, lo que el usuario hará MAL.
3. **Ingeniero del dominio técnico** — concurrencia, idempotencia, edge cases, fallos parciales, lo que rompe en producción bajo carga o datos sucios.

## Reglas
- **Un supuesto no verificado contra el repo = hallazgo.** No aceptes "se asume que…": ve a comprobarlo.
- Los grillers citan `fichero:línea` cuando verifican.
- Tras los fixes: **re-grill ×3** — verifica que los fixes aguantan + ataca las costuras NUEVAS que los fixes crean.
- Modelo: lentes en agentes (Sonnet para barrido, Opus para arbitrar). Lo que decide el resultado → Opus.

## Salida
Tres actas + síntesis arbitrada + lista de decisiones que requieren input del owner (márcalas claramente).
