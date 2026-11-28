import {
  BABY_EVENT_OPTIONS_MX,
  type EventLogEntry,
  MIN_TOUCH_TARGET_PX,
  MX_VACCINE_CHECKLIST,
  STAGE_SPECS,
  buildPediatricianReportText,
  computeAgeMonthsAtTimestamp,
  evaluateTemperatureAlertMx,
  formatGrowthAgeMx,
  getStageForAgeMonths,
  resolveDateRangePreset,
  summarizeDailyLog,
} from '@baby-buddy/core';
import {
  MILESTONE_DOMAIN_LABELS_MX,
  getMilestonesForStage,
} from '@baby-buddy/content';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, Share, Text, TextInput, View } from 'react-native';
import { GrowthChartCard } from './GrowthChartCard';
import { useThemeContext } from './ThemeProvider';

type HealthSubTab = 'temperatura' | 'medicamentos' | 'vacunas' | 'crecimiento';

export function HealthJournalPanel() {
  const {
    palette,
    childProfile,
    dailyLogs,
    healthState,
    addTemperatureLog,
    deleteTemperatureLog,
    addMedicationLog,
    deleteMedicationLog,
    addGrowthLog,
    deleteGrowthLog,
    toggleVaccineCompleted,
    toggleMilestoneCompleted,
  } = useThemeContext();

  const { tab: paramTab } = useLocalSearchParams<{ readonly tab?: string }>();
  const [subTab, setSubTab] = useState<HealthSubTab>('temperatura');

  useEffect(() => {
    if (
      paramTab === 'temperatura' ||
      paramTab === 'medicamentos' ||
      paramTab === 'vacunas' ||
      paramTab === 'crecimiento'
    ) {
      setSubTab(paramTab);
    }
  }, [paramTab]);
  const [showFullReport, setShowFullReport] = useState(false);
  const [tempInput, setTempInput] = useState('36.8');
  const [tempNote, setTempNote] = useState('');
  const [medName, setMedName] = useState('');
  const [medDose, setMedDose] = useState('');
  const [weightInput, setWeightInput] = useState('');
  const [heightInput, setHeightInput] = useState('');
  const [headCmInput, setHeadCmInput] = useState('');
  const [growthAgeMode, setGrowthAgeMode] = useState<'current' | 'past'>('current');
  const [pastAgeValue, setPastAgeValue] = useState('14');
  const [pastAgeUnit, setPastAgeUnit] = useState<'days' | 'weeks' | 'months'>('days');

  const ageMonths = childProfile ? childProfile.ageMonths : 2;
  const parsedTemp = Number.parseFloat(tempInput);
  const tempAlert =
    Number.isFinite(parsedTemp) && tempInput.trim().length > 0
      ? evaluateTemperatureAlertMx(parsedTemp, ageMonths)
      : null;

  const stageId = childProfile
    ? childProfile.stageId
    : getStageForAgeMonths(ageMonths);
  const stageMilestones = getMilestonesForStage(stageId);
  const completedMilestoneIds = healthState.completedMilestoneIds ?? [];
  const doneMilestonesCount = stageMilestones.filter((m) =>
    completedMilestoneIds.includes(m.id),
  ).length;

  const summaryToday = summarizeDailyLog(
    dailyLogs,
    resolveDateRangePreset('today'),
  );
  const summary3d = summarizeDailyLog(
    dailyLogs,
    resolveDateRangePreset('last_3_days'),
  );
  const summary7d = summarizeDailyLog(
    dailyLogs,
    resolveDateRangePreset('last_7_days'),
  );
  const summary30d = summarizeDailyLog(
    dailyLogs,
    resolveDateRangePreset('last_30_days'),
  );
  const recentEvents = dailyLogs
    .filter((e): e is EventLogEntry => e.kind === 'event')
    .slice(0, 15);
  const latestEvent = recentEvents[0];
  const latestEventLabel = latestEvent
    ? (BABY_EVENT_OPTIONS_MX.find((o) => o.id === latestEvent.eventType)
        ?.labelMx ?? latestEvent.eventType)
    : null;
  const activeDailyAlerts = [
    summaryToday.hydrationAlertMx ?? summary3d.hydrationAlertMx,
    summaryToday.stoolAlertMx ?? summary3d.stoolAlertMx,
  ].filter((a): a is string => Boolean(a));

  const reportText = buildPediatricianReportText({
    profile: childProfile,
    dailySummaryToday: summaryToday,
    dailySummary3d: summary3d,
    dailySummary7d: summary7d,
    dailySummary30d: summary30d,
    recentEvents,
    stageMilestonesSummary: {
      done: doneMilestonesCount,
      total: stageMilestones.length,
      stageLabelMx: STAGE_SPECS[stageId].shortLabel,
    },
    health: healthState,
    generatedAtIso: new Date().toISOString(),
  });

  const handleAddTemp = () => {
    const val = Number.parseFloat(tempInput);
    if (!Number.isFinite(val) || val < 33 || val > 43) return;
    const now = Date.now();
    addTemperatureLog({
      id: `temp-${now}`,
      timestampIso: new Date(now).toISOString(),
      tempC: Math.round(val * 10) / 10,
      noteMx: tempNote.trim() || undefined,
    });
    setTempNote('');
  };

  const handleAddMed = () => {
    if (!medName.trim() || !medDose.trim()) return;
    const now = Date.now();
    addMedicationLog({
      id: `med-${now}`,
      timestampIso: new Date(now).toISOString(),
      nameMx: medName.trim(),
      doseNoteMx: medDose.trim(),
    });
    setMedName('');
    setMedDose('');
  };

  const handleAddGrowth = () => {
    const w = Number.parseFloat(weightInput);
    const h = Number.parseFloat(heightInput);
    const hc = Number.parseFloat(headCmInput);
    if (!Number.isFinite(w) && !Number.isFinite(h) && !Number.isFinite(hc)) {
      return;
    }
    const now = Date.now();
    const birthMs = childProfile?.birthDateIso
      ? new Date(childProfile.birthDateIso).getTime()
      : Number.NaN;
    const currentAgeDays = Number.isFinite(birthMs)
      ? Math.max(0, Math.round((now - birthMs) / 86_400_000))
      : Math.round(ageMonths * 30.4375);

    let ageAtEntryDays = currentAgeDays;
    let ageLabelMx = formatGrowthAgeMx(currentAgeDays);
    let timestampIso = new Date(now).toISOString();

    if (growthAgeMode === 'past') {
      const rawVal = Number.parseFloat(pastAgeValue);
      if (!Number.isFinite(rawVal) || rawVal < 0) return;
      const multiplier =
        pastAgeUnit === 'days' ? 1 : pastAgeUnit === 'weeks' ? 7 : 30.4375;
      ageAtEntryDays = Math.max(0, Math.min(2190, Math.round(rawVal * multiplier)));
      const roundedVal = Math.round(rawVal);
      const unitLabel =
        pastAgeUnit === 'days'
          ? roundedVal === 1
            ? 'día'
            : 'días'
          : pastAgeUnit === 'weeks'
            ? 'sem'
            : roundedVal === 1
              ? 'mes'
              : 'meses';
      ageLabelMx = `${roundedVal} ${unitLabel}`;
      const entryMs = Number.isFinite(birthMs)
        ? birthMs + ageAtEntryDays * 86_400_000
        : now - Math.max(0, currentAgeDays - ageAtEntryDays) * 86_400_000;
      timestampIso = new Date(entryMs).toISOString();
    }

    addGrowthLog({
      id: `growth-${now}`,
      timestampIso,
      weightKg: Number.isFinite(w) ? Math.round(w * 100) / 100 : undefined,
      heightCm: Number.isFinite(h) ? Math.round(h * 10) / 10 : undefined,
      headCircumferenceCm: Number.isFinite(hc)
        ? Math.round(hc * 10) / 10
        : undefined,
      ageAtEntryDays,
      ageLabelMx,
    });
    setWeightInput('');
    setHeightInput('');
    setHeadCmInput('');
  };

  const latestTemp = healthState.temperatures[0];
  const latestGrowth = healthState.growth[0];

  return (
    <View className="gap-4">
      <View
        className="rounded-2xl border p-4 gap-3"
        style={{
          backgroundColor: palette.bgCard,
          borderColor: palette.borderInteractive,
        }}
      >
        <Text className="text-base font-bold" style={{ color: palette.textPrimary }}>
          Bitácora de salud
        </Text>

        <View className="flex-row flex-wrap justify-center gap-1.5">
          {(
            [
              { id: 'temperatura', label: 'Temperatura' },
              { id: 'medicamentos', label: 'Medicamentos' },
              { id: 'vacunas', label: 'Vacunas' },
              { id: 'crecimiento', label: 'Crecimiento' },
            ] as const
          ).map((t) => {
            const active = subTab === t.id;
            return (
              <Pressable
                key={t.id}
                onPress={() => setSubTab(t.id)}
                className="rounded-full border px-3 py-1 justify-center"
                style={{
                  minHeight: 34,
                  backgroundColor: active ? palette.brandPrimary : palette.bgElevated,
                  borderColor: active ? palette.brandPrimary : palette.borderInteractive,
                }}
              >
                <Text
                  className="text-xs font-bold"
                  style={{ color: active ? palette.onBrandPrimary : palette.textPrimary }}
                >
                  {t.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {subTab === 'temperatura' ? (
          <View className="gap-3">
            <Text className="text-xs font-bold" style={{ color: palette.textPrimary }}>
              Temperatura (°C)
            </Text>
            <View className="flex-row flex-wrap gap-2">
              <TextInput
                value={tempInput}
                onChangeText={setTempInput}
                keyboardType="decimal-pad"
                className="rounded-xl border px-3 py-2 w-24 text-sm"
                style={{
                  minHeight: MIN_TOUCH_TARGET_PX,
                  backgroundColor: palette.bgElevated,
                  borderColor: palette.borderInteractive,
                  color: palette.textPrimary,
                }}
              />
              <TextInput
                value={tempNote}
                onChangeText={setTempNote}
                placeholder="Nota (opcional)"
                placeholderTextColor={palette.textMuted}
                className="rounded-xl border px-3 py-2 flex-1 min-w-[120px] text-sm"
                style={{
                  minHeight: MIN_TOUCH_TARGET_PX,
                  backgroundColor: palette.bgElevated,
                  borderColor: palette.borderInteractive,
                  color: palette.textPrimary,
                }}
              />
              <Pressable
                onPress={handleAddTemp}
                className="rounded-xl px-4 py-2 justify-center"
                style={{ minHeight: MIN_TOUCH_TARGET_PX, backgroundColor: palette.brandPrimary }}
              >
                <Text className="text-xs font-bold" style={{ color: palette.onBrandPrimary }}>
                  Guardar °C
                </Text>
              </Pressable>
            </View>
            {tempAlert ? (
              <Text
                className="text-xs font-semibold"
                style={{
                  color:
                    tempAlert.level === 'urgent_911'
                      ? palette.alertRedText
                      : tempAlert.level === 'caution'
                        ? palette.accentWarmText
                        : palette.textSecondary,
                }}
              >
                {tempAlert.messageMx}
              </Text>
            ) : null}
            {healthState.temperatures.slice(0, 4).map((t) => (
              <View
                key={t.id}
                className="flex-row items-center justify-between rounded-xl border px-3 py-2"
                style={{ backgroundColor: palette.bgElevated, borderColor: palette.borderInteractive }}
              >
                <Text className="text-xs flex-1 pr-2" style={{ color: palette.textPrimary }}>
                  {t.tempC.toFixed(1)} °C · {t.timestampIso.slice(0, 16).replace('T', ' ')}
                </Text>
                <Pressable onPress={() => deleteTemperatureLog(t.id)}>
                  <Text className="text-[11px] font-semibold" style={{ color: palette.textSecondary }}>
                    Eliminar
                  </Text>
                </Pressable>
              </View>
            ))}
          </View>
        ) : null}

        {subTab === 'medicamentos' ? (
          <View className="gap-3">
            <Text className="text-xs font-bold" style={{ color: palette.textPrimary }}>
              Medicamentos (según indicación médica)
            </Text>
            <View className="flex-row flex-wrap gap-2">
              <TextInput
                value={medName}
                onChangeText={setMedName}
                placeholder="Medicamento"
                placeholderTextColor={palette.textMuted}
                className="rounded-xl border px-3 py-2 flex-1 min-w-[120px] text-sm"
                style={{
                  minHeight: MIN_TOUCH_TARGET_PX,
                  backgroundColor: palette.bgElevated,
                  borderColor: palette.borderInteractive,
                  color: palette.textPrimary,
                }}
              />
              <TextInput
                value={medDose}
                onChangeText={setMedDose}
                placeholder="Dosis (ml)"
                placeholderTextColor={palette.textMuted}
                className="rounded-xl border px-3 py-2 flex-1 min-w-[100px] text-sm"
                style={{
                  minHeight: MIN_TOUCH_TARGET_PX,
                  backgroundColor: palette.bgElevated,
                  borderColor: palette.borderInteractive,
                  color: palette.textPrimary,
                }}
              />
              <Pressable
                onPress={handleAddMed}
                className="rounded-xl px-4 py-2 justify-center"
                style={{ minHeight: MIN_TOUCH_TARGET_PX, backgroundColor: palette.brandPrimary }}
              >
                <Text className="text-xs font-bold" style={{ color: palette.onBrandPrimary }}>
                  Registrar
                </Text>
              </Pressable>
            </View>
            {healthState.medications.slice(0, 4).map((m) => (
              <View
                key={m.id}
                className="flex-row items-center justify-between rounded-xl border px-3 py-2"
                style={{ backgroundColor: palette.bgElevated, borderColor: palette.borderInteractive }}
              >
                <Text className="text-xs flex-1" style={{ color: palette.textPrimary }}>
                  {m.nameMx} ({m.doseNoteMx})
                </Text>
                <Pressable onPress={() => deleteMedicationLog(m.id)}>
                  <Text className="text-[11px] font-semibold" style={{ color: palette.textSecondary }}>
                    Eliminar
                  </Text>
                </Pressable>
              </View>
            ))}
          </View>
        ) : null}

      {subTab === 'vacunas' ? (
        <View className="gap-2">
          <Text className="text-xs font-semibold" style={{ color: palette.brandText }}>
            {healthState.completedVaccineIds.length} de {MX_VACCINE_CHECKLIST.length} aplicadas
          </Text>
          <View
            className="h-2.5 w-full overflow-hidden rounded-full"
            style={{ backgroundColor: palette.bgElevated }}
          >
            <View
              className="h-full rounded-full"
              style={{
                width: `${Math.round((healthState.completedVaccineIds.length / MX_VACCINE_CHECKLIST.length) * 100)}%`,
                backgroundColor: palette.brandPrimary,
              }}
            />
          </View>
          {MX_VACCINE_CHECKLIST.map((vac) => {
            const done = healthState.completedVaccineIds.includes(vac.id);
            return (
              <Pressable
                key={vac.id}
                onPress={() => toggleVaccineCompleted(vac.id)}
                className="flex-row items-center justify-between rounded-xl border px-3 py-2"
                style={{
                  minHeight: MIN_TOUCH_TARGET_PX,
                  backgroundColor: done ? palette.brandSurface : palette.bgElevated,
                  borderColor: done ? palette.brandPrimary : palette.borderInteractive,
                }}
              >
                <View className="flex-1 pr-2">
                  <Text className="text-xs font-bold" style={{ color: done ? palette.brandText : palette.textPrimary }}>
                    {vac.nameMx}
                  </Text>
                  <Text className="text-[11px]" style={{ color: palette.textSecondary }}>
                    {vac.ageLabelMx}
                  </Text>
                </View>
                <Text className="text-xs font-bold" style={{ color: done ? palette.brandText : palette.textSecondary }}>
                  {done ? '✓ Aplicada' : 'Marcar'}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      {subTab === 'crecimiento' ? (
        <View className="gap-2">
          <GrowthChartCard
            entries={healthState.growth}
            birthDateIso={childProfile?.birthDateIso}
            fallbackAgeMonths={ageMonths}
            sex={childProfile?.sex}
          />
          <View
            className="rounded-xl border p-2.5 gap-2"
            style={{ backgroundColor: palette.bgCard, borderColor: palette.borderInteractive }}
          >
            <View className="flex-row gap-2">
              <Pressable
                onPress={() => setGrowthAgeMode('current')}
                className="flex-1 rounded-full border px-3 py-1.5 items-center justify-center"
                style={{
                  minHeight: 38,
                  backgroundColor:
                    growthAgeMode === 'current' ? palette.brandPrimary : palette.bgElevated,
                  borderColor:
                    growthAgeMode === 'current' ? palette.brandPrimary : palette.borderInteractive,
                }}
              >
                <Text
                  className="text-xs font-bold"
                  style={{
                    color:
                      growthAgeMode === 'current' ? palette.onBrandPrimary : palette.textPrimary,
                  }}
                >
                  Edad actual
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setGrowthAgeMode('past')}
                className="flex-1 rounded-full border px-3 py-1.5 items-center justify-center"
                style={{
                  minHeight: 38,
                  backgroundColor:
                    growthAgeMode === 'past' ? palette.brandPrimary : palette.bgElevated,
                  borderColor:
                    growthAgeMode === 'past' ? palette.brandPrimary : palette.borderInteractive,
                }}
              >
                <Text
                  className="text-xs font-bold"
                  style={{
                    color:
                      growthAgeMode === 'past' ? palette.onBrandPrimary : palette.textPrimary,
                  }}
                >
                  Registro pasado
                </Text>
              </Pressable>
            </View>
            {growthAgeMode === 'past' ? (
              <View className="flex-row items-center gap-1.5">
                <TextInput
                  value={pastAgeValue}
                  onChangeText={setPastAgeValue}
                  keyboardType="numeric"
                  placeholder="Edad"
                  placeholderTextColor={palette.textMuted}
                  className="rounded-xl border px-3 py-1.5 w-16 text-sm"
                  style={{
                    minHeight: 40,
                    backgroundColor: palette.bgElevated,
                    borderColor: palette.borderInteractive,
                    color: palette.textPrimary,
                  }}
                />
                {(
                  [
                    { id: 'days', label: 'Días' },
                    { id: 'weeks', label: 'Semanas' },
                    { id: 'months', label: 'Meses' },
                  ] as const
                ).map((u) => {
                  const active = pastAgeUnit === u.id;
                  return (
                    <Pressable
                      key={u.id}
                      onPress={() => setPastAgeUnit(u.id)}
                      className="flex-1 rounded-xl border py-1.5 items-center justify-center"
                      style={{
                        minHeight: 40,
                        backgroundColor: active ? palette.brandSurface : palette.bgElevated,
                        borderColor: active ? palette.brandPrimary : palette.borderInteractive,
                      }}
                    >
                      <Text
                        className="text-[11px] font-bold"
                        style={{ color: active ? palette.brandText : palette.textSecondary }}
                      >
                        {u.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ) : null}
          </View>
          <View className="flex-row flex-wrap gap-2">
            <TextInput
              value={weightInput}
              onChangeText={setWeightInput}
              keyboardType="decimal-pad"
              placeholder="Peso (kg)"
              placeholderTextColor={palette.textMuted}
              className="rounded-xl border px-3 py-2 flex-1 min-w-[100px] text-sm"
              style={{
                minHeight: MIN_TOUCH_TARGET_PX,
                backgroundColor: palette.bgElevated,
                borderColor: palette.borderInteractive,
                color: palette.textPrimary,
              }}
            />
            <TextInput
              value={heightInput}
              onChangeText={setHeightInput}
              keyboardType="decimal-pad"
              placeholder="Talla (cm)"
              placeholderTextColor={palette.textMuted}
              className="rounded-xl border px-3 py-2 flex-1 min-w-[90px] text-sm"
              style={{
                minHeight: MIN_TOUCH_TARGET_PX,
                backgroundColor: palette.bgElevated,
                borderColor: palette.borderInteractive,
                color: palette.textPrimary,
              }}
            />
            <TextInput
              value={headCmInput}
              onChangeText={setHeadCmInput}
              keyboardType="decimal-pad"
              placeholder="Cabeza (cm) · opcional"
              placeholderTextColor={palette.textMuted}
              className="rounded-xl border px-3 py-2 flex-1 min-w-[150px] text-sm"
              style={{
                minHeight: MIN_TOUCH_TARGET_PX,
                backgroundColor: palette.bgElevated,
                borderColor: palette.borderInteractive,
                color: palette.textPrimary,
              }}
            />
            <Pressable
              onPress={handleAddGrowth}
              className="rounded-xl px-4 py-2 justify-center"
              style={{ minHeight: MIN_TOUCH_TARGET_PX, backgroundColor: palette.brandPrimary }}
            >
              <Text className="text-xs font-bold" style={{ color: palette.onBrandPrimary }}>
                Guardar
              </Text>
            </Pressable>
          </View>
          {healthState.growth.slice(0, 5).map((g) => {
            const itemAgeLabel =
              g.ageLabelMx ??
              formatGrowthAgeMx(
                computeAgeMonthsAtTimestamp(
                  childProfile?.birthDateIso,
                  g.timestampIso,
                  ageMonths,
                ) * 30.4375,
              );
            return (
              <View
                key={g.id}
                className="flex-row items-center justify-between rounded-xl border px-3 py-2"
                style={{ backgroundColor: palette.bgElevated, borderColor: palette.borderInteractive }}
              >
                <Text className="text-xs flex-1 pr-2" style={{ color: palette.textPrimary }}>
                  {g.weightKg !== undefined ? `${g.weightKg} kg` : '—'} ·{' '}
                  {g.heightCm !== undefined ? `${g.heightCm} cm` : '—'}
                  {g.headCircumferenceCm !== undefined
                    ? ` · ${g.headCircumferenceCm} cm PC`
                    : ''}{' '}
                  ({g.timestampIso.slice(0, 10)} · {itemAgeLabel})
                </Text>
                <Pressable onPress={() => deleteGrowthLog(g.id)}>
                  <Text className="text-[11px] font-semibold" style={{ color: palette.textSecondary }}>
                    Eliminar
                  </Text>
                </Pressable>
              </View>
            );
          })}
        </View>
      ) : null}
      </View>

      {/* Sección separada: Hitos del desarrollo */}
      <View
        className="rounded-2xl border p-4 gap-2.5"
        style={{
          backgroundColor: palette.bgCard,
          borderColor: palette.borderInteractive,
        }}
      >
        <View className="flex-row items-center justify-between gap-2">
          <Text className="text-base font-bold" style={{ color: palette.textPrimary }}>
            Hitos del desarrollo
          </Text>
          <Text className="text-xs font-semibold" style={{ color: palette.brandText }}>
            {doneMilestonesCount} de {stageMilestones.length} ({STAGE_SPECS[stageId].shortLabel})
          </Text>
        </View>
        <View
          className="h-2.5 w-full overflow-hidden rounded-full"
          style={{ backgroundColor: palette.bgElevated }}
        >
          <View
            className="h-full rounded-full"
            style={{
              width: `${Math.round((doneMilestonesCount / Math.max(1, stageMilestones.length)) * 100)}%`,
              backgroundColor: palette.brandPrimary,
            }}
          />
        </View>
        {stageMilestones.map((m) => {
          const done = completedMilestoneIds.includes(m.id);
          return (
            <Pressable
              key={m.id}
              onPress={() => toggleMilestoneCompleted(m.id)}
              className="rounded-xl border p-3 gap-1"
              style={{
                minHeight: MIN_TOUCH_TARGET_PX,
                backgroundColor: done ? palette.brandSurface : palette.bgElevated,
                borderColor: done ? palette.brandPrimary : palette.borderInteractive,
              }}
            >
              <View className="flex-row items-center justify-between gap-2">
                <Text className="text-xs font-bold flex-1" style={{ color: palette.textPrimary }}>
                  {m.titleMx}
                </Text>
                <Text className="text-xs font-bold" style={{ color: done ? palette.brandText : palette.textSecondary }}>
                  {done ? '✓ Logrado' : 'Marcar'}
                </Text>
              </View>
              <Text className="text-[11px] font-semibold" style={{ color: palette.textSecondary }}>
                {MILESTONE_DOMAIN_LABELS_MX[m.domain]} · {m.ageLabelMx}
              </Text>
              <Text className="text-xs" style={{ color: palette.textSecondary }}>
                {m.activityMx}
              </Text>
              <Text className="text-[11px]" style={{ color: palette.textMuted }}>
                {m.watchForMx}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Sección separada: Reporte para pediatra */}
      <View
        className="rounded-2xl border-2 p-4 gap-3"
        style={{
          backgroundColor: palette.bgCard,
          borderColor: palette.brandPrimary,
        }}
      >
        <View className="gap-0.5">
          <Text className="text-base font-bold" style={{ color: palette.textPrimary }}>
            Reporte para pediatra
          </Text>
          <Text className="text-xs" style={{ color: palette.textSecondary }}>
            Resumen listo para tu consulta con registros de hoy, promedios, eventos, crecimiento, vacunas e hitos.
          </Text>
        </View>

        {activeDailyAlerts.length > 0 ? (
          <View
            className="rounded-xl border p-3 gap-1"
            style={{ backgroundColor: palette.alertRedSurface, borderColor: palette.alertRed }}
          >
            <Text className="text-xs font-bold" style={{ color: palette.alertRedText }}>
              Alertas activas del registro diario
            </Text>
            {activeDailyAlerts.map((alert, idx) => (
              <Text key={idx} className="text-xs" style={{ color: palette.alertRedText }}>
                • {alert}
              </Text>
            ))}
          </View>
        ) : null}

        <View
          className="rounded-xl border p-3 gap-1"
          style={{ backgroundColor: palette.bgElevated, borderColor: palette.borderInteractive }}
        >
          <Text className="text-xs font-bold text-center" style={{ color: palette.textPrimary }}>
            Hoy: {summaryToday.totalFeeds} tomas · Prom.: {summary3d.avgFeedsPerDay}/d (3d) · {summary7d.avgFeedsPerDay}/d (7d) · {summary30d.avgFeedsPerDay}/d (30d)
          </Text>
          <Text className="text-xs text-center" style={{ color: palette.textSecondary }}>
            Eventos: {recentEvents.length}{' '}
            {latestEvent && latestEventLabel
              ? `(último: ${latestEventLabel})`
              : '(sin eventos recientes)'}
          </Text>
          <Text className="text-xs text-center" style={{ color: palette.textSecondary }}>
            Crecimiento:{' '}
            {latestGrowth
              ? `${latestGrowth.weightKg !== undefined ? `${latestGrowth.weightKg} kg` : '—'} · ${latestGrowth.heightCm !== undefined ? `${latestGrowth.heightCm} cm` : '—'}${latestGrowth.headCircumferenceCm !== undefined ? ` · Cabeza ${latestGrowth.headCircumferenceCm} cm` : ''}`
              : 'Sin mediciones'}{' '}
            · Temp.: {latestTemp ? `${latestTemp.tempC.toFixed(1)} °C` : '—'}
          </Text>
          <Text className="text-xs text-center" style={{ color: palette.textSecondary }}>
            Vacunas MX: {healthState.completedVaccineIds.length}/{MX_VACCINE_CHECKLIST.length} · Meds: {healthState.medications.length} · Hitos: {doneMilestonesCount}/{stageMilestones.length}
          </Text>
        </View>

        <Pressable
          onPress={() => setShowFullReport((v) => !v)}
          className="rounded-xl border px-3 py-2 items-center justify-center"
          style={{
            minHeight: 40,
            backgroundColor: palette.bgElevated,
            borderColor: palette.borderInteractive,
          }}
        >
          <Text className="text-xs font-bold" style={{ color: palette.brandText }}>
            {showFullReport ? 'Ocultar vista previa' : 'Ver reporte completo'}
          </Text>
        </Pressable>

        {showFullReport ? (
          <View
            className="rounded-xl border p-3"
            style={{ backgroundColor: palette.bgElevated, borderColor: palette.borderInteractive }}
          >
            <Text className="text-xs" style={{ color: palette.textPrimary }}>
              {reportText}
            </Text>
          </View>
        ) : null}

        <Pressable
          onPress={() => {
            void Share.share({ message: reportText });
          }}
          className="rounded-xl px-4 py-3 items-center justify-center"
          style={{ minHeight: MIN_TOUCH_TARGET_PX, backgroundColor: palette.brandPrimary }}
        >
          <Text className="text-xs font-bold" style={{ color: palette.onBrandPrimary }}>
            Compartir reporte para pediatra
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
