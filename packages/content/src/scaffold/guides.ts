import { createClinicalMetadata, M1_CLINICAL_SOURCES } from '../disclaimers';
import type { GuideScaffoldItem } from '../schema';

export const M1_GUIDE_SCAFFOLDS: readonly GuideScaffoldItem[] = [
  {
    id: 'm1-fiebre-orientacion',
    stage: '0-3m',
    titleMx: 'Temperatura y señales de alerta en recién nacidos',
    summaryMx:
      'En menores de 3 meses, una temperatura axilar de 38.0 °C o mayor requiere valoración médica urgente inmediata. Esta guía es orientativa y no sustituye la revisión del pediatra.',
    severity: 'urgent_red',
    redFlagsMx: [
      'Temperatura axilar >= 38.0 °C en bebé menor de 3 meses: llama al 911 o acude a urgencias de inmediato.',
      'Respiración rápida, hundimiento de costillas o coloración azulada en labios: llama al 911.',
      'Dificultad para despertar, rechazo total del pecho o mamila, o llanto inconsolable: consulta urgente o 911.',
    ],
    metadata: createClinicalMetadata({
      sources: [
        M1_CLINICAL_SOURCES.cenetecFever,
        M1_CLINICAL_SOURCES.whoChildCare,
      ],
    }),
  },
  {
    id: 'm1-rozadura-panal',
    stage: '3-12m',
    titleMx: 'Cuidado cotidiano ante rozadura del pañal',
    summaryMx:
      'Cambia el pañal con frecuencia, limpia suavemente con agua tibia y deja secar la piel al aire unos minutos antes de poner un pañalero limpio.',
    severity: 'caution',
    redFlagsMx: [
      'Consulta a tu pediatra si aparecen ampollas, pus, sangrado o si la rozadura no mejora tras 48 a 72 horas.',
      'Si se acompaña de fiebre >= 38.0 °C o decaimiento, busca valoración médica oportuna.',
    ],
    metadata: createClinicalMetadata({
      sources: [M1_CLINICAL_SOURCES.nom031, M1_CLINICAL_SOURCES.whoChildCare],
    }),
  },
  {
    id: 'm1-hidratacion-mamila',
    stage: '1-3a',
    titleMx: 'Hidratación diaria en ml y transición de mamila',
    summaryMx:
      'Ofrece agua natural en pequeños sorbos durante el día (referencia orientativa en ml según edad y apetito) y acompaña el paso gradual del biberón o mamila al vaso entrenador.',
    severity: 'normal',
    redFlagsMx: [
      'Pañal seco por más de 6 a 8 horas, boca muy seca o llanto sin lágrimas: acude con tu pediatra o a urgencias.',
    ],
    metadata: createClinicalMetadata({
      sources: [M1_CLINICAL_SOURCES.nom031, M1_CLINICAL_SOURCES.whoChildCare],
    }),
  },
] as const;
