import { useState } from 'react';
import {
  buildGrowthPlotPoints,
  getWhoHeightCurve,
  getWhoWeightCurve,
  type ChildSex,
  type GrowthHorizonMonths,
  type GrowthLogEntry,
} from '@baby-buddy/core';
import { Pressable, Text, View } from 'react-native';
import { useThemeContext } from './ThemeProvider';

const HORIZONS: readonly { readonly months: GrowthHorizonMonths; readonly label: string }[] = [
  { months: 12, label: '1 año' },
  { months: 24, label: '2 años' },
  { months: 48, label: '4 años' },
  { months: 72, label: '6 años' },
] as const;

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
  const { palette } = useThemeContext();
  const [horizon, setHorizon] = useState<GrowthHorizonMonths>(12);
  const [metric, setMetric] = useState<'weight' | 'height'>('weight');

  const curve = (metric === 'weight' ? getWhoWeightCurve(sex) : getWhoHeightCurve(sex)).filter(
    (p) => p.month <= horizon,
  );
  const points = buildGrowthPlotPoints(entries, birthDateIso, fallbackAgeMonths).filter(
    (p) => p.ageMonths <= horizon,
  );
  const latest = points[points.length - 1];
  const minVal = metric === 'weight' ? 0 : 40;
  const maxVal = curve[curve.length - 1]?.p97 ?? (metric === 'weight' ? 12 : 80);

  return (
    <View
      className="rounded-2xl border p-3 gap-3"
      style={{
        backgroundColor: palette.bgElevated,
        borderColor: palette.borderInteractive,
      }}
    >
      <View className="flex-row flex-wrap gap-1.5">
        {HORIZONS.map((h) => {
          const active = horizon === h.months;
          return (
            <Pressable
              key={h.months}
              onPress={() => setHorizon(h.months)}
              className="rounded-full border px-2.5 py-1"
              style={{
                backgroundColor: active ? palette.brandPrimary : palette.bgCard,
                borderColor: active ? palette.brandPrimary : palette.borderInteractive,
              }}
            >
              <Text
                className="text-[11px] font-bold"
                style={{ color: active ? palette.onBrandPrimary : palette.textPrimary }}
              >
                {h.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View className="flex-row gap-2">
        {(
          [
            { id: 'weight', label: 'Peso (kg)' },
            { id: 'height', label: 'Altura (cm)' },
          ] as const
        ).map((m) => {
          const active = metric === m.id;
          return (
            <Pressable
              key={m.id}
              onPress={() => setMetric(m.id)}
              className="flex-1 rounded-xl border py-1.5 items-center"
              style={{
                backgroundColor: active ? palette.brandSurface : palette.bgCard,
                borderColor: active ? palette.brandPrimary : palette.borderInteractive,
              }}
            >
              <Text
                className="text-xs font-bold"
                style={{ color: active ? palette.brandText : palette.textSecondary }}
              >
                {m.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View
        className="rounded-xl border p-3 gap-2"
        style={{ backgroundColor: palette.bgCard, borderColor: palette.borderInteractive }}
      >
        <View className="flex-row items-end justify-between gap-1 h-28">
          {curve.map((pt) => {
            const bandBottom = ((pt.p3 - minVal) / (maxVal - minVal)) * 100;
            const bandTop = ((pt.p97 - minVal) / (maxVal - minVal)) * 100;
            const babyAtBucket = points.find(
              (p) => Math.abs(p.ageMonths - pt.month) <= horizon / 10,
            );
            const babyVal =
              metric === 'weight' ? babyAtBucket?.weightKg : babyAtBucket?.heightCm;
            const babyPct =
              babyVal !== undefined
                ? Math.max(4, Math.min(96, ((babyVal - minVal) / (maxVal - minVal)) * 100))
                : null;

            return (
              <View key={pt.month} className="flex-1 items-center h-full justify-end">
                <View className="w-full flex-1 relative items-center justify-end">
                  <View
                    className="w-3/4 rounded-full"
                    style={{
                      position: 'absolute',
                      bottom: `${Math.max(0, bandBottom)}%`,
                      height: `${Math.max(8, bandTop - bandBottom)}%`,
                      backgroundColor: metric === 'weight' ? '#22c55e33' : '#3b82f633',
                    }}
                  />
                  {babyPct !== null ? (
                    <View
                      className="w-2.5 h-2.5 rounded-full border border-white"
                      style={{
                        position: 'absolute',
                        bottom: `${babyPct}%`,
                        backgroundColor: metric === 'weight' ? '#16a34a' : '#2563eb',
                      }}
                    />
                  ) : null}
                </View>
                <Text className="text-[9px]" style={{ color: palette.textMuted }}>
                  {pt.month}m
                </Text>
              </View>
            );
          })}
        </View>
        {latest ? (
          <Text className="text-xs font-semibold" style={{ color: palette.brandText }}>
            Último registro ({latest.dateLabel}):{' '}
            {latest.weightKg !== undefined ? `${latest.weightKg} kg` : '—'} ·{' '}
            {latest.heightCm !== undefined ? `${latest.heightCm} cm` : '—'}
          </Text>
        ) : (
          <Text className="text-[11px]" style={{ color: palette.textSecondary }}>
            Agrega una medición para ver el punto de tu bebé sobre la banda OMS (P3–P97).
          </Text>
        )}
      </View>

      <Text className="text-[11px]" style={{ color: palette.textSecondary }}>
        Estándares de Crecimiento Infantil de la OMS (2006) · Referencia
        educativa; tu pediatra evalúa la curva completa.
      </Text>
    </View>
  );
}
