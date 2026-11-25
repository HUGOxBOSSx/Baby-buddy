import {
  normalizeSearchText,
  type StageId,
  type TriageLevel,
} from '@baby-buddy/core';
import type { ClinicalGuideEntry, GuideKind } from '../schema';
import { IS_NORMAL_GUIDES } from './isNormal';
import { PROBLEM_SOLUTIONS_GUIDES } from './problems';

export type NormalityFilter =
  | 'all'
  | 'es_normal'
  | 'no_es_normal'
  | 'urgencia'
  | 'primeros_auxilios';

export const ALL_CLINICAL_GUIDES: readonly ClinicalGuideEntry[] = [
  ...IS_NORMAL_GUIDES,
  ...PROBLEM_SOLUTIONS_GUIDES,
] as const;

export const GUIDE_CATEGORIES_MX: readonly string[] = Array.from(
  new Set(ALL_CLINICAL_GUIDES.map((g) => g.categoryMx)),
).sort((a, b) => a.localeCompare(b, 'es-MX'));

export function isGuideNormal(guide: ClinicalGuideEntry): boolean {
  return guide.triageLevel === 'green_home';
}

export function getClinicalGuideBySlug(
  slug: string,
): ClinicalGuideEntry | undefined {
  return ALL_CLINICAL_GUIDES.find((g) => g.slug === slug);
}

export interface GuideSearchOptions {
  readonly query?: string;
  readonly stageId?: StageId | 'all';
  readonly kind?: GuideKind | 'all';
  readonly normality?: NormalityFilter;
  readonly triageLevel?: TriageLevel | 'all';
  readonly categoryMx?: string | 'all';
}

export function searchClinicalGuides(
  options: GuideSearchOptions = {},
): readonly ClinicalGuideEntry[] {
  const {
    query = '',
    stageId = 'all',
    kind = 'all',
    normality = 'all',
    triageLevel = 'all',
    categoryMx = 'all',
  } = options;
  const normalizedQuery = normalizeSearchText(query);

  return ALL_CLINICAL_GUIDES.filter((guide) => {
    if (stageId !== 'all' && !guide.stages.includes(stageId)) {
      return false;
    }
    if (kind !== 'all' && guide.kind !== kind) {
      return false;
    }
    if (normality === 'es_normal') {
      if (guide.triageLevel !== 'green_home') {
        return false;
      }
    } else if (normality === 'no_es_normal') {
      if (guide.triageLevel !== 'yellow_pediatrician') {
        return false;
      }
    } else if (normality === 'urgencia') {
      if (
        guide.triageLevel !== 'red_911' &&
        guide.triageLevel !== 'orange_urgent'
      ) {
        return false;
      }
    } else if (normality === 'primeros_auxilios') {
      if (guide.kind !== 'primeros_auxilios') {
        return false;
      }
    }
    if (triageLevel !== 'all' && guide.triageLevel !== triageLevel) {
      return false;
    }
    if (categoryMx !== 'all' && guide.categoryMx !== categoryMx) {
      return false;
    }
    if (!normalizedQuery) {
      return true;
    }
    const haystack = normalizeSearchText(
      [
        guide.titleMx,
        guide.quickAnswerMx,
        guide.summaryMx,
        guide.categoryMx,
        ...guide.keywords,
      ].join(' '),
    );
    return normalizedQuery
      .split(/\s+/)
      .filter(Boolean)
      .every((term) => haystack.includes(term));
  });
}
