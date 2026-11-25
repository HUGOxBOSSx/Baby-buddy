import { createClinicalMetadata, M1_CLINICAL_SOURCES } from '../disclaimers';
import type { ClothingOrientationScaffold } from '../schema';

export const CLOTHING_ENGINE_METADATA = createClinicalMetadata({
  sources: [
    M1_CLINICAL_SOURCES.aapSafeSleep,
    M1_CLINICAL_SOURCES.nom031,
    M1_CLINICAL_SOURCES.whoChildCare,
  ],
});

export const M1_CLOTHING_SCAFFOLDS: readonly ClothingOrientationScaffold[] = [
  {
    id: 'm1-clima-templado-0-3m',
    stage: '0-3m',
    ambientTempRangeC: '20 °C a 23 °C',
    garmentsMx: [
      'Pañalero de algodón manga corta',
      'Mameluco ligero de algodón',
    ],
    guidanceMx:
      'Verifica la temperatura tocando la nuca o el pecho del bebé (manos y pies suelen sentirse más frescos sin indicar frío) y evita abrigarlo en exceso.',
    metadata: createClinicalMetadata({
      sources: [M1_CLINICAL_SOURCES.aapSafeSleep, M1_CLINICAL_SOURCES.nom031],
    }),
  },
  {
    id: 'm1-clima-fresco-3-12m',
    stage: '3-12m',
    ambientTempRangeC: '16 °C a 19 °C',
    garmentsMx: [
      'Pañalero manga larga de algodón',
      'Mameluco afelpado ligero',
      'Calcetines cómodos',
    ],
    guidanceMx:
      'Para dormir en cuna, evita cobijas sueltas o almohadas; prefiere prendas ajustadas y seguras acordes a los °C de la habitación.',
    metadata: createClinicalMetadata({
      sources: [M1_CLINICAL_SOURCES.aapSafeSleep, M1_CLINICAL_SOURCES.nom031],
    }),
  },
  {
    id: 'm1-clima-calido-1-3a',
    stage: '1-3a',
    ambientTempRangeC: '24 °C a 28 °C',
    garmentsMx: [
      'Playera o pañalero transpirable de algodón',
      'Pantalón corto ligero',
    ],
    guidanceMx:
      'Mantén el espacio ventilado, ofrece agua natural en ml con frecuencia y consulta al pediatra ante signos de agotamiento por calor.',
    metadata: createClinicalMetadata({
      sources: [M1_CLINICAL_SOURCES.nom031, M1_CLINICAL_SOURCES.whoChildCare],
    }),
  },
] as const;
