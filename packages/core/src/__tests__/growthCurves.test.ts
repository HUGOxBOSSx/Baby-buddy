import { describe, expect, it } from 'vitest';
import {
  buildGrowthPlotPoints,
  formatGrowthAgeMx,
  getWhoHeightCurve,
  getWhoWeightCurve,
} from '../domain/growthCurves';

describe('growthCurves (OMS 2006)', () => {
  it('mantiene curvas de peso y altura monotónicas de 0 a 72 meses', () => {
    for (const sex of ['niño', 'niña', 'no_especificado'] as const) {
      const w = getWhoWeightCurve(sex);
      const h = getWhoHeightCurve(sex);
      expect(w[0]?.month).toBe(0);
      expect(w[w.length - 1]?.month).toBe(72);
      for (let i = 1; i < w.length; i += 1) {
        expect(w[i]!.p50).toBeGreaterThan(w[i - 1]!.p50);
        expect(h[i]!.p50).toBeGreaterThan(h[i - 1]!.p50);
      }
    }
  });

  it('calcula edad en meses para cada registro de crecimiento', () => {
    const pts = buildGrowthPlotPoints(
      [
        {
          id: 'g2',
          timestampIso: '2026-06-01T12:00:00.000Z',
          weightKg: 6.2,
          heightCm: 61,
        },
        {
          id: 'g1',
          timestampIso: '2026-03-01T12:00:00.000Z',
          weightKg: 3.4,
          heightCm: 50,
        },
      ],
      '2026-03-01T00:00:00.000Z',
      3,
    );
    expect(pts).toHaveLength(2);
    expect(pts[0]?.id).toBe('g1');
    expect(pts[0]?.ageMonths).toBeLessThan(1);
    expect(pts[1]?.ageMonths).toBeGreaterThan(2.9);
  });

  it('formatea edad de crecimiento en días, semanas y meses y respeta ageAtEntryDays', () => {
    expect(formatGrowthAgeMx(0)).toBe('0 días');
    expect(formatGrowthAgeMx(1)).toBe('1 día');
    expect(formatGrowthAgeMx(14)).toBe('14 días');
    expect(formatGrowthAgeMx(42)).toBe('6 sem');
    expect(formatGrowthAgeMx(180)).toBe('6 meses');

    const pts = buildGrowthPlotPoints(
      [
        {
          id: 'g-past',
          timestampIso: '2026-04-01T12:00:00.000Z',
          weightKg: 4.1,
          ageAtEntryDays: 21,
          ageLabelMx: '21 días',
        },
      ],
      '2026-03-01T00:00:00.000Z',
      6,
    );
    expect(pts[0]?.ageMonths).toBeCloseTo(21 / 30.4375, 2);
    expect(pts[0]?.ageLabelMx).toBe('21 días');
  });
});
