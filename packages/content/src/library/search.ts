import { normalizeSearchText, type StageId } from '@baby-buddy/core';
import type { ClinicalGuideEntry, GuideKind } from '../schema';
import { IS_NORMAL_GUIDES } from './isNormal';
import { PROBLEM_SOLUTIONS_GUIDES } from './problems';

export const ALL_CLINICAL_GUIDES: readonly ClinicalGuideEntry[] = [
  ...IS_NORMAL_GUIDES,
  ...PROBLEM_SOLUTIONS_GUIDES,
] as const;

export function getClinicalGuideBySlug(
  slug: string,
): ClinicalGuideEntry | undefined {
  return ALL_CLINICAL_GUIDES.find((g) => g.slug === slug);
}

export interface GuideSearchOptions {
  readonly query?: string;
  readonly stageId?: StageId | 'all';
  readonly kind?: GuideKind | 'all';
}

export function searchClinicalGuides(
  options: GuideSearchOptions = {},
): readonly ClinicalGuideEntry[] {
  const { query = '', stageId = 'all', kind = 'all' } = options;
  const normalizedQuery = normalizeSearchText(query);

  return ALL_CLINICAL_GUIDES.filter((guide) => {
    if (stageId !== 'all' && !guide.stages.includes(stageId)) {
      return false;
    }
    if (kind !== 'all' && guide.kind !== kind) {
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
