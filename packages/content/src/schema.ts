import type {
  MetricMeasurement,
  StageId,
  StatusSeverity,
  TriageLevel,
} from '@baby-buddy/core';

export interface ClinicalSource {
  readonly title: string;
  readonly organization: string;
  readonly year: number;
  readonly url?: string;
}

export interface ClinicalMetadata {
  readonly version: string;
  readonly sources: readonly ClinicalSource[];
  readonly reviewed_at: string;
  readonly reviewed_by: string;
}

export interface GuideScaffoldItem {
  readonly id: string;
  readonly stage: StageId;
  readonly titleMx: string;
  readonly summaryMx: string;
  readonly severity: StatusSeverity;
  readonly redFlagsMx: readonly string[];
  readonly metadata: ClinicalMetadata;
}

export interface StageOverviewScaffold {
  readonly stage: StageId;
  readonly headlineMx: string;
  readonly orientationPointsMx: readonly string[];
  readonly sampleMetric: MetricMeasurement;
  readonly metadata: ClinicalMetadata;
}

export interface ClothingOrientationScaffold {
  readonly id: string;
  readonly stage: StageId;
  readonly ambientTempRangeC: string;
  readonly garmentsMx: readonly string[];
  readonly guidanceMx: string;
  readonly metadata: ClinicalMetadata;
}

export type GuideKind =
  | 'es_normal'
  | 'problema_solucion'
  | 'primeros_auxilios';

export type ClinicalGuideLinkTone =
  | 'normal_green'
  | 'not_normal_yellow'
  | 'urgent_red';

export interface ClinicalGuideLink {
  readonly slug: string;
  readonly prefixMx: string;
  readonly titleMx: string;
  readonly tone: ClinicalGuideLinkTone;
}

export interface ClinicalGuideEntry {
  readonly slug: string;
  readonly kind: GuideKind;
  readonly stages: readonly StageId[];
  readonly categoryMx: string;
  readonly titleMx: string;
  readonly quickAnswerMx: string;
  readonly summaryMx: string;
  readonly triageLevel: TriageLevel;
  readonly doStepsMx: readonly string[];
  readonly doNotDoMx: readonly string[];
  readonly redFlagsMx: readonly string[];
  readonly keywords: readonly string[];
  readonly metadata: ClinicalMetadata;
}

export interface PoopColorEntry {
  readonly id: string;
  readonly colorNameMx: string;
  readonly swatchToken:
    | 'meconium'
    | 'mustard'
    | 'brown'
    | 'green'
    | 'red'
    | 'white_clay'
    | 'black_late';
  readonly typicalAgeMx: string;
  readonly meaningMx: string;
  readonly triageLevel: TriageLevel;
  readonly actionMx: string;
  readonly metadata: ClinicalMetadata;
}

export type MilestoneDomain =
  | 'motor'
  | 'lenguaje'
  | 'socioemocional'
  | 'cognitivo';

export interface DevelopmentMilestoneEntry {
  readonly id: string;
  readonly stage: StageId;
  readonly ageLabelMx: string;
  readonly domain: MilestoneDomain;
  readonly titleMx: string;
  readonly activityMx: string;
  readonly watchForMx: string;
  readonly metadata: ClinicalMetadata;
}
