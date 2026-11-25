import type { StageId } from '@baby-buddy/core';
import { createClinicalMetadata, M1_CLINICAL_SOURCES } from '../disclaimers';
import type { StageOverviewScaffold } from '../schema';

export const STAGE_OVERVIEWS: Record<StageId, StageOverviewScaffold> = {
  '0-3m': {
    stage: '0-3m',
    headlineMx: 'Recién nacido (0 a 3 meses)',
    orientationPointsMx: [
      'Vigila la temperatura axilar en °C (rango habitual de 36.5 °C a 37.5 °C) sin abrigar de más.',
      'Viste al bebé con pañalero y mameluco de algodón adecuados al clima de la habitación.',
      'Registra tomas de leche materna o mamila en ml y acude a revisión con tu pediatra; ante fiebre >= 38.0 °C llama al 911 o acude a urgencias.',
    ],
    sampleMetric: { value: 36.8, unit: '°C' },
    metadata: createClinicalMetadata({
      sources: [
        M1_CLINICAL_SOURCES.nom031,
        M1_CLINICAL_SOURCES.aapSafeSleep,
        M1_CLINICAL_SOURCES.cenetecFever,
      ],
    }),
  },
  '3-12m': {
    stage: '3-12m',
    headlineMx: 'Lactante (3 a 12 meses)',
    orientationPointsMx: [
      'Mantén sueño seguro boca arriba en cuna despejada y observa señales de hambre en tomas de pecho o biberón / mamila.',
      'Previene la rozadura del pañal con cambios frecuentes, limpieza suave y piel seca.',
      'Lleva el control de peso en kg y talla en cm en cada consulta con tu pediatra.',
    ],
    sampleMetric: { value: 150, unit: 'ml' },
    metadata: createClinicalMetadata({
      sources: [M1_CLINICAL_SOURCES.nom031, M1_CLINICAL_SOURCES.aapSafeSleep],
    }),
  },
  '1-3a': {
    stage: '1-3a',
    headlineMx: 'Primera infancia (1 a 3 años)',
    orientationPointsMx: [
      'Fomenta hidratación constante en ml a lo largo del día y transición gradual fuera de la mamila.',
      'Elige ropa ligera por capas en °C cálidos para facilitar el movimiento y evitar exceso de calor.',
      'Ante decaimiento marcado, dificultad para respirar o fiebre persistente, consulta al pediatra o llama al 911.',
    ],
    sampleMetric: { value: 85, unit: 'cm' },
    metadata: createClinicalMetadata({
      sources: [M1_CLINICAL_SOURCES.nom031, M1_CLINICAL_SOURCES.whoChildCare],
    }),
  },
  '3-6a': {
    stage: '3-6a',
    headlineMx: 'Preescolar (3 a 6 años)',
    orientationPointsMx: [
      'Consolida rutinas estables de descanso nocturno, lavado de manos y alimentación equilibrada.',
      'Da seguimiento periódico al crecimiento en kg y cm junto con tu pediatra.',
      'Ten siempre a la mano señales claras de alerta roja para llamar al 911 sin demora.',
    ],
    sampleMetric: { value: 16.5, unit: 'kg' },
    metadata: createClinicalMetadata({
      sources: [M1_CLINICAL_SOURCES.nom031, M1_CLINICAL_SOURCES.whoChildCare],
    }),
  },
};
