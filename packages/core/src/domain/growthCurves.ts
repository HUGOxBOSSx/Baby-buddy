import type { GrowthLogEntry } from './healthLog';
import { formatChildAgeMx, type ChildSex } from './profile';

export type GrowthHorizonMonths = 12 | 24 | 48 | 72;

export interface WhoCurvePoint {
  readonly month: number;
  readonly p3: number;
  readonly p50: number;
  readonly p97: number;
}

export interface GrowthPlotPoint {
  readonly id: string;
  readonly ageMonths: number;
  readonly ageLabelMx: string;
  readonly dateLabel: string;
  readonly weightKg?: number;
  readonly heightCm?: number;
}

const WHO_WEIGHT_BOYS_KG: readonly WhoCurvePoint[] = [
  { month: 0, p3: 2.5, p50: 3.3, p97: 4.4 },
  { month: 1, p3: 3.4, p50: 4.5, p97: 5.8 },
  { month: 2, p3: 4.3, p50: 5.6, p97: 7.1 },
  { month: 3, p3: 5.0, p50: 6.4, p97: 8.0 },
  { month: 4, p3: 5.6, p50: 7.0, p97: 8.7 },
  { month: 6, p3: 6.4, p50: 7.9, p97: 9.8 },
  { month: 9, p3: 7.1, p50: 8.9, p97: 11.0 },
  { month: 12, p3: 7.7, p50: 9.6, p97: 12.0 },
  { month: 18, p3: 8.8, p50: 10.9, p97: 13.7 },
  { month: 24, p3: 9.7, p50: 12.2, p97: 15.3 },
  { month: 36, p3: 11.3, p50: 14.3, p97: 18.3 },
  { month: 48, p3: 12.7, p50: 16.3, p97: 21.2 },
  { month: 60, p3: 14.1, p50: 18.3, p97: 24.2 },
  { month: 72, p3: 15.6, p50: 20.5, p97: 27.6 },
];

const WHO_WEIGHT_GIRLS_KG: readonly WhoCurvePoint[] = [
  { month: 0, p3: 2.4, p50: 3.2, p97: 4.2 },
  { month: 1, p3: 3.2, p50: 4.2, p97: 5.5 },
  { month: 2, p3: 3.9, p50: 5.1, p97: 6.6 },
  { month: 3, p3: 4.5, p50: 5.8, p97: 7.5 },
  { month: 4, p3: 5.0, p50: 6.4, p97: 8.2 },
  { month: 6, p3: 5.7, p50: 7.3, p97: 9.3 },
  { month: 9, p3: 6.5, p50: 8.2, p97: 10.5 },
  { month: 12, p3: 7.0, p50: 8.9, p97: 11.5 },
  { month: 18, p3: 8.1, p50: 10.2, p97: 13.2 },
  { month: 24, p3: 9.0, p50: 11.5, p97: 14.8 },
  { month: 36, p3: 10.8, p50: 13.9, p97: 18.1 },
  { month: 48, p3: 12.3, p50: 16.1, p97: 21.5 },
  { month: 60, p3: 13.7, p50: 18.2, p97: 24.9 },
  { month: 72, p3: 15.1, p50: 20.2, p97: 28.3 },
];

const WHO_HEIGHT_BOYS_CM: readonly WhoCurvePoint[] = [
  { month: 0, p3: 46.1, p50: 49.9, p97: 53.7 },
  { month: 1, p3: 50.8, p50: 54.7, p97: 58.6 },
  { month: 2, p3: 54.4, p50: 58.4, p97: 62.4 },
  { month: 3, p3: 57.3, p50: 61.4, p97: 65.5 },
  { month: 4, p3: 59.7, p50: 63.9, p97: 68.0 },
  { month: 6, p3: 63.3, p50: 67.6, p97: 71.9 },
  { month: 9, p3: 67.5, p50: 72.0, p97: 76.5 },
  { month: 12, p3: 71.0, p50: 75.7, p97: 80.5 },
  { month: 18, p3: 76.9, p50: 82.3, p97: 87.7 },
  { month: 24, p3: 81.7, p50: 87.8, p97: 93.9 },
  { month: 36, p3: 88.7, p50: 96.1, p97: 103.5 },
  { month: 48, p3: 94.9, p50: 103.3, p97: 111.7 },
  { month: 60, p3: 100.7, p50: 110.0, p97: 119.2 },
  { month: 72, p3: 106.1, p50: 116.0, p97: 125.8 },
];

const WHO_HEIGHT_GIRLS_CM: readonly WhoCurvePoint[] = [
  { month: 0, p3: 45.4, p50: 49.1, p97: 52.9 },
  { month: 1, p3: 49.8, p50: 53.7, p97: 57.6 },
  { month: 2, p3: 53.0, p50: 57.1, p97: 61.1 },
  { month: 3, p3: 55.6, p50: 59.8, p97: 64.0 },
  { month: 4, p3: 57.8, p50: 62.1, p97: 66.4 },
  { month: 6, p3: 61.2, p50: 65.7, p97: 70.3 },
  { month: 9, p3: 65.3, p50: 70.1, p97: 75.0 },
  { month: 12, p3: 68.9, p50: 74.0, p97: 79.2 },
  { month: 18, p3: 74.9, p50: 80.7, p97: 86.5 },
  { month: 24, p3: 80.0, p50: 86.4, p97: 92.9 },
  { month: 36, p3: 87.4, p50: 95.1, p97: 102.7 },
  { month: 48, p3: 94.1, p50: 102.7, p97: 111.3 },
  { month: 60, p3: 99.9, p50: 109.4, p97: 118.9 },
  { month: 72, p3: 105.1, p50: 115.1, p97: 125.2 },
];

function averageCurves(
  a: readonly WhoCurvePoint[],
  b: readonly WhoCurvePoint[],
): readonly WhoCurvePoint[] {
  return a.map((pt, i) => {
    const other = b[i]!;
    return {
      month: pt.month,
      p3: Number(((pt.p3 + other.p3) / 2).toFixed(1)),
      p50: Number(((pt.p50 + other.p50) / 2).toFixed(1)),
      p97: Number(((pt.p97 + other.p97) / 2).toFixed(1)),
    };
  });
}

export function getWhoWeightCurve(sex?: ChildSex): readonly WhoCurvePoint[] {
  if (sex === 'niño') return WHO_WEIGHT_BOYS_KG;
  if (sex === 'niña') return WHO_WEIGHT_GIRLS_KG;
  return averageCurves(WHO_WEIGHT_BOYS_KG, WHO_WEIGHT_GIRLS_KG);
}

export function getWhoHeightCurve(sex?: ChildSex): readonly WhoCurvePoint[] {
  if (sex === 'niño') return WHO_HEIGHT_BOYS_CM;
  if (sex === 'niña') return WHO_HEIGHT_GIRLS_CM;
  return averageCurves(WHO_HEIGHT_BOYS_CM, WHO_HEIGHT_GIRLS_CM);
}

export function computeAgeMonthsAtTimestamp(
  birthDateIso: string | undefined,
  timestampIso: string,
  fallbackAgeMonths: number,
): number {
  if (!birthDateIso) {
    return Math.max(0, Math.min(72, fallbackAgeMonths));
  }
  const birthMs = new Date(birthDateIso).getTime();
  const entryMs = new Date(timestampIso).getTime();
  if (!Number.isFinite(birthMs) || !Number.isFinite(entryMs)) {
    return Math.max(0, Math.min(72, fallbackAgeMonths));
  }
  const months = (entryMs - birthMs) / (30.4375 * 86_400_000);
  return Math.max(0, Math.min(72, Number(months.toFixed(2))));
}

export function formatGrowthAgeMx(ageDays: number): string {
  const safeDays = Math.max(0, Math.round(ageDays));
  if (safeDays < 28) {
    return `${safeDays} ${safeDays === 1 ? 'día' : 'días'}`;
  }
  if (safeDays < 90) {
    const weeks = Math.max(4, Math.round(safeDays / 7));
    return `${weeks} sem`;
  }
  const approxMonths = Math.max(3, Math.min(72, Math.round(safeDays / 30.4375)));
  return formatChildAgeMx(approxMonths);
}

export function buildGrowthPlotPoints(
  entries: readonly GrowthLogEntry[],
  birthDateIso: string | undefined,
  fallbackAgeMonths: number,
): readonly GrowthPlotPoint[] {
  return [...entries]
    .sort(
      (a, b) =>
        new Date(a.timestampIso).getTime() - new Date(b.timestampIso).getTime(),
    )
    .map((entry) => {
      const ageMonths =
        entry.ageAtEntryDays !== undefined &&
        Number.isFinite(entry.ageAtEntryDays)
          ? Math.max(
              0,
              Math.min(72, Number((entry.ageAtEntryDays / 30.4375).toFixed(2))),
            )
          : computeAgeMonthsAtTimestamp(
              birthDateIso,
              entry.timestampIso,
              fallbackAgeMonths,
            );
      return {
        id: entry.id,
        ageMonths,
        ageLabelMx:
          entry.ageLabelMx ?? formatGrowthAgeMx(ageMonths * 30.4375),
        dateLabel: entry.timestampIso.slice(0, 10),
        weightKg: entry.weightKg,
        heightCm: entry.heightCm,
      };
    });
}
