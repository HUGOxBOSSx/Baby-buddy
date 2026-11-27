import {
  BOTTLE_PRESET_ML,
  MIN_TOUCH_TARGET_PX,
  POOP_COLOR_TAG_OPTIONS,
  computeTimerElapsedSec,
  filterEntriesByDateRange,
  formatTimerClock,
  getWakeWindowGuidanceMx,
  resolveDateRangePreset,
  summarizeDailyLog,
  toLocalDateKey,
  type DateRangePreset,
  type DiaperKind,
  type PoopColorTag,
} from '@baby-buddy/core';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { useThemeContext } from './ThemeProvider';

const RANGE_PRESETS: readonly {
  readonly id: DateRangePreset;
  readonly label: string;
}[] = [
  { id: 'today', label: 'Hoy' },
  { id: 'last_3_days', label: '3 días' },
  { id: 'last_7_days', label: '7 días' },
  { id: 'last_week', label: 'Sem. pasada' },
  { id: 'last_30_days', label: '30 días' },
  { id: 'this_month', label: 'Este mes' },
  { id: 'custom', label: 'Fechas' },
] as const;

function formatEntryTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('es-MX', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function DailyLogPanel() {
  const {
    palette,
    childProfile,
    dailyLogs,
    activeFeedTimer,
    addDailyLogEntry,
    deleteDailyLogEntry,
    startFeedTimer,
    togglePauseFeedTimer,
    saveActiveFeedTimer,
    cancelActiveFeedTimer,
  } = useThemeContext();

  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  const [showBottlePicker, setShowBottlePicker] = useState(false);
  const [bottleMlInput, setBottleMlInput] = useState('90');
  const [pendingDiaperKind, setPendingDiaperKind] = useState<DiaperKind | null>(
    null,
  );
  const [selectedPoopColor, setSelectedPoopColor] =
    useState<PoopColorTag>('mostaza');
  const [retroOffsetMin, setRetroOffsetMin] = useState<0 | 15 | 30 | 60>(0);
  const [noteInput, setNoteInput] = useState('');
  const [sleepStartMs, setSleepStartMs] = useState<number | null>(null);

  const [rangePreset, setRangePreset] = useState<DateRangePreset>('today');
  const [customStart, setCustomStart] = useState<string>(() =>
    toLocalDateKey(new Date()),
  );
  const [customEnd, setCustomEnd] = useState<string>(() =>
    toLocalDateKey(new Date()),
  );
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flashFeedback = useCallback((msg: string) => {
    setSaveFeedback(msg);
    if (feedbackTimerRef.current !== null) {
      clearTimeout(feedbackTimerRef.current);
    }
    feedbackTimerRef.current = setTimeout(() => {
      setSaveFeedback(null);
    }, 3500);
  }, []);

  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current !== null) {
        clearTimeout(feedbackTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if ((!activeFeedTimer || activeFeedTimer.paused) && sleepStartMs === null) {
      return;
    }
    const id = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => clearInterval(id);
  }, [activeFeedTimer, sleepStartMs]);

  const activeRange =
    rangePreset === 'custom'
      ? { startDateKey: customStart, endDateKey: customEnd }
      : resolveDateRangePreset(rangePreset, new Date(nowMs));

  const summary = summarizeDailyLog(dailyLogs, activeRange, new Date(nowMs));
  const entriesInRange = filterEntriesByDateRange(dailyLogs, activeRange);

  const suggestedNextSide =
    summary.lastBreastSide === 'breast_left'
      ? 'breast_right'
      : summary.lastBreastSide === 'breast_right'
        ? 'breast_left'
        : null;

  const timerElapsedSec = activeFeedTimer
    ? computeTimerElapsedSec(activeFeedTimer, nowMs)
    : 0;

  const getEntryTimestampIso = (now: number) =>
    new Date(now - retroOffsetMin * 60_000).toISOString();

  const handleSaveBottle = (mlValue: number) => {
    const safeMl = Math.max(5, Math.min(500, Math.round(mlValue)));
    const now = Date.now();
    addDailyLogEntry({
      id: `feed-${now}`,
      kind: 'feed',
      timestampIso: getEntryTimestampIso(now),
      feedType: 'bottle',
      volumeMl: safeMl,
      noteMx: noteInput.trim() || undefined,
    });
    setShowBottlePicker(false);
    setNoteInput('');
    flashFeedback(`✓ Biberón (${safeMl} ml) guardado`);
  };

  const handleQuickWetDiaper = () => {
    const now = Date.now();
    addDailyLogEntry({
      id: `diaper-${now}`,
      kind: 'diaper',
      timestampIso: getEntryTimestampIso(now),
      diaperKind: 'wet',
      noteMx: noteInput.trim() || undefined,
    });
    setPendingDiaperKind(null);
    setNoteInput('');
    flashFeedback('✓ Pipí guardado');
  };

  const handleSaveDirtyDiaper = () => {
    if (!pendingDiaperKind) return;
    const now = Date.now();
    addDailyLogEntry({
      id: `diaper-${now}`,
      kind: 'diaper',
      timestampIso: getEntryTimestampIso(now),
      diaperKind: pendingDiaperKind,
      poopColor: selectedPoopColor,
      noteMx: noteInput.trim() || undefined,
    });
    flashFeedback(
      pendingDiaperKind === 'both'
        ? '✓ Pipí + Popó guardados'
        : '✓ Popó guardada',
    );
    setPendingDiaperKind(null);
    setNoteInput('');
  };

  const handleSaveSleep = (durationSec: number) => {
    const safeSec = Math.max(60, Math.round(durationSec));
    const now = Date.now();
    addDailyLogEntry({
      id: `sleep-${now}`,
      kind: 'sleep',
      timestampIso: getEntryTimestampIso(now),
      durationSec: safeSec,
      noteMx: noteInput.trim() || undefined,
    });
    setSleepStartMs(null);
    setNoteInput('');
    flashFeedback(`✓ Siesta (${Math.round(safeSec / 60)} min) guardada`);
  };

  const ageMonths = childProfile ? childProfile.ageMonths : 2;
  const wakeGuidance = getWakeWindowGuidanceMx(ageMonths, summary.hoursSinceLastSleep);
  const sleepElapsedSec =
    sleepStartMs !== null ? Math.max(0, Math.floor((nowMs - sleepStartMs) / 1000)) : 0;

  return (
    <View className="gap-4">
      {/* Franja visual "Hace cuánto..." */}
      <View className="flex-row flex-wrap gap-2">
        <View
          className="flex-1 min-w-[100px] rounded-2xl border p-3 gap-0.5"
          style={{ backgroundColor: palette.bgCard, borderColor: palette.borderInteractive }}
        >
          <Text className="text-[10px] font-bold uppercase" style={{ color: palette.textSecondary }}>
            Última toma
          </Text>
          <Text className="text-sm font-extrabold" style={{ color: palette.brandText }}>
            {summary.hoursSinceLastFeed !== null
              ? `Hace ${summary.hoursSinceLastFeed} h`
              : 'Sin registro'}
          </Text>
        </View>
        <View
          className="flex-1 min-w-[100px] rounded-2xl border p-3 gap-0.5"
          style={{ backgroundColor: palette.bgCard, borderColor: palette.borderInteractive }}
        >
          <Text className="text-[10px] font-bold uppercase" style={{ color: palette.textSecondary }}>
            Último pañal
          </Text>
          <Text className="text-sm font-extrabold" style={{ color: palette.textPrimary }}>
            {summary.hoursSinceLastDiaper !== null
              ? `Hace ${summary.hoursSinceLastDiaper} h`
              : 'Sin registro'}
          </Text>
        </View>
        <View
          className="flex-1 min-w-[100px] rounded-2xl border p-3 gap-0.5"
          style={{ backgroundColor: palette.bgCard, borderColor: palette.borderInteractive }}
        >
          <Text className="text-[10px] font-bold uppercase" style={{ color: palette.textSecondary }}>
            Última siesta
          </Text>
          <Text className="text-sm font-extrabold" style={{ color: palette.textPrimary }}>
            {summary.hoursSinceLastSleep !== null
              ? `Hace ${summary.hoursSinceLastSleep} h`
              : 'Sin registro'}
          </Text>
        </View>
      </View>
      <Text className="text-xs px-1" style={{ color: palette.textSecondary }}>
        {wakeGuidance}
      </Text>

      {/* 1-Tap Quick Registration */}
      <View
        className="rounded-2xl border p-4 gap-3"
        style={{
          backgroundColor: palette.bgCard,
          borderColor: palette.borderInteractive,
        }}
      >
        <Text className="text-lg font-bold" style={{ color: palette.textPrimary }}>
          Registro rápido (1 toque)
        </Text>

        {saveFeedback ? (
          <View
            className="rounded-xl border px-3 py-2"
            style={{
              backgroundColor: palette.brandSurface,
              borderColor: palette.brandPrimary,
            }}
          >
            <Text className="text-xs font-bold" style={{ color: palette.brandText }}>
              {saveFeedback}
            </Text>
          </View>
        ) : null}

        {activeFeedTimer ? (
          <View
            className="rounded-2xl border-2 p-3 gap-2"
            style={{
              backgroundColor: palette.brandSurface,
              borderColor: palette.brandPrimary,
            }}
          >
            <Text className="text-xs font-bold uppercase" style={{ color: palette.brandText }}>
              {activeFeedTimer.side === 'breast_left'
                ? 'Toma en curso · Pecho izquierdo'
                : 'Toma en curso · Pecho derecho'}
            </Text>
            <Text className="text-3xl font-extrabold" style={{ color: palette.textPrimary }}>
              {formatTimerClock(timerElapsedSec)}
            </Text>
            <View className="flex-row flex-wrap gap-2">
              <Pressable
                onPress={togglePauseFeedTimer}
                className="rounded-xl border px-4 py-2 justify-center"
                style={{
                  minHeight: MIN_TOUCH_TARGET_PX,
                  backgroundColor: palette.bgCard,
                  borderColor: palette.borderInteractive,
                }}
              >
                <Text className="text-xs font-bold" style={{ color: palette.textPrimary }}>
                  {activeFeedTimer.paused ? 'Reanudar' : 'Pausar'}
                </Text>
              </Pressable>
              <Pressable
                onPress={saveActiveFeedTimer}
                className="rounded-xl px-4 py-2 justify-center"
                style={{
                  minHeight: MIN_TOUCH_TARGET_PX,
                  backgroundColor: palette.brandPrimary,
                }}
              >
                <Text className="text-xs font-bold" style={{ color: palette.onBrandPrimary }}>
                  Guardar toma
                </Text>
              </Pressable>
              <Pressable
                onPress={cancelActiveFeedTimer}
                className="rounded-xl border px-3 py-2 justify-center"
                style={{
                  minHeight: MIN_TOUCH_TARGET_PX,
                  backgroundColor: palette.alertRedSurface,
                  borderColor: palette.alertRed,
                }}
              >
                <Text className="text-xs font-bold" style={{ color: palette.alertRedText }}>
                  Descartar
                </Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        <Text className="text-xs font-bold uppercase" style={{ color: palette.textSecondary }}>
          Tomas
        </Text>
        <View className="flex-row flex-wrap gap-2">
          <Pressable
            onPress={() => startFeedTimer('breast_left')}
            className="flex-1 min-w-[100px] rounded-2xl border-2 px-3 py-3 items-center justify-center"
            style={{
              minHeight: 56,
              backgroundColor: palette.brandSurface,
              borderColor: palette.brandPrimary,
            }}
          >
            <Text className="text-sm font-bold" style={{ color: palette.brandText }}>
              Pecho Izq
            </Text>
            <Text className="text-[11px]" style={{ color: palette.textSecondary }}>
              {suggestedNextSide === 'breast_left' ? 'Sugerido · Timer' : 'Iniciar timer'}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => startFeedTimer('breast_right')}
            className="flex-1 min-w-[100px] rounded-2xl border-2 px-3 py-3 items-center justify-center"
            style={{
              minHeight: 56,
              backgroundColor: palette.brandSurface,
              borderColor: palette.brandPrimary,
            }}
          >
            <Text className="text-sm font-bold" style={{ color: palette.brandText }}>
              Pecho Der
            </Text>
            <Text className="text-[11px]" style={{ color: palette.textSecondary }}>
              {suggestedNextSide === 'breast_right' ? 'Sugerido · Timer' : 'Iniciar timer'}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setShowBottlePicker((v) => !v)}
            className="flex-1 min-w-[100px] rounded-2xl border-2 px-3 py-3 items-center justify-center"
            style={{
              minHeight: 56,
              backgroundColor: palette.bgElevated,
              borderColor: palette.borderInteractive,
            }}
          >
            <Text className="text-sm font-bold" style={{ color: palette.textPrimary }}>
              Biberón (ml)
            </Text>
            <Text className="text-[11px]" style={{ color: palette.textSecondary }}>
              Elegir cantidad
            </Text>
          </Pressable>
        </View>

        {showBottlePicker ? (
          <View
            className="rounded-xl border p-3 gap-2"
            style={{
              backgroundColor: palette.bgElevated,
              borderColor: palette.borderInteractive,
            }}
          >
            <View className="flex-row flex-wrap gap-2">
              {BOTTLE_PRESET_ML.map((ml) => (
                <Pressable
                  key={ml}
                  onPress={() => handleSaveBottle(ml)}
                  className="rounded-xl border px-3 py-2 justify-center"
                  style={{
                    minHeight: MIN_TOUCH_TARGET_PX,
                    backgroundColor: palette.brandSurface,
                    borderColor: palette.brandPrimary,
                  }}
                >
                  <Text className="text-xs font-bold" style={{ color: palette.brandText }}>
                    {ml} ml
                  </Text>
                </Pressable>
              ))}
            </View>
            <View className="flex-row items-center gap-2">
              <TextInput
                value={bottleMlInput}
                onChangeText={setBottleMlInput}
                keyboardType="numeric"
                className="rounded-xl border px-3 py-2 w-24 text-sm"
                style={{
                  minHeight: MIN_TOUCH_TARGET_PX,
                  backgroundColor: palette.bgCard,
                  borderColor: palette.borderInteractive,
                  color: palette.textPrimary,
                }}
              />
              <Pressable
                onPress={() =>
                  handleSaveBottle(Number.parseFloat(bottleMlInput) || 90)
                }
                className="rounded-xl px-4 py-2 justify-center"
                style={{
                  minHeight: MIN_TOUCH_TARGET_PX,
                  backgroundColor: palette.brandPrimary,
                }}
              >
                <Text className="text-xs font-bold" style={{ color: palette.onBrandPrimary }}>
                  Guardar ml
                </Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        <Text className="text-xs font-bold uppercase pt-1" style={{ color: palette.textSecondary }}>
          Pañales y evacuaciones
        </Text>
        <View className="flex-row flex-wrap gap-2">
          <Pressable
            onPress={handleQuickWetDiaper}
            className="flex-1 min-w-[100px] rounded-2xl border-2 px-3 py-3 items-center justify-center"
            style={{
              minHeight: 56,
              backgroundColor: palette.bgElevated,
              borderColor: palette.borderInteractive,
            }}
          >
            <Text className="text-sm font-bold" style={{ color: palette.textPrimary }}>
              Solo Pipí
            </Text>
            <Text className="text-[11px]" style={{ color: palette.textSecondary }}>
              1 toque
            </Text>
          </Pressable>

          <Pressable
            onPress={() =>
              setPendingDiaperKind((k) => (k === 'dirty' ? null : 'dirty'))
            }
            className="flex-1 min-w-[100px] rounded-2xl border-2 px-3 py-3 items-center justify-center"
            style={{
              minHeight: 56,
              backgroundColor:
                pendingDiaperKind === 'dirty'
                  ? palette.brandSurface
                  : palette.bgElevated,
              borderColor:
                pendingDiaperKind === 'dirty'
                  ? palette.brandPrimary
                  : palette.borderInteractive,
            }}
          >
            <Text className="text-sm font-bold" style={{ color: palette.textPrimary }}>
              Solo Popó
            </Text>
            <Text className="text-[11px]" style={{ color: palette.textSecondary }}>
              Color
            </Text>
          </Pressable>

          <Pressable
            onPress={() =>
              setPendingDiaperKind((k) => (k === 'both' ? null : 'both'))
            }
            className="flex-1 min-w-[100px] rounded-2xl border-2 px-3 py-3 items-center justify-center"
            style={{
              minHeight: 56,
              backgroundColor:
                pendingDiaperKind === 'both'
                  ? palette.brandSurface
                  : palette.bgElevated,
              borderColor:
                pendingDiaperKind === 'both'
                  ? palette.brandPrimary
                  : palette.borderInteractive,
            }}
          >
            <Text className="text-sm font-bold" style={{ color: palette.textPrimary }}>
              Pipí + Popó
            </Text>
            <Text className="text-[11px]" style={{ color: palette.textSecondary }}>
              Color
            </Text>
          </Pressable>
        </View>

        {pendingDiaperKind ? (
          <View
            className="rounded-xl border p-3 gap-2"
            style={{
              backgroundColor: palette.bgElevated,
              borderColor: palette.borderInteractive,
            }}
          >
            <Text className="text-xs font-bold" style={{ color: palette.textPrimary }}>
              Color de la popó:
            </Text>
            <View className="flex-row flex-wrap gap-1.5">
              {POOP_COLOR_TAG_OPTIONS.map((opt) => {
                const active = selectedPoopColor === opt.id;
                return (
                  <Pressable
                    key={opt.id}
                    onPress={() => setSelectedPoopColor(opt.id)}
                    className="rounded-full border px-3 py-1.5 justify-center"
                    style={{
                      minHeight: 38,
                      backgroundColor: active
                        ? opt.isAlertColor
                          ? palette.alertRedSurface
                          : palette.brandPrimary
                        : palette.bgCard,
                      borderColor: active
                        ? opt.isAlertColor
                          ? palette.alertRed
                          : palette.brandPrimary
                        : palette.borderInteractive,
                    }}
                  >
                    <Text
                      className="text-xs font-semibold"
                      style={{
                        color: active
                          ? opt.isAlertColor
                            ? palette.alertRedText
                            : palette.onBrandPrimary
                          : palette.textPrimary,
                      }}
                    >
                      {opt.labelMx}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Pressable
              onPress={handleSaveDirtyDiaper}
              className="rounded-xl px-4 py-2 self-start justify-center"
              style={{
                minHeight: MIN_TOUCH_TARGET_PX,
                backgroundColor: palette.brandPrimary,
              }}
            >
              <Text className="text-xs font-bold" style={{ color: palette.onBrandPrimary }}>
                Guardar pañal
              </Text>
            </Pressable>
          </View>
        ) : null}

        <Text className="text-xs font-bold uppercase pt-1" style={{ color: palette.textSecondary }}>
          Sueño y siestas
        </Text>
        {sleepStartMs !== null ? (
          <View
            className="rounded-2xl border-2 p-3 gap-2"
            style={{ backgroundColor: palette.brandSurface, borderColor: palette.brandPrimary }}
          >
            <Text className="text-xs font-bold uppercase" style={{ color: palette.brandText }}>
              Siesta en curso
            </Text>
            <Text className="text-2xl font-extrabold" style={{ color: palette.textPrimary }}>
              {formatTimerClock(sleepElapsedSec)}
            </Text>
            <View className="flex-row gap-2">
              <Pressable
                onPress={() => handleSaveSleep(sleepElapsedSec)}
                className="rounded-xl px-4 py-2 justify-center"
                style={{ minHeight: MIN_TOUCH_TARGET_PX, backgroundColor: palette.brandPrimary }}
              >
                <Text className="text-xs font-bold" style={{ color: palette.onBrandPrimary }}>
                  Guardar siesta
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setSleepStartMs(null)}
                className="rounded-xl border px-3 py-2 justify-center"
                style={{
                  minHeight: MIN_TOUCH_TARGET_PX,
                  backgroundColor: palette.alertRedSurface,
                  borderColor: palette.alertRed,
                }}
              >
                <Text className="text-xs font-bold" style={{ color: palette.alertRedText }}>
                  Cancelar
                </Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <View className="flex-row flex-wrap gap-2">
            <Pressable
              onPress={() => setSleepStartMs(Date.now())}
              className="rounded-xl border-2 px-3 py-2 justify-center"
              style={{
                minHeight: MIN_TOUCH_TARGET_PX,
                backgroundColor: palette.brandSurface,
                borderColor: palette.brandPrimary,
              }}
            >
              <Text className="text-xs font-bold" style={{ color: palette.brandText }}>
                Iniciar siesta
              </Text>
            </Pressable>
            {([30, 60, 90, 120] as const).map((mins) => (
              <Pressable
                key={mins}
                onPress={() => handleSaveSleep(mins * 60)}
                className="rounded-xl border px-3 py-2 justify-center"
                style={{
                  minHeight: MIN_TOUCH_TARGET_PX,
                  backgroundColor: palette.bgElevated,
                  borderColor: palette.borderInteractive,
                }}
              >
                <Text className="text-xs font-bold" style={{ color: palette.textPrimary }}>
                  {mins < 60 ? `${mins} min` : `${mins / 60} h`}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        <View
          className="rounded-xl border p-3 gap-2"
          style={{ backgroundColor: palette.bgElevated, borderColor: palette.borderInteractive }}
        >
          <View className="flex-row flex-wrap items-center gap-1.5">
            <Text className="text-xs font-bold" style={{ color: palette.textSecondary }}>
              Hora:
            </Text>
            {([
              { min: 0, label: 'Ahora' },
              { min: 15, label: '−15m' },
              { min: 30, label: '−30m' },
              { min: 60, label: '−1h' },
            ] as const).map((opt) => {
              const active = retroOffsetMin === opt.min;
              return (
                <Pressable
                  key={opt.min}
                  onPress={() => setRetroOffsetMin(opt.min)}
                  className="rounded-full border px-2.5 py-1"
                  style={{
                    backgroundColor: active ? palette.brandPrimary : palette.bgCard,
                    borderColor: active ? palette.brandPrimary : palette.borderInteractive,
                  }}
                >
                  <Text
                    className="text-xs font-bold"
                    style={{ color: active ? palette.onBrandPrimary : palette.textPrimary }}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <TextInput
            value={noteInput}
            onChangeText={setNoteInput}
            placeholder="Nota opcional (ej. regurgitó, se durmió)"
            placeholderTextColor={palette.textMuted}
            className="rounded-xl border px-3 py-2 text-xs"
            style={{
              minHeight: 40,
              backgroundColor: palette.bgCard,
              borderColor: palette.borderInteractive,
              color: palette.textPrimary,
            }}
          />
        </View>
      </View>

      {/* Summary & Date Range Averages */}
      <View
        className="rounded-2xl border p-4 gap-3"
        style={{
          backgroundColor: palette.bgCard,
          borderColor: palette.borderInteractive,
        }}
      >
        <View>
          <Text className="text-lg font-bold" style={{ color: palette.textPrimary }}>
            Resumen y promedios
          </Text>
          <Text className="text-xs" style={{ color: palette.textSecondary }}>
            {activeRange.startDateKey} a {activeRange.endDateKey} ({summary.daysInRange}{' '}
            {summary.daysInRange === 1 ? 'día' : 'días'})
          </Text>
        </View>

        <View className="flex-row flex-wrap gap-1.5">
          {RANGE_PRESETS.map((preset) => {
            const active = rangePreset === preset.id;
            return (
              <Pressable
                key={preset.id}
                onPress={() => setRangePreset(preset.id)}
                className="rounded-full border px-3 py-1.5 justify-center"
                style={{
                  minHeight: 38,
                  backgroundColor: active
                    ? palette.brandPrimary
                    : palette.bgElevated,
                  borderColor: active
                    ? palette.brandPrimary
                    : palette.borderInteractive,
                }}
              >
                <Text
                  className="text-xs font-bold"
                  style={{
                    color: active ? palette.onBrandPrimary : palette.textPrimary,
                  }}
                >
                  {preset.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {rangePreset === 'custom' ? (
          <View className="flex-row flex-wrap gap-2">
            <TextInput
              value={customStart}
              onChangeText={setCustomStart}
              placeholder="YYYY-MM-DD"
              className="rounded-xl border px-3 py-2 flex-1 min-w-[120px] text-xs"
              style={{
                minHeight: MIN_TOUCH_TARGET_PX,
                backgroundColor: palette.bgElevated,
                borderColor: palette.borderInteractive,
                color: palette.textPrimary,
              }}
            />
            <TextInput
              value={customEnd}
              onChangeText={setCustomEnd}
              placeholder="YYYY-MM-DD"
              className="rounded-xl border px-3 py-2 flex-1 min-w-[120px] text-xs"
              style={{
                minHeight: MIN_TOUCH_TARGET_PX,
                backgroundColor: palette.bgElevated,
                borderColor: palette.borderInteractive,
                color: palette.textPrimary,
              }}
            />
          </View>
        ) : null}

        {summary.hydrationAlertMx ? (
          <View
            className="rounded-xl border p-3"
            style={{
              backgroundColor: palette.alertRedSurface,
              borderColor: palette.alertRed,
            }}
          >
            <Text className="text-xs font-bold" style={{ color: palette.alertRedText }}>
              {summary.hydrationAlertMx}
            </Text>
          </View>
        ) : null}

        {summary.stoolAlertMx ? (
          <View
            className="rounded-xl border p-3"
            style={{
              backgroundColor: palette.alertRedSurface,
              borderColor: palette.alertRed,
            }}
          >
            <Text className="text-xs font-bold" style={{ color: palette.alertRedText }}>
              {summary.stoolAlertMx}
            </Text>
          </View>
        ) : null}

        <View className="flex-row flex-wrap gap-2">
          <View
            className="flex-1 min-w-[140px] rounded-xl border p-3 gap-0.5"
            style={{
              backgroundColor: palette.bgElevated,
              borderColor: palette.borderInteractive,
            }}
          >
            <Text className="text-xs" style={{ color: palette.textSecondary }}>
              Tomas
            </Text>
            <Text className="text-xl font-bold" style={{ color: palette.textPrimary }}>
              {summary.totalFeeds}
            </Text>
            <Text className="text-xs font-semibold" style={{ color: palette.brandText }}>
              Prom: {summary.avgFeedsPerDay} / día
            </Text>
          </View>

          <View
            className="flex-1 min-w-[140px] rounded-xl border p-3 gap-0.5"
            style={{
              backgroundColor: palette.bgElevated,
              borderColor: palette.borderInteractive,
            }}
          >
            <Text className="text-xs" style={{ color: palette.textSecondary }}>
              Pecho / Biberón
            </Text>
            <Text className="text-sm font-bold" style={{ color: palette.textPrimary }}>
              {summary.totalBreastMin} min · {summary.totalBottleMl} ml
            </Text>
            <Text className="text-xs font-semibold" style={{ color: palette.brandText }}>
              {summary.avgBreastMinPerDay} m/d · {summary.avgBottleMlPerDay} ml/d
            </Text>
          </View>

          <View
            className="flex-1 min-w-[140px] rounded-xl border p-3 gap-0.5"
            style={{
              backgroundColor: palette.bgElevated,
              borderColor: palette.borderInteractive,
            }}
          >
            <Text className="text-xs" style={{ color: palette.textSecondary }}>
              Pipí / Popó
            </Text>
            <Text className="text-xl font-bold" style={{ color: palette.textPrimary }}>
              {summary.wetDiapers} / {summary.dirtyDiapers}
            </Text>
            <Text className="text-xs font-semibold" style={{ color: palette.brandText }}>
              Prom: {summary.avgWetDiapersPerDay} / {summary.avgDirtyDiapersPerDay} d
            </Text>
          </View>

          <View
            className="flex-1 min-w-[140px] rounded-xl border p-3 gap-0.5"
            style={{
              backgroundColor: palette.bgElevated,
              borderColor: palette.borderInteractive,
            }}
          >
            <Text className="text-xs" style={{ color: palette.textSecondary }}>
              Sueño / Siestas
            </Text>
            <Text className="text-xl font-bold" style={{ color: palette.textPrimary }}>
              {summary.totalSleeps} ({summary.totalSleepMin} min)
            </Text>
            <Text className="text-xs font-semibold" style={{ color: palette.brandText }}>
              Prom: {summary.avgSleepMinPerDay} min / día
            </Text>
          </View>
        </View>

        <Text className="text-xs font-bold uppercase pt-1" style={{ color: palette.textSecondary }}>
          Registros del periodo ({entriesInRange.length})
        </Text>
        {entriesInRange.slice(0, 10).map((entry) => (
          <View
            key={entry.id}
            className="flex-row items-center justify-between rounded-xl border px-3 py-2"
            style={{
              backgroundColor: palette.bgElevated,
              borderColor: palette.borderInteractive,
            }}
          >
            <View className="flex-1 pr-2">
              <Text className="text-xs font-bold" style={{ color: palette.textPrimary }}>
                {entry.kind === 'feed'
                  ? entry.feedType === 'breast_left'
                    ? `Pecho Izquierdo (${Math.max(1, Math.round((entry.durationSec ?? 0) / 60))} min)`
                    : entry.feedType === 'breast_right'
                      ? `Pecho Derecho (${Math.max(1, Math.round((entry.durationSec ?? 0) / 60))} min)`
                      : `Biberón (${entry.volumeMl ?? 0} ml)`
                  : entry.kind === 'sleep'
                    ? `Siesta (${Math.max(1, Math.round(entry.durationSec / 60))} min)`
                    : entry.diaperKind === 'wet'
                      ? 'Pañal: Pipí'
                      : entry.diaperKind === 'dirty'
                        ? `Pañal: Popó (${entry.poopColor ?? 'normal'})`
                        : `Pañal: Pipí + Popó (${entry.poopColor ?? 'normal'})`}
              </Text>
              <Text className="text-[11px]" style={{ color: palette.textSecondary }}>
                {formatEntryTime(entry.timestampIso)}
                {entry.noteMx ? ` · ${entry.noteMx}` : ''}
              </Text>
            </View>
            <Pressable
              onPress={() => deleteDailyLogEntry(entry.id)}
              className="rounded-lg border px-2.5 py-1 justify-center"
              style={{
                minHeight: 34,
                backgroundColor: palette.bgCard,
                borderColor: palette.borderInteractive,
              }}
            >
              <Text className="text-[11px] font-semibold" style={{ color: palette.textSecondary }}>
                Eliminar
              </Text>
            </Pressable>
          </View>
        ))}
      </View>
    </View>
  );
}
