import { describe, expect, it } from 'vitest';
import {
  formatMeasurement,
  formatMetric,
  isImperialUnitPresent,
  METRIC_UNITS,
} from '../index';

describe('Metric units (°C, kg, cm, ml) & imperial guardrail', () => {
  it('defines strictly the 4 metric units', () => {
    expect(METRIC_UNITS).toEqual(['°C', 'kg', 'cm', 'ml']);
  });

  it('formats metric values cleanly with and without explicit decimals', () => {
    expect(formatMetric(36.8, '°C')).toBe('36.8 °C');
    expect(formatMetric(37, '°C')).toBe('37 °C');
    expect(formatMetric(37, '°C', 1)).toBe('37.0 °C');
    expect(formatMetric(3.5, 'kg')).toBe('3.5 kg');
    expect(formatMetric(52, 'cm')).toBe('52 cm');
    expect(formatMetric(120, 'ml')).toBe('120 ml');
    expect(formatMetric(-0, '°C')).toBe('0 °C');
    expect(formatMetric(-0, '°C', 1)).toBe('0.0 °C');
    expect(formatMetric(36.80000004, '°C')).toBe('36.8 °C');
    expect(formatMeasurement({ value: 150, unit: 'ml' })).toBe('150 ml');
  });

  it('throws RangeError on non-finite values or invalid decimal precision', () => {
    expect(() => formatMetric(Number.NaN, '°C')).toThrow(RangeError);
    expect(() => formatMetric(Number.POSITIVE_INFINITY, 'kg')).toThrow(
      RangeError,
    );
    expect(() => formatMetric(36.5, '°C', -1)).toThrow(RangeError);
    expect(() => formatMetric(36.5, '°C', 1.5)).toThrow(RangeError);
    expect(() => formatMetric(36.5, '°C', 5)).toThrow(RangeError);
  });

  it('detects all imperial unit patterns reliably including no-space numeric units', () => {
    const imperialSamples = [
      '98.6 °F',
      '100.4°F',
      '98.6 fahrenheit',
      '7.5 lb',
      '7.5lb',
      '7.5lbs',
      '3,5lb',
      '12 lbs',
      '4 oz',
      '12oz',
      '8 fl oz',
      '4 fl. oz',
      '4fl.oz',
      '20 in',
      '20in',
      '20 inches',
      '1 inch',
      '3 ft',
      '3ft',
      '5 feet',
      '2yd',
      '68 ° F',
      '3,5 kg y 4 oz',
      '4 onzas de leche',
      '5onzas',
      '20 pulgadas',
      '15pulgadas',
      '8 libras',
      '10libras',
    ];

    for (const sample of imperialSamples) {
      expect(isImperialUnitPresent(sample), `Expected true for: ${sample}`).toBe(
        true,
      );
    }
  });

  it('avoids false positives on natural Mexican Spanish and metric copy', () => {
    const mexicanMetricSamples = [
      '37.5 °C en axila',
      '37.5°C',
      'En casa y sin fiebre',
      'en casa',
      'sin fiebre',
      'fin',
      'infantil',
      'minutos',
      'ml',
      'cm',
      'kg',
      '°C',
      'en 30 min',
      '30min',
      'libre',
      'once',
      '120 ml de fórmula',
      '120ml',
      '52 cm de talla',
      '52cm',
      'Pañalero de algodón en clima cálido',
      'Fin de la toma en ml',
      '20 minutos en brazos',
      'Peso saludable de 7.4 kg',
      '7.4kg',
      'Consulta infantil con tu pediatra',
      'En caso de urgencia llama al 911',
      'Mameluco ligero sin cobijas sueltas',
      'Prevención de rozadura en el área del pañal',
      'Biberón o mamila bien esterilizada',
      'Temperatura ambiental entre 20 °C y 23 °C',
      'Sin señales de deshidratación',
    ];

    for (const sample of mexicanMetricSamples) {
      expect(
        isImperialUnitPresent(sample),
        `Expected false for: ${sample}`,
      ).toBe(false);
    }
  });
});
