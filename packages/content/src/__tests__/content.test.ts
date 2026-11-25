import { describe, expect, it } from 'vitest';
import {
  formatMeasurement,
  STAGE_ORDER,
  validateSpanishClinicalCopy,
} from '@baby-buddy/core';
import {
  assertValidClinicalMetadata,
  CLOTHING_ENGINE_METADATA,
  createClinicalMetadata,
  M1_CLOTHING_SCAFFOLDS,
  M1_GUIDE_SCAFFOLDS,
  STAGE_OVERVIEWS,
} from '../index';

describe('@baby-buddy/content M1 scaffolds & clinical metadata', () => {
  it('validates every STAGE_OVERVIEWS entry for metadata, natural Mexican Spanish, and metric-only copy', () => {
    for (const stageId of STAGE_ORDER) {
      const overview = STAGE_OVERVIEWS[stageId];
      expect(overview.stage).toBe(stageId);
      expect(() => assertValidClinicalMetadata(overview.metadata)).not.toThrow();

      const combinedCopy = [
        overview.headlineMx,
        ...overview.orientationPointsMx,
        formatMeasurement(overview.sampleMetric),
      ].join(' ');
      const check = validateSpanishClinicalCopy(combinedCopy);
      expect(check.valid, `Invalid STAGE_OVERVIEWS[${stageId}]`).toBe(true);
      expect(check.hasImperialUnits).toBe(false);
      expect(check.diagnosticViolations).toEqual([]);
    }
  });

  it('validates every M1_GUIDE_SCAFFOLDS entry for metadata, non-diagnostic copy, and metric units', () => {
    expect(M1_GUIDE_SCAFFOLDS.length).toBeGreaterThanOrEqual(3);

    for (const guide of M1_GUIDE_SCAFFOLDS) {
      expect(() => assertValidClinicalMetadata(guide.metadata)).not.toThrow();

      const combinedCopy = [
        guide.titleMx,
        guide.summaryMx,
        ...guide.redFlagsMx,
      ].join(' ');
      const check = validateSpanishClinicalCopy(combinedCopy);
      expect(check.valid, `Invalid guide ${guide.id}`).toBe(true);
      expect(check.hasImperialUnits).toBe(false);
      expect(check.diagnosticViolations).toEqual([]);
    }
  });

  it('validates every M1_CLOTHING_SCAFFOLDS entry for metadata, metric temperatures, and Spanish copy', () => {
    expect(M1_CLOTHING_SCAFFOLDS.length).toBeGreaterThanOrEqual(3);

    for (const item of M1_CLOTHING_SCAFFOLDS) {
      expect(() => assertValidClinicalMetadata(item.metadata)).not.toThrow();
      expect(item.ambientTempRangeC).toContain('°C');

      const combinedCopy = [
        item.ambientTempRangeC,
        ...item.garmentsMx,
        item.guidanceMx,
      ].join(' ');
      const check = validateSpanishClinicalCopy(combinedCopy);
      expect(check.valid, `Invalid clothing scaffold ${item.id}`).toBe(true);
      expect(check.hasImperialUnits).toBe(false);
      expect(check.diagnosticViolations).toEqual([]);
    }
  });

  it('validates CLOTHING_ENGINE_METADATA and updated 911 respiratory red-flag copy', () => {
    expect(() => assertValidClinicalMetadata(CLOTHING_ENGINE_METADATA)).not.toThrow();
    const newbornGuide = M1_GUIDE_SCAFFOLDS.find(
      (g) => g.id === 'm1-fiebre-orientacion',
    );
    expect(newbornGuide).toBeDefined();
    expect(newbornGuide?.redFlagsMx.join(' ')).toContain(
      'Dificultad respiratoria grave',
    );
  });

  it('rejects invalid ClinicalMetadata and impossible calendar dates in assertValidClinicalMetadata', () => {
    const validMeta = createClinicalMetadata();
    expect(() => assertValidClinicalMetadata(validMeta)).not.toThrow();
    expect(() =>
      assertValidClinicalMetadata({ ...validMeta, reviewed_at: '2024-02-29' }),
    ).not.toThrow();

    expect(() =>
      assertValidClinicalMetadata({ ...validMeta, version: '   ' }),
    ).toThrow();
    expect(() =>
      assertValidClinicalMetadata({ ...validMeta, sources: [] }),
    ).toThrow();
    expect(() =>
      assertValidClinicalMetadata({ ...validMeta, reviewed_at: '24/11/2026' }),
    ).toThrow();
    expect(() =>
      assertValidClinicalMetadata({ ...validMeta, reviewed_at: '2026-02-30' }),
    ).toThrow();
    expect(() =>
      assertValidClinicalMetadata({ ...validMeta, reviewed_at: '2025-02-29' }),
    ).toThrow();
    expect(() =>
      assertValidClinicalMetadata({ ...validMeta, reviewed_at: '2026-04-31' }),
    ).toThrow();
    expect(() =>
      assertValidClinicalMetadata({ ...validMeta, reviewed_by: '' }),
    ).toThrow();
  });
});
