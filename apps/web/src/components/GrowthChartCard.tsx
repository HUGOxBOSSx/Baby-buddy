'use client';

import { useState } from 'react';
import {
  buildGrowthPlotPoints,
  getWhoHeightCurve,
  getWhoWeightCurve,
  type ChildSex,
  type GrowthHorizonMonths,
  type GrowthLogEntry,
  type WhoCurvePoint,
} from '@baby-buddy/core';

type GrowthMetricView = 'both' | 'weight' | 'height';

const HORIZONS: readonly { readonly months: GrowthHorizonMonths; readonly label: string }[] = [
  { months: 12, label: '1 año' },
  { months: 24, label: '2 años' },
  { months: 48, label: '4 años' },
  { months: 72, label: '6 años' },
] as const;

function buildBandPath(
  curve: readonly WhoCurvePoint[],
  maxMonth: number,
  xOf: (m: number) => number,
  yOf: (v: number) => number,
): string {
  const pts = curve.filter((p) => p.month <= maxMonth);
  if (pts.length === 0) return '';
  const top = pts
    .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${xOf(p.month).toFixed(1)} ${yOf(p.p97).toFixed(1)}`)
    .join(' ');
  const bottom = [...pts]
    .reverse()
    .map((p) => `L ${xOf(p.month).toFixed(1)} ${yOf(p.p3).toFixed(1)}`)
    .join(' ');
  return `${top} ${bottom} Z`;
}

function buildMedianPath(
  curve: readonly WhoCurvePoint[],
  maxMonth: number,
  xOf: (m: number) => number,
  yOf: (v: number) => number,
): string {
  const pts = curve.filter((p) => p.month <= maxMonth);
  return pts
    .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${xOf(p.month).toFixed(1)} ${yOf(p.p50).toFixed(1)}`)
    .join(' ');
}

export function GrowthChartCard({
  entries,
  birthDateIso,
  fallbackAgeMonths,
  sex,
}: {
  readonly entries: readonly GrowthLogEntry[];
  readonly birthDateIso?: string;
  readonly fallbackAgeMonths: number;
  readonly sex?: ChildSex;
}) {
  const [horizon, setHorizon] = useState<GrowthHorizonMonths>(12);
  const [metricView, setMetricView] = useState<GrowthMetricView>('both');

  const weightCurve = getWhoWeightCurve(sex);
  const heightCurve = getWhoHeightCurve(sex);
  const points = buildGrowthPlotPoints(entries, birthDateIso, fallbackAgeMonths).filter(
    (p) => p.ageMonths <= horizon,
  );

  const wMax =
    weightCurve.find((p) => p.month === horizon)?.p97 ??
    weightCurve[weightCurve.length - 1]!.p97;
  const hMax =
    heightCurve.find((p) => p.month === horizon)?.p97 ??
    heightCurve[heightCurve.length - 1]!.p97;

  const padL = 34;
  const padR = 36;
  const padT = 16;
  const padB = 26;
  const svgW = 360;
  const svgH = 220;
  const plotW = svgW - padL - padR;
  const plotH = svgH - padT - padB;

  const xOf = (m: number) => padL + (Math.min(horizon, Math.max(0, m)) / horizon) * plotW;
  const yWeight = (kg: number) =>
    padT + plotH - (Math.min(wMax + 2, Math.max(0, kg)) / (wMax + 2)) * plotH;
  const yHeight = (cm: number) =>
    padT + plotH - (Math.min(hMax + 5, Math.max(25, cm) - 25) / (hMax + 5 - 25)) * plotH;

  const xTicks = horizon === 12 ? [0, 3, 6, 9, 12] : horizon === 24 ? [0, 6, 12, 18, 24] : horizon === 48 ? [0, 12, 24, 36, 48] : [0, 18, 36, 54, 72];

  const weightPoints = points.filter((p) => p.weightKg !== undefined);
  const heightPoints = points.filter((p) => p.heightCm !== undefined);

  return (
    <div className="rounded-2xl border border-border-interactive bg-bg-card p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          {HORIZONS.map((h) => (
            <button
              key={h.months}
              type="button"
              onClick={() => setHorizon(h.months)}
              aria-pressed={horizon === h.months}
              className={`min-h-9 rounded-full border px-3 py-1 text-xs font-bold ${
                horizon === h.months
                  ? 'border-brand-primary bg-brand-primary text-brand-on'
                  : 'border-border-interactive bg-bg-elevated text-ink-primary'
              }`}
            >
              {h.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(
            [
              { id: 'both', label: 'Altura y Peso' },
              { id: 'weight', label: 'Peso (kg)' },
              { id: 'height', label: 'Altura (cm)' },
            ] as const
          ).map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => setMetricView(v.id)}
              aria-pressed={metricView === v.id}
              className={`min-h-9 rounded-full border px-3 py-1 text-xs font-semibold ${
                metricView === v.id
                  ? 'border-brand-primary bg-brand-surface text-brand-text'
                  : 'border-border-interactive bg-bg-elevated text-ink-secondary'
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      <svg
        viewBox={`0 0 ${svgW} ${svgH}`}
        className="w-full h-auto rounded-xl border border-border-subtle bg-bg-elevated"
        role="img"
        aria-label="Gráfica de crecimiento comparada con estándares OMS 2006"
      >
        {xTicks.map((m) => (
          <g key={`x-${m}`}>
            <line
              x1={xOf(m)}
              y1={padT}
              x2={xOf(m)}
              y2={padT + plotH}
              stroke="currentColor"
              strokeDasharray="2 3"
              opacity={0.18}
            />
            <text
              x={xOf(m)}
              y={svgH - 8}
              textAnchor="middle"
              fontSize="9"
              fill="currentColor"
              opacity={0.65}
            >
              {m}m
            </text>
          </g>
        ))}

        {[0.25, 0.5, 0.75].map((frac) => (
          <line
            key={`y-${frac}`}
            x1={padL}
            y1={padT + plotH * frac}
            x2={padL + plotW}
            y2={padT + plotH * frac}
            stroke="currentColor"
            strokeDasharray="2 3"
            opacity={0.16}
          />
        ))}

        {metricView !== 'height' ? (
          <>
            <path
              d={buildBandPath(weightCurve, horizon, xOf, yWeight)}
              fill="#22c55e"
              opacity={0.18}
            />
            <path
              d={buildMedianPath(weightCurve, horizon, xOf, yWeight)}
              fill="none"
              stroke="#15803d"
              strokeWidth={1.2}
              strokeDasharray="3 3"
              opacity={0.65}
            />
            <text x={padL - 4} y={padT + 8} textAnchor="end" fontSize="9" fill="#15803d" fontWeight="700">
              {Math.ceil(wMax)}kg
            </text>
            {[0.25, 0.5, 0.75].map((frac) => (
              <text
                key={`wy-${frac}`}
                x={padL - 4}
                y={padT + plotH * frac + 3}
                textAnchor="end"
                fontSize="8"
                fill="#15803d"
                opacity={0.75}
              >
                {Math.round((wMax + 2) * (1 - frac))}
              </text>
            ))}
            <text x={padL - 4} y={padT + plotH} textAnchor="end" fontSize="9" fill="#15803d" fontWeight="700">
              0kg
            </text>
            {weightPoints.length > 1 ? (
              <polyline
                fill="none"
                stroke="#15803d"
                strokeWidth={2}
                points={weightPoints
                  .map((p) => `${xOf(p.ageMonths).toFixed(1)},${yWeight(p.weightKg!).toFixed(1)}`)
                  .join(' ')}
              />
            ) : null}
            {weightPoints.map((p) => (
              <circle
                key={`w-${p.id}`}
                cx={xOf(p.ageMonths)}
                cy={yWeight(p.weightKg!)}
                r={4}
                fill="#16a34a"
                stroke="#ffffff"
                strokeWidth={1.5}
              >
                <title>{`${p.weightKg} kg · ${p.dateLabel} (${p.ageLabelMx})`}</title>
              </circle>
            ))}
          </>
        ) : null}

        {metricView !== 'weight' ? (
          <>
            <path
              d={buildBandPath(heightCurve, horizon, xOf, yHeight)}
              fill="#3b82f6"
              opacity={0.18}
            />
            <path
              d={buildMedianPath(heightCurve, horizon, xOf, yHeight)}
              fill="none"
              stroke="#1d4ed8"
              strokeWidth={1.2}
              strokeDasharray="3 3"
              opacity={0.65}
            />
            <text x={padL + plotW + 4} y={padT + 8} textAnchor="start" fontSize="9" fill="#1d4ed8" fontWeight="700">
              {Math.ceil(hMax)}cm
            </text>
            {[0.25, 0.5, 0.75].map((frac) => (
              <text
                key={`hy-${frac}`}
                x={padL + plotW + 4}
                y={padT + plotH * frac + 3}
                textAnchor="start"
                fontSize="8"
                fill="#1d4ed8"
                opacity={0.75}
              >
                {Math.round(25 + (hMax + 5 - 25) * (1 - frac))}
              </text>
            ))}
            <text x={padL + plotW + 4} y={padT + plotH} textAnchor="start" fontSize="9" fill="#1d4ed8" fontWeight="700">
              25cm
            </text>
            {heightPoints.length > 1 ? (
              <polyline
                fill="none"
                stroke="#1d4ed8"
                strokeWidth={2}
                points={heightPoints
                  .map((p) => `${xOf(p.ageMonths).toFixed(1)},${yHeight(p.heightCm!).toFixed(1)}`)
                  .join(' ')}
              />
            ) : null}
            {heightPoints.map((p) => (
              <circle
                key={`h-${p.id}`}
                cx={xOf(p.ageMonths)}
                cy={yHeight(p.heightCm!)}
                r={4}
                fill="#2563eb"
                stroke="#ffffff"
                strokeWidth={1.5}
              >
                <title>{`${p.heightCm} cm · ${p.dateLabel} (${p.ageLabelMx})`}</title>
              </circle>
            ))}
          </>
        ) : null}
      </svg>

      <p className="text-[11px] text-ink-secondary">
        Estándares de Crecimiento Infantil de la OMS (2006)
      </p>
    </div>
  );
}
