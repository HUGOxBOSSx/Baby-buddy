import {
  MIN_TOUCH_TARGET_PX,
  MX_VACCINE_CHECKLIST,
  STAGE_SPECS,
  buildPediatricianReportText,
  evaluateTemperatureAlertMx,
  getStageForAgeMonths,
  resolveDateRangePreset,
  summarizeDailyLog,
} from '@baby-buddy/core';
import {
  MILESTONE_DOMAIN_LABELS_MX,
  getMilestonesForStage,
} from '@baby-buddy/content';
import { useState } from 'react';
import { Pressable, Share, Text, TextInput, View } from 'react-native';
import { GrowthChartCard } from './GrowthChartCard';
import { useThemeContext } from './ThemeProvider';

type HealthSubTab = 'fiebre' | 'vacunas' | 'crecimiento' | 'hitos' | 'reporte';

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

  const [subTab, setSubTab] = useState<HealthSubTab>('fiebre');
  const [tempInput, setTempInput] = useState('36.8');
  const [tempNote, setTempNote] = useState('');
  const [medName, setMedName] = useState('');
  const [medDose, setMedDose] = useState('');
  const [weightInput, setWeightInput] = useState('');
  const [heightInput, setHeightInput] = useState('');
  const [headCmInput, setHeadCmInput] = useState('');

  const ageMonths = childProfile ? childProfile.ageMonths : 2;
  const parsedTemp = Number.parseFloat(tempInput);
  const tempAlert =
    Number.isFinite(parsedTemp) && tempInput.trim().length > 0
      ? evaluateTemperatureAlertMx(parsedTemp, ageMonths)
      : null;

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
  const reportText = buildPediatricianReportText({
    profile: childProfile,
    dailySummary3d: summary3d,
    dailySummary7d: summary7d,
    dailySummary30d: summary30d,
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
    addGrowthLog({
      id: `growth-${now}`,
      timestampIso: new Date(now).toISOString(),
      weightKg: Number.isFinite(w) ? Math.round(w * 100) / 100 : undefined,
      heightCm: Number.isFinite(h) ? Math.round(h * 10) / 10 : undefined,
      headCircumferenceCm: Number.isFinite(hc)
        ? Math.round(hc * 10) / 10
        : undefined,
    });
    setWeightInput('');
    setHeightInput('');
    setHeadCmInput('');
  };

  return (
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

      <View className="flex-row flex-wrap gap-1.5">
        {(
          [
            { id: 'fiebre', label: 'Fiebre y meds' },
            { id: 'vacunas', label: 'Vacunas' },
            { id: 'crecimiento', label: 'Crecimiento' },
            { id: 'hitos', label: 'Hitos' },
            { id: 'reporte', label: 'Reporte' },
          ] as const
        ).map((t) => {
          const active = subTab === t.id;
          return (
            <Pressable
              key={t.id}
              onPress={() => setSubTab(t.id)}
              className="rounded-full border px-3 py-1.5 justify-center"
              style={{
                minHeight: 38,
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

      {subTab === 'fiebre' ? (
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

          <Text className="text-xs font-bold pt-2" style={{ color: palette.textPrimary }}>
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
              placeholder="PC (cm)"
              placeholderTextColor={palette.textMuted}
              className="rounded-xl border px-3 py-2 flex-1 min-w-[90px] text-sm"
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
          {healthState.growth.slice(0, 5).map((g) => (
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
                ({g.timestampIso.slice(0, 10)})
              </Text>
              <Pressable onPress={() => deleteGrowthLog(g.id)}>
                <Text className="text-[11px] font-semibold" style={{ color: palette.textSecondary }}>
                  Eliminar
                </Text>
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}

      {subTab === 'hitos' ? (() => {
        const stageId = childProfile
          ? childProfile.stageId
          : getStageForAgeMonths(ageMonths);
        const stageMilestones = getMilestonesForStage(stageId);
        const completedIds = healthState.completedMilestoneIds ?? [];
        const doneCount = stageMilestones.filter((m) =>
          completedIds.includes(m.id),
        ).length;
        return (
          <View className="gap-2">
            <Text className="text-xs font-semibold" style={{ color: palette.brandText }}>
              {doneCount} de {stageMilestones.length} hitos ({STAGE_SPECS[stageId].shortLabel})
            </Text>
            <View
              className="h-2.5 w-full overflow-hidden rounded-full"
              style={{ backgroundColor: palette.bgElevated }}
            >
              <View
                className="h-full rounded-full"
                style={{
                  width: `${Math.round((doneCount / Math.max(1, stageMilestones.length)) * 100)}%`,
                  backgroundColor: palette.brandPrimary,
                }}
              />
            </View>
            {stageMilestones.map((m) => {
              const done = completedIds.includes(m.id);
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
        );
      })() : null}

      {subTab === 'reporte' ? (
        <View className="gap-2">
          <View
            className="rounded-xl border p-3"
            style={{ backgroundColor: palette.bgElevated, borderColor: palette.borderInteractive }}
          >
            <Text className="text-xs" style={{ color: palette.textPrimary }}>
              {reportText}
            </Text>
          </View>
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
      ) : null}
    </View>
  );
}
