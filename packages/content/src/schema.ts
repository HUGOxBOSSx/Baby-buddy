import type {
  MetricMeasurement,
  StageId,
  StatusSeverity,
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
