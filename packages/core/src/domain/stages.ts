export type StageId = '0-3m' | '3-12m' | '1-3a' | '3-6a';

export const MIN_AGE_MONTHS = 0;
export const MAX_AGE_MONTHS = 72;

export interface ChildStageSpec {
  readonly id: StageId;
  readonly label: string;
  readonly shortLabel: string;
  readonly minMonths: number;
  readonly maxMonthsExclusive: number;
  readonly focusSummaryMx: string;
}

export const STAGE_ORDER: readonly StageId[] = [
  '0-3m',
  '3-12m',
  '1-3a',
  '3-6a',
] as const;

export const STAGE_SPECS: Record<StageId, ChildStageSpec> = {
  '0-3m': {
    id: '0-3m',
    label: '0 a 3 meses',
    shortLabel: '0–3m',
    minMonths: 0,
    maxMonthsExclusive: 3,
    focusSummaryMx:
      'Recién nacido: control de temperatura en °C, tomas de leche materna o mamila en ml, pañalero y señales tempranas de alerta.',
  },
  '3-12m': {
    id: '3-12m',
    label: '3 a 12 meses',
    shortLabel: '3–12m',
    minMonths: 3,
    maxMonthsExclusive: 12,
    focusSummaryMx:
      'Lactante: descanso seguro, inicio gradual de alimentación complementaria, prevención de rozadura y seguimiento pediátrico.',
  },
  '1-3a': {
    id: '1-3a',
    label: '1 a 3 años',
    shortLabel: '1–3a',
    minMonths: 12,
    maxMonthsExclusive: 36,
    focusSummaryMx:
      'Primera infancia: hidratación, rutinas nocturnas, ropa cómoda por capas y orientación ante fiebre o caídas.',
  },
  '3-6a': {
    id: '3-6a',
    label: '3 a 6 años',
    shortLabel: '3–6a',
    minMonths: 36,
    maxMonthsExclusive: 73,
    focusSummaryMx:
      'Preescolar: hábitos de sueño y autocuidado, crecimiento en kg y cm, y criterios claros para acudir al pediatra o al 911.',
  },
};

export function isValidAgeMonths(months: number): boolean {
  return (
    Number.isFinite(months) &&
    months >= MIN_AGE_MONTHS &&
    months <= MAX_AGE_MONTHS
  );
}

export function getStageForAgeMonths(months: number): StageId {
  if (!isValidAgeMonths(months)) {
    throw new RangeError(`Edad en meses fuera de rango (0 a 72): ${months}`);
  }
  if (months < 3) return '0-3m';
  if (months < 12) return '3-12m';
  if (months < 36) return '1-3a';
  return '3-6a';
}

export function isStageId(value: string): value is StageId {
  return (STAGE_ORDER as readonly string[]).includes(value);
}
