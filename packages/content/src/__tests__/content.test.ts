import { describe, expect, it } from 'vitest';
import {
  formatMeasurement,
  STAGE_ORDER,
  validateSpanishClinicalCopy,
} from '@baby-buddy/core';
import {
  ALL_CLINICAL_GUIDES,
  DEVELOPMENT_MILESTONES,
  IS_NORMAL_GUIDES,
  POOP_COLOR_CHART,
  PROBLEM_SOLUTIONS_GUIDES,
  askEditorialAssistantMx,
  assertValidClinicalMetadata,
  CLOTHING_ENGINE_METADATA,
  createClinicalMetadata,
  getMilestonesForStage,
  M1_CLOTHING_SCAFFOLDS,
  M1_GUIDE_SCAFFOLDS,
  STAGE_OVERVIEWS,
  searchClinicalGuides,
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

  it('validates all 56 clinical guides and poop chart for metadata, Mexican Spanish, and metric-only copy', () => {
    expect(IS_NORMAL_GUIDES.length).toBe(20);
    expect(PROBLEM_SOLUTIONS_GUIDES.length).toBe(36);
    expect(ALL_CLINICAL_GUIDES.length).toBe(56);
    expect(POOP_COLOR_CHART.length).toBe(7);

    for (const guide of ALL_CLINICAL_GUIDES) {
      expect(() => assertValidClinicalMetadata(guide.metadata)).not.toThrow();
      const text = [
        guide.titleMx,
        guide.quickAnswerMx,
        guide.summaryMx,
        ...guide.doStepsMx,
        ...guide.doNotDoMx,
        ...guide.redFlagsMx,
      ].join(' ');
      const check = validateSpanishClinicalCopy(text);
      expect(check.valid, `Invalid guide ${guide.slug}`).toBe(true);
      expect(check.hasImperialUnits).toBe(false);
      expect(check.diagnosticViolations).toEqual([]);
    }

    for (const poop of POOP_COLOR_CHART) {
      expect(() => assertValidClinicalMetadata(poop.metadata)).not.toThrow();
      const check = validateSpanishClinicalCopy(
        `${poop.colorNameMx} ${poop.meaningMx} ${poop.actionMx}`,
      );
      expect(check.valid, `Invalid poop entry ${poop.id}`).toBe(true);
    }

    expect(searchClinicalGuides({ query: 'colicos' }).length).toBeGreaterThan(0);
    expect(searchClinicalGuides({ query: 'hipo', stageId: '0-3m' }).length).toBeGreaterThan(0);
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

  it('filters clinical guides by normality, triageLevel, and thematic categoryMx', async () => {
    const {
      GUIDE_CATEGORIES_MX,
      isGuideNormal,
      searchClinicalGuides,
    } = await import('../library/search');

    expect(GUIDE_CATEGORIES_MX.length).toBeGreaterThan(3);
    expect(GUIDE_CATEGORIES_MX).not.toContain('¿Es normal?');

    const normal = searchClinicalGuides({ normality: 'es_normal' });
    expect(normal.length).toBeGreaterThan(0);
    expect(normal.every((g) => g.triageLevel === 'green_home' && isGuideNormal(g))).toBe(true);

    const notNormal = searchClinicalGuides({ normality: 'no_es_normal' });
    expect(notNormal.length).toBeGreaterThan(0);
    expect(
      notNormal.every((g) => g.triageLevel === 'yellow_pediatrician'),
    ).toBe(true);

    const urgencia = searchClinicalGuides({ normality: 'urgencia' });
    expect(urgencia.length).toBeGreaterThan(0);
    expect(
      urgencia.every(
        (g) =>
          g.triageLevel === 'red_911' || g.triageLevel === 'orange_urgent',
      ),
    ).toBe(true);
    expect(urgencia.some((g) => g.slug === 'sin-mojar-panal-deshidratacion')).toBe(true);
    expect(urgencia.some((g) => g.slug === 'labios-morados-cianosis')).toBe(true);
    expect(urgencia.some((g) => g.slug === 'pausas-respiratorias-apnea')).toBe(true);

    const firstAid = searchClinicalGuides({ normality: 'primeros_auxilios' });
    expect(firstAid.length).toBeGreaterThan(0);
    expect(firstAid.every((g) => g.kind === 'primeros_auxilios')).toBe(true);

    const redOnly = searchClinicalGuides({ triageLevel: 'red_911' });
    expect(redOnly.length).toBeGreaterThan(0);
    expect(redOnly.every((g) => g.triageLevel === 'red_911')).toBe(true);
  });

  it('validates development milestones across all 4 stages and bounded editorial assistant', () => {
    expect(DEVELOPMENT_MILESTONES.length).toBeGreaterThanOrEqual(16);
    for (const stageId of STAGE_ORDER) {
      expect(getMilestonesForStage(stageId).length).toBeGreaterThanOrEqual(4);
    }
    for (const m of DEVELOPMENT_MILESTONES) {
      expect(() => assertValidClinicalMetadata(m.metadata)).not.toThrow();
      const check = validateSpanishClinicalCopy(
        `${m.titleMx}. ${m.activityMx} ${m.watchForMx}`,
      );
      expect(check.valid, `Invalid milestone ${m.id}`).toBe(true);
    }

    const infantFever = askEditorialAssistantMx({
      queryMx: 'Mi bebé tiene fiebre de 38.2',
      ageMonths: 2,
      stageId: '0-3m',
    });
    expect(infantFever.triageLevel).toBe('red_911');
    expect(infantFever.isEmergency911).toBe(true);
    expect(infantFever.citations.length).toBeGreaterThan(0);

    const normalHiccups = askEditorialAssistantMx({
      queryMx: 'hipo',
      ageMonths: 1,
      stageId: '0-3m',
    });
    expect(normalHiccups.isEmergency911).toBe(false);
    expect(normalHiccups.citations.length).toBeGreaterThan(0);
    expect(
      validateSpanishClinicalCopy(
        `${normalHiccups.headlineMx}. ${normalHiccups.answerMx} ${normalHiccups.disclaimerMx}`,
      ).valid,
    ).toBe(true);

    const outOfCorpus = askEditorialAssistantMx({
      queryMx: 'pregunta completamente inexistente xyz123',
      ageMonths: 12,
      stageId: '1-3a',
    });
    expect(outOfCorpus.citations).toEqual([]);
    expect(
      validateSpanishClinicalCopy(`${outOfCorpus.headlineMx}. ${outOfCorpus.answerMx}`).valid,
    ).toBe(true);
  });
});
