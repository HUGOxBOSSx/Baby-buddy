import { describe, expect, it } from 'vitest';
import {
  createChildProfileSummary,
  getStageForAgeMonths,
  isImperialUnitPresent,
  isStageId,
  isValidAgeMonths,
  STAGE_ORDER,
  STAGE_SPECS,
} from '../index';

describe('0–6 años stage helpers', () => {
  it('defines the 4 canonical stages in chronological order', () => {
    expect(STAGE_ORDER).toEqual(['0-3m', '3-12m', '1-3a', '3-6a']);
  });

  it('maps boundary ages accurately across 0 to 72 months', () => {
    expect(getStageForAgeMonths(-0)).toBe('0-3m');
    expect(getStageForAgeMonths(0)).toBe('0-3m');
    expect(getStageForAgeMonths(0.5)).toBe('0-3m');
    expect(getStageForAgeMonths(2.99)).toBe('0-3m');

    expect(getStageForAgeMonths(3)).toBe('3-12m');
    expect(getStageForAgeMonths(3.0)).toBe('3-12m');
    expect(getStageForAgeMonths(11.99)).toBe('3-12m');

    expect(getStageForAgeMonths(12)).toBe('1-3a');
    expect(getStageForAgeMonths(24)).toBe('1-3a');
    expect(getStageForAgeMonths(35.99)).toBe('1-3a');

    expect(getStageForAgeMonths(36)).toBe('3-6a');
    expect(getStageForAgeMonths(60)).toBe('3-6a');
    expect(getStageForAgeMonths(72)).toBe('3-6a');

    for (const age of [0, 2.99, 3, 11.99, 12, 35.99, 36, 72]) {
      const spec = STAGE_SPECS[getStageForAgeMonths(age)];
      expect(age).toBeGreaterThanOrEqual(spec.minMonths);
      expect(age).toBeLessThan(spec.maxMonthsExclusive);
    }
    expect(72 < STAGE_SPECS[getStageForAgeMonths(72)].maxMonthsExclusive).toBe(
      true,
    );
  });

  it('rejects negative, >72, NaN, and infinite ages with RangeError', () => {
    const invalidAges = [
      -0.01,
      -1,
      72.01,
      73,
      Number.NaN,
      Number.POSITIVE_INFINITY,
      Number.NEGATIVE_INFINITY,
    ];

    for (const age of invalidAges) {
      expect(isValidAgeMonths(age)).toBe(false);
      expect(() => getStageForAgeMonths(age)).toThrow(RangeError);
    }
  });

  it('validates StageId type guard cleanly', () => {
    for (const id of STAGE_ORDER) {
      expect(isStageId(id)).toBe(true);
    }
    expect(isStageId('6-12a')).toBe(false);
    expect(isStageId('')).toBe(false);
  });

  it('keeps STAGE_SPECS in natural Mexican Spanish with zero imperial units', () => {
    for (const id of STAGE_ORDER) {
      const spec = STAGE_SPECS[id];
      expect(spec.label.length).toBeGreaterThan(0);
      expect(spec.focusSummaryMx.length).toBeGreaterThan(0);
      expect(isImperialUnitPresent(spec.focusSummaryMx)).toBe(false);
    }
    expect(STAGE_SPECS['0-3m'].focusSummaryMx).toContain('pañalero');
    expect(STAGE_SPECS['0-3m'].focusSummaryMx).toContain('mamila');
    expect(STAGE_SPECS['3-12m'].focusSummaryMx).toContain('rozadura');
    expect(STAGE_SPECS['3-6a'].focusSummaryMx).toContain('911');
  });

  it('creates ChildProfileSummary with derived stageId and trimmed nickname', () => {
    const profile = createChildProfileSummary({
      id: ' p1 ',
      nicknameMx: ' Mateo ',
      ageMonths: 14,
      nowIso: '2026-11-24T23:30:00Z',
    });

    expect(profile.id).toBe('p1');
    expect(profile.nicknameMx).toBe('Mateo');
    expect(profile.stageId).toBe('1-3a');
    expect(profile.createdAtIso).toBe('2026-11-24T23:30:00Z');

    expect(() =>
      createChildProfileSummary({
        id: 'p2',
        nicknameMx: '   ',
        ageMonths: 4,
      }),
    ).toThrow();
  });
});
