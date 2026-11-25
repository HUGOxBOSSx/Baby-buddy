export type MetricUnit = '°C' | 'kg' | 'cm' | 'ml';

export const METRIC_UNITS: readonly MetricUnit[] = [
  '°C',
  'kg',
  'cm',
  'ml',
] as const;

export interface MetricMeasurement {
  readonly value: number;
  readonly unit: MetricUnit;
}

const IMPERIAL_STANDALONE_REGEX =
  /(?:°\s*F(?=$|[^a-zA-ZáéíóúüñÁÉÍÓÚÜÑ])|\b(?:fl\.?\s*oz|oz|lbs?|inch(?:es)?|feet|fahrenheit|pulgadas?|libras?|onzas?)\b)/i;

const IMPERIAL_NUMERIC_REGEX =
  /\b\d+(?:[.,]\d+)?\s*(?:fl\.?\s*oz|oz|lbs?|in|ft|yd|foot|pounds?|ounces?|libras?|onzas?|pulgadas?)\b/i;

export function formatMetric(
  value: number,
  unit: MetricUnit,
  decimals?: number,
): string {
  if (!Number.isFinite(value)) {
    throw new RangeError(`Valor métrico inválido: ${value}`);
  }

  const normalized = Object.is(value, -0) ? 0 : value;

  if (decimals !== undefined) {
    if (!Number.isInteger(decimals) || decimals < 0 || decimals > 4) {
      throw new RangeError(
        `Número de decimales inválido (0 a 4): ${decimals}`,
      );
    }
    const fixed = normalized.toFixed(decimals);
    const safeFixed = fixed === '-0' || fixed.startsWith('-0.') && Number(fixed) === 0
      ? (0).toFixed(decimals)
      : fixed;
    return `${safeFixed} ${unit}`;
  }

  const rounded = Math.round(normalized * 100) / 100;
  const safe = Object.is(rounded, -0) ? 0 : rounded;
  return `${safe} ${unit}`;
}

export function formatMeasurement(
  measurement: MetricMeasurement,
  decimals?: number,
): string {
  return formatMetric(measurement.value, measurement.unit, decimals);
}

export function isImperialUnitPresent(text: string): boolean {
  return IMPERIAL_STANDALONE_REGEX.test(text) || IMPERIAL_NUMERIC_REGEX.test(text);
}
