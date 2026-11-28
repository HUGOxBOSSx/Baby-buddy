import {
  BABY_EVENT_OPTIONS_MX,
  BOTTLE_PRESET_ML,
  MIN_TOUCH_TARGET_PX,
  POOP_COLOR_TAG_OPTIONS,
  computeLocalRemindersMx,
  computeTimerElapsedSec,
  filterEntriesByDateRange,
  formatRetroOffsetLabelMx,
  formatTimerClock,
  getWakeWindowGuidanceMx,
  resolveDateRangePreset,
  suggestNextNapWindowMx,
  summarizeDailyLog,
  toLocalDateKey,
  type BabyEventKind,
  type DateRangePreset,
  type DiaperKind,
  type PoopColorTag,
} from '@baby-buddy/core';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useThemeContext } from './ThemeProvider';

const OZ_PRESETS = [1, 2, 3, 4, 5, 6] as const;

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
  const router = useRouter();
  const {
    palette,
    childProfile,
    dailyLogs,
    healthState,
    activeFeedTimer,
    activeSleepStartMs,
    addDailyLogEntry,
    deleteDailyLogEntry,
    startFeedTimer,
    togglePauseFeedTimer,
    saveActiveFeedTimer,
    cancelActiveFeedTimer,
    startSleepTimer,
    saveActiveSleepTimer,
    cancelSleepTimer,
  } = useThemeContext();

  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  const [showBottlePicker, setShowBottlePicker] = useState(false);
  const [bottleMlInput, setBottleMlInput] = useState('90');
  const [showPumpingPicker, setShowPumpingPicker] = useState(false);
  const [pumpingMlInput, setPumpingMlInput] = useState('90');
  const [volumeUnit, setVolumeUnit] = useState<'ml' | 'oz'>('ml');
  const [showSolidsPicker, setShowSolidsPicker] = useState(false);
  const [solidsFoodInput, setSolidsFoodInput] = useState('');
  const [solidsIsNew, setSolidsIsNew] = useState(false);
  const [pendingDiaperKind, setPendingDiaperKind] = useState<DiaperKind | null>(
    null,
  );
  const [selectedPoopColor, setSelectedPoopColor] =
    useState<PoopColorTag>('mostaza');
  const [retroOffsetMin, setRetroOffsetMin] = useState<number>(0);
  const [customRetroOpen, setCustomRetroOpen] = useState(false);
  const [sliderWidth, setSliderWidth] = useState(240);

  const [rangePreset, setRangePreset] = useState<DateRangePreset>('today');
  const [customStart, setCustomStart] = useState<string>(() =>
    toLocalDateKey(new Date()),
  );
  const [customEnd, setCustomEnd] = useState<string>(() =>
    toLocalDateKey(new Date()),
  );
  const [saveFeedback, setSaveFeedback] = useState<{
    readonly section: 'feed' | 'diaper' | 'sleep' | 'event';
    readonly message: string;
  } | null>(null);
  const [remindersDismissed, setRemindersDismissed] = useState(false);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flashFeedback = useCallback(
    (section: 'feed' | 'diaper' | 'sleep' | 'event', message: string) => {
      setSaveFeedback({ section, message });
      if (feedbackTimerRef.current !== null) {
        clearTimeout(feedbackTimerRef.current);
      }
      feedbackTimerRef.current = setTimeout(() => {
        setSaveFeedback(null);
      }, 3500);
    },
    [],
  );

  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current !== null) {
        clearTimeout(feedbackTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if ((!activeFeedTimer || activeFeedTimer.paused) && activeSleepStartMs === null) {
      return;
    }
    const id = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => clearInterval(id);
  }, [activeFeedTimer, activeSleepStartMs]);

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

  const handleSaveBottle = (rawValue: number) => {
    const mlVal = volumeUnit === 'oz' ? Math.round(rawValue * 29.5735) : rawValue;
    const safeMl = Math.max(5, Math.min(500, Math.round(mlVal)));
    const now = Date.now();
    addDailyLogEntry({
      id: `feed-${now}`,
      kind: 'feed',
      timestampIso: getEntryTimestampIso(now),
      feedType: 'bottle',
      volumeMl: safeMl,
    });
    setShowBottlePicker(false);
    flashFeedback('feed', `✓ Biberón (${safeMl} ml) guardado`);
  };

  const handleSavePumping = (rawValue: number) => {
    const mlVal = volumeUnit === 'oz' ? Math.round(rawValue * 29.5735) : rawValue;
    const safeMl = Math.max(5, Math.min(500, Math.round(mlVal)));
    const now = Date.now();
    addDailyLogEntry({
      id: `pump-${now}`,
      kind: 'feed',
      timestampIso: getEntryTimestampIso(now),
      feedType: 'pumping',
      volumeMl: safeMl,
    });
    setShowPumpingPicker(false);
    flashFeedback('feed', `✓ Extracción (${safeMl} ml) guardada`);
  };

  const handleSaveSolids = () => {
    const food = solidsFoodInput.trim();
    if (!food) return;
    const now = Date.now();
    addDailyLogEntry({
      id: `solid-${now}`,
      kind: 'feed',
      timestampIso: getEntryTimestampIso(now),
      feedType: 'solids',
      foodMx: food,
      isNewFood: solidsIsNew,
    });
    setSolidsFoodInput('');
    setSolidsIsNew(false);
    setShowSolidsPicker(false);
    flashFeedback('feed', `✓ Sólidos (${food}) guardados`);
  };

  const handleQuickWetDiaper = () => {
    const now = Date.now();
    addDailyLogEntry({
      id: `diaper-${now}`,
      kind: 'diaper',
      timestampIso: getEntryTimestampIso(now),
      diaperKind: 'wet',
    });
    setPendingDiaperKind(null);
    flashFeedback('diaper', '✓ Pipí guardado');
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
    });
    flashFeedback(
      'diaper',
      pendingDiaperKind === 'both'
        ? '✓ Pipí + Popó guardados'
        : '✓ Popó guardada',
    );
    setPendingDiaperKind(null);
  };

  const handleSaveSleep = (durationSec: number) => {
    const safeSec = Math.max(60, Math.round(durationSec));
    const now = Date.now();
    addDailyLogEntry({
      id: `sleep-${now}`,
      kind: 'sleep',
      timestampIso: getEntryTimestampIso(now),
      durationSec: safeSec,
    });
    flashFeedback('sleep', `✓ Siesta (${Math.round(safeSec / 60)} min) guardada`);
  };

  const handleQuickEvent = (eventType: BabyEventKind, labelMx: string) => {
    const now = Date.now();
    addDailyLogEntry({
      id: `event-${now}`,
      kind: 'event',
      timestampIso: getEntryTimestampIso(now),
      eventType,
    });
    flashFeedback('event', `✓ ${labelMx} registrado`);
  };

  const ageMonths = childProfile ? childProfile.ageMonths : 2;
  const wakeGuidance = getWakeWindowGuidanceMx(ageMonths, summary.hoursSinceLastSleep);
  const napSuggestion = suggestNextNapWindowMx(
    ageMonths,
    summary.lastSleepIso,
    new Date(nowMs),
  );
  const reminders = computeLocalRemindersMx({
    profile: childProfile,
    dailySummary: summary,
    healthState,
    now: new Date(nowMs),
  });
  const sleepElapsedSec =
    activeSleepStartMs !== null
      ? Math.max(0, Math.floor((nowMs - activeSleepStartMs) / 1000))
      : 0;

  return (
    <View className="gap-4">
      {/* Franja visual "Hace cuánto..." */}
      <View className="flex-row gap-2">
        <View
          className="flex-1 rounded-2xl border p-2.5 gap-0.5"
          style={{ backgroundColor: palette.bgCard, borderColor: palette.borderInteractive }}
        >
          <Text className="text-[10px] font-bold uppercase text-center" style={{ color: palette.textSecondary }}>
            Última toma
          </Text>
          <Text className="text-sm font-extrabold text-center" style={{ color: palette.brandText }}>
            {summary.hoursSinceLastFeed !== null
              ? `Hace ${summary.hoursSinceLastFeed} h`
              : 'Sin registro'}
          </Text>
        </View>
        <View
          className="flex-1 rounded-2xl border p-2.5 gap-0.5"
          style={{ backgroundColor: palette.bgCard, borderColor: palette.borderInteractive }}
        >
          <Text className="text-[10px] font-bold uppercase text-center" style={{ color: palette.textSecondary }}>
            Último pañal
          </Text>
          <Text className="text-sm font-extrabold text-center" style={{ color: palette.textPrimary }}>
            {summary.hoursSinceLastDiaper !== null
              ? `Hace ${summary.hoursSinceLastDiaper} h`
              : 'Sin registro'}
          </Text>
        </View>
        <View
          className="flex-1 rounded-2xl border p-2.5 gap-0.5"
          style={{ backgroundColor: palette.bgCard, borderColor: palette.borderInteractive }}
        >
          <Text className="text-[10px] font-bold uppercase text-center" style={{ color: palette.textSecondary }}>
            Última siesta
          </Text>
          <Text className="text-sm font-extrabold text-center" style={{ color: palette.textPrimary }}>
            {summary.hoursSinceLastSleep !== null
              ? `Hace ${summary.hoursSinceLastSleep} h`
              : 'Sin registro'}
          </Text>
        </View>
      </View>
      <Text className="text-xs px-1 text-center" style={{ color: palette.textSecondary }}>
        {wakeGuidance}
      </Text>
      <Text className="text-xs font-semibold px-1 text-center" style={{ color: palette.brandText }}>
        {napSuggestion}
      </Text>

      {/* Recordatorios locales compactos */}
      {!remindersDismissed && reminders.length > 0 ? (
        <View
          className="rounded-2xl border p-3.5 gap-1.5"
          style={{
            backgroundColor: palette.bgElevated,
            borderColor: palette.borderInteractive,
          }}
        >
          <View className="flex-row items-center justify-between gap-2">
            <Text className="text-xs font-bold" style={{ color: palette.textPrimary }}>
              Recordatorios locales
            </Text>
            <Pressable onPress={() => setRemindersDismissed(true)}>
              <Text className="text-[11px] font-semibold" style={{ color: palette.textSecondary }}>
                Ocultar
              </Text>
            </Pressable>
          </View>
          {reminders.slice(0, 2).map((rem) => (
            <View key={rem.id} className="flex-row items-center justify-between gap-2">
              <Text className="text-xs flex-1" style={{ color: palette.textSecondary }}>
                <Text
                  className="font-bold"
                  style={{
                    color:
                      rem.urgency === 'due'
                        ? palette.accentWarmText
                        : palette.brandText,
                  }}
                >
                  {rem.titleMx}:{' '}
                </Text>
                {rem.detailMx}
              </Text>
              {rem.kind === 'vaccine' ? (
                <Pressable
                  onPress={() =>
                    router.push({
                      pathname: '/(tabs)/salud',
                      params: { tab: 'vacunas' },
                    })
                  }
                  hitSlop={6}
                  className="rounded-lg border px-2.5 py-1 justify-center"
                  style={{
                    minHeight: 32,
                    backgroundColor: palette.brandSurface,
                    borderColor: palette.brandPrimary,
                  }}
                >
                  <Text className="text-[11px] font-bold" style={{ color: palette.brandText }}>
                    Ir a vacunas →
                  </Text>
                </Pressable>
              ) : null}
            </View>
          ))}
        </View>
      ) : null}

      {/* 1-Tap Quick Registration */}
      <View
        className="rounded-2xl border p-4 gap-3"
        style={{
          backgroundColor: palette.bgCard,
          borderColor: palette.borderInteractive,
        }}
      >
        <Text className="text-base font-bold" style={{ color: palette.textPrimary }}>
          Registro rápido
        </Text>

        <View className="gap-2.5 pb-2 border-b" style={{ borderBottomColor: palette.borderInteractive }}>
          <View className="flex-row flex-wrap items-center justify-center gap-1.5">
            <Text className="text-xs font-bold" style={{ color: palette.textSecondary }}>
              Hora:
            </Text>
            {([
              { min: 0, label: 'Ahora' },
              { min: 5, label: '−5m' },
              { min: 10, label: '−10m' },
              { min: 20, label: '−20m' },
              { min: 30, label: '−30m' },
            ] as const).map((opt) => {
              const active = !customRetroOpen && retroOffsetMin === opt.min;
              return (
                <Pressable
                  key={opt.min}
                  onPress={() => {
                    setRetroOffsetMin(opt.min);
                    setCustomRetroOpen(false);
                  }}
                  className="rounded-full border px-2.5 py-1"
                  style={{
                    backgroundColor: active ? palette.brandPrimary : palette.bgElevated,
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
            <Pressable
              onPress={() => setCustomRetroOpen((v) => !v)}
              className="rounded-full border px-2.5 py-1"
              style={{
                backgroundColor: customRetroOpen ? palette.brandPrimary : palette.bgElevated,
                borderColor: customRetroOpen ? palette.brandPrimary : palette.borderInteractive,
              }}
            >
              <Text
                className="text-xs font-bold"
                style={{
                  color: customRetroOpen ? palette.onBrandPrimary : palette.brandText,
                }}
              >
                {customRetroOpen && retroOffsetMin > 0
                  ? formatRetroOffsetLabelMx(retroOffsetMin)
                  : 'Personalizado'}
              </Text>
            </Pressable>
          </View>
          {customRetroOpen ? (
            <View
              className="rounded-xl border p-3 gap-2"
              style={{
                backgroundColor: palette.bgElevated,
                borderColor: palette.borderInteractive,
              }}
            >
              <View className="flex-row items-center justify-between">
                <Text className="text-xs font-semibold" style={{ color: palette.textSecondary }}>
                  Tiempo atrás (hasta 5 h):
                </Text>
                <Text className="text-xs font-bold" style={{ color: palette.brandText }}>
                  {formatRetroOffsetLabelMx(retroOffsetMin)}
                </Text>
              </View>
              <View
                onLayout={(e) => setSliderWidth(Math.max(1, e.nativeEvent.layout.width))}
                onStartShouldSetResponder={() => true}
                onMoveShouldSetResponder={() => true}
                onResponderGrant={(e) => {
                  const pct = Math.max(0, Math.min(1, e.nativeEvent.locationX / sliderWidth));
                  setRetroOffsetMin(Math.round(pct * 60) * 5);
                }}
                onResponderMove={(e) => {
                  const pct = Math.max(0, Math.min(1, e.nativeEvent.locationX / sliderWidth));
                  setRetroOffsetMin(Math.round(pct * 60) * 5);
                }}
                className="h-9 justify-center"
              >
                <View
                  className="h-2 rounded-full overflow-hidden"
                  style={{ backgroundColor: palette.bgCard }}
                >
                  <View
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.round((retroOffsetMin / 300) * 100)}%`,
                      backgroundColor: palette.brandPrimary,
                    }}
                  />
                </View>
              </View>
              <View className="flex-row justify-between gap-2">
                <Pressable
                  onPress={() => setRetroOffsetMin((m) => Math.max(0, m - 15))}
                  className="rounded-lg border px-3 py-1"
                  style={{ backgroundColor: palette.bgCard, borderColor: palette.borderInteractive }}
                >
                  <Text className="text-xs font-bold" style={{ color: palette.textPrimary }}>
                    −15m
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setRetroOffsetMin((m) => Math.min(300, m + 15))}
                  className="rounded-lg border px-3 py-1"
                  style={{ backgroundColor: palette.bgCard, borderColor: palette.borderInteractive }}
                >
                  <Text className="text-xs font-bold" style={{ color: palette.textPrimary }}>
                    +15m
                  </Text>
                </Pressable>
              </View>
            </View>
          ) : null}
        </View>

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
            <View className="flex-row flex-wrap justify-center gap-2">
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
                onPress={() => {
                  saveActiveFeedTimer();
                  flashFeedback('feed', '✓ Toma guardada');
                }}
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
        {saveFeedback?.section === 'feed' ? (
          <View
            className="rounded-xl border-2 px-4 py-3"
            style={{
              backgroundColor: palette.brandSurface,
              borderColor: palette.brandPrimary,
            }}
          >
            <Text className="text-sm font-bold text-center" style={{ color: palette.brandText }}>
              {saveFeedback.message}
            </Text>
          </View>
        ) : null}
        <View className="flex-row gap-2">
          <Pressable
            onPress={() => startFeedTimer('breast_left')}
            hitSlop={5}
            className="flex-1 rounded-xl border px-2 py-1.5 items-center justify-center"
            style={{
              minHeight: 44,
              backgroundColor: palette.brandSurface,
              borderColor: palette.brandPrimary,
            }}
          >
            <Text className="text-sm font-bold text-center" style={{ color: palette.brandText }}>
              Pecho izquierdo
            </Text>
            {suggestedNextSide === 'breast_left' ? (
              <Text className="text-[10px] font-bold text-center" style={{ color: palette.brandText }}>
                Sugerido
              </Text>
            ) : null}
          </Pressable>

          <Pressable
            onPress={() => startFeedTimer('breast_right')}
            hitSlop={5}
            className="flex-1 rounded-xl border px-2 py-1.5 items-center justify-center"
            style={{
              minHeight: 44,
              backgroundColor: palette.brandSurface,
              borderColor: palette.brandPrimary,
            }}
          >
            <Text className="text-sm font-bold text-center" style={{ color: palette.brandText }}>
              Pecho derecho
            </Text>
            {suggestedNextSide === 'breast_right' ? (
              <Text className="text-[10px] font-bold text-center" style={{ color: palette.brandText }}>
                Sugerido
              </Text>
            ) : null}
          </Pressable>
        </View>

        <View className="flex-row gap-2">
          <Pressable
            onPress={() => {
              setShowBottlePicker((v) => !v);
              setShowPumpingPicker(false);
              setShowSolidsPicker(false);
            }}
            hitSlop={5}
            className="flex-1 rounded-xl border px-2 py-1.5 items-center justify-center"
            style={{
              minHeight: 38,
              backgroundColor: showBottlePicker ? palette.brandSurface : palette.bgElevated,
              borderColor: showBottlePicker ? palette.brandPrimary : palette.borderInteractive,
            }}
          >
            <Text
              className="text-xs font-bold"
              style={{ color: showBottlePicker ? palette.brandText : palette.textPrimary }}
            >
              Biberón
            </Text>
          </Pressable>
          <Pressable
            onPress={() => {
              setShowPumpingPicker((v) => !v);
              setShowBottlePicker(false);
              setShowSolidsPicker(false);
            }}
            hitSlop={5}
            className="flex-1 rounded-xl border px-3 py-1.5 items-center justify-center"
            style={{
              minHeight: 38,
              backgroundColor: showPumpingPicker ? palette.brandSurface : palette.bgElevated,
              borderColor: showPumpingPicker ? palette.brandPrimary : palette.borderInteractive,
            }}
          >
            <Text
              className="text-xs font-bold"
              style={{ color: showPumpingPicker ? palette.brandText : palette.textPrimary }}
            >
              Extracción
            </Text>
          </Pressable>
        </View>

        <Pressable
          onPress={() => {
            setShowSolidsPicker((v) => !v);
            setShowBottlePicker(false);
            setShowPumpingPicker(false);
          }}
          hitSlop={5}
          className="rounded-xl border px-3 py-1.5 items-center justify-center"
          style={{
            minHeight: 38,
            backgroundColor: showSolidsPicker ? palette.brandSurface : palette.bgElevated,
            borderColor: showSolidsPicker ? palette.brandPrimary : palette.borderInteractive,
          }}
        >
          <Text
            className="text-xs font-bold"
            style={{ color: showSolidsPicker ? palette.brandText : palette.textPrimary }}
          >
            Sólidos / comida
          </Text>
        </Pressable>

        {showPumpingPicker ? (
          <View
            className="rounded-xl border p-3 gap-2"
            style={{
              backgroundColor: palette.bgElevated,
              borderColor: palette.borderInteractive,
            }}
          >
            <View className="flex-row items-center justify-between">
              <Text className="text-xs font-bold" style={{ color: palette.textPrimary }}>
                Extracción:
              </Text>
              <View className="flex-row gap-1">
                {(['ml', 'oz'] as const).map((unit) => (
                  <Pressable
                    key={`pump-u-${unit}`}
                    onPress={() => {
                      setVolumeUnit(unit);
                      setPumpingMlInput(unit === 'ml' ? '90' : '3');
                    }}
                    className="rounded-lg border px-2.5 py-1"
                    style={{
                      backgroundColor: volumeUnit === unit ? palette.brandPrimary : palette.bgCard,
                      borderColor:
                        volumeUnit === unit ? palette.brandPrimary : palette.borderInteractive,
                    }}
                  >
                    <Text
                      className="text-xs font-bold"
                      style={{
                        color: volumeUnit === unit ? palette.onBrandPrimary : palette.textPrimary,
                      }}
                    >
                      {unit}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
            <View className="flex-row flex-wrap justify-center gap-1.5">
              {(volumeUnit === 'ml' ? BOTTLE_PRESET_ML : OZ_PRESETS).map((val) => (
                <Pressable
                  key={`pump-${volumeUnit}-${val}`}
                  onPress={() => handleSavePumping(val)}
                  hitSlop={4}
                  className="rounded-xl border px-3 py-1.5 justify-center"
                  style={{
                    minHeight: 36,
                    backgroundColor: palette.brandSurface,
                    borderColor: palette.brandPrimary,
                  }}
                >
                  <Text className="text-xs font-bold" style={{ color: palette.brandText }}>
                    {val} {volumeUnit}
                  </Text>
                </Pressable>
              ))}
            </View>
            <View className="flex-row items-center justify-center gap-2">
              <TextInput
                value={pumpingMlInput}
                onChangeText={setPumpingMlInput}
                keyboardType="decimal-pad"
                className="rounded-xl border px-3 py-1.5 w-20 text-sm"
                style={{
                  minHeight: 40,
                  backgroundColor: palette.bgCard,
                  borderColor: palette.borderInteractive,
                  color: palette.textPrimary,
                }}
              />
              <Pressable
                onPress={() =>
                  handleSavePumping(
                    Number.parseFloat(pumpingMlInput) || (volumeUnit === 'ml' ? 90 : 3),
                  )
                }
                hitSlop={4}
                className="rounded-xl px-3.5 py-1.5 justify-center"
                style={{
                  minHeight: 40,
                  backgroundColor: palette.brandPrimary,
                }}
              >
                <Text className="text-xs font-bold" style={{ color: palette.onBrandPrimary }}>
                  Guardar extracción
                </Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        {showSolidsPicker ? (
          <View
            className="rounded-xl border p-3 gap-2"
            style={{
              backgroundColor: palette.bgElevated,
              borderColor: palette.borderInteractive,
            }}
          >
            <TextInput
              value={solidsFoodInput}
              onChangeText={setSolidsFoodInput}
              placeholder="Alimento (ej. aguacate, avena)"
              placeholderTextColor={palette.textMuted}
              className="rounded-xl border px-3 py-2 text-xs"
              style={{
                minHeight: MIN_TOUCH_TARGET_PX,
                backgroundColor: palette.bgCard,
                borderColor: palette.borderInteractive,
                color: palette.textPrimary,
              }}
            />
            <View className="flex-row flex-wrap items-center justify-center gap-2">
              <Pressable
                onPress={() => setSolidsIsNew((v) => !v)}
                className="rounded-xl border px-3 py-2 justify-center"
                style={{
                  minHeight: MIN_TOUCH_TARGET_PX,
                  backgroundColor: solidsIsNew ? palette.brandPrimary : palette.bgCard,
                  borderColor: solidsIsNew ? palette.brandPrimary : palette.borderInteractive,
                }}
              >
                <Text
                  className="text-xs font-bold"
                  style={{ color: solidsIsNew ? palette.onBrandPrimary : palette.textPrimary }}
                >
                  {solidsIsNew ? '✓ Alimento nuevo' : 'Alimento nuevo'}
                </Text>
              </Pressable>
              <Pressable
                onPress={handleSaveSolids}
                className="rounded-xl px-4 py-2 justify-center"
                style={{
                  minHeight: MIN_TOUCH_TARGET_PX,
                  backgroundColor: palette.brandPrimary,
                }}
              >
                <Text className="text-xs font-bold" style={{ color: palette.onBrandPrimary }}>
                  Guardar sólidos
                </Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        {showBottlePicker ? (
          <View
            className="rounded-xl border p-3 gap-2"
            style={{
              backgroundColor: palette.bgElevated,
              borderColor: palette.borderInteractive,
            }}
          >
            <View className="flex-row items-center justify-between">
              <Text className="text-xs font-bold" style={{ color: palette.textPrimary }}>
                Biberón:
              </Text>
              <View className="flex-row gap-1">
                {(['ml', 'oz'] as const).map((unit) => (
                  <Pressable
                    key={`bot-u-${unit}`}
                    onPress={() => {
                      setVolumeUnit(unit);
                      setBottleMlInput(unit === 'ml' ? '90' : '3');
                    }}
                    className="rounded-lg border px-2.5 py-1"
                    style={{
                      backgroundColor: volumeUnit === unit ? palette.brandPrimary : palette.bgCard,
                      borderColor:
                        volumeUnit === unit ? palette.brandPrimary : palette.borderInteractive,
                    }}
                  >
                    <Text
                      className="text-xs font-bold"
                      style={{
                        color: volumeUnit === unit ? palette.onBrandPrimary : palette.textPrimary,
                      }}
                    >
                      {unit}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
            <View className="flex-row flex-wrap justify-center gap-1.5">
              {(volumeUnit === 'ml' ? BOTTLE_PRESET_ML : OZ_PRESETS).map((val) => (
                <Pressable
                  key={`bot-${volumeUnit}-${val}`}
                  onPress={() => handleSaveBottle(val)}
                  hitSlop={4}
                  className="rounded-xl border px-3 py-1.5 justify-center"
                  style={{
                    minHeight: 36,
                    backgroundColor: palette.brandSurface,
                    borderColor: palette.brandPrimary,
                  }}
                >
                  <Text className="text-xs font-bold" style={{ color: palette.brandText }}>
                    {val} {volumeUnit}
                  </Text>
                </Pressable>
              ))}
            </View>
            <View className="flex-row items-center justify-center gap-2">
              <TextInput
                value={bottleMlInput}
                onChangeText={setBottleMlInput}
                keyboardType="decimal-pad"
                className="rounded-xl border px-3 py-1.5 w-20 text-sm"
                style={{
                  minHeight: 40,
                  backgroundColor: palette.bgCard,
                  borderColor: palette.borderInteractive,
                  color: palette.textPrimary,
                }}
              />
              <Pressable
                onPress={() =>
                  handleSaveBottle(
                    Number.parseFloat(bottleMlInput) || (volumeUnit === 'ml' ? 90 : 3),
                  )
                }
                hitSlop={4}
                className="rounded-xl px-3.5 py-1.5 justify-center"
                style={{
                  minHeight: 40,
                  backgroundColor: palette.brandPrimary,
                }}
              >
                <Text className="text-xs font-bold" style={{ color: palette.onBrandPrimary }}>
                  Guardar biberón
                </Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        <Text className="text-xs font-bold uppercase pt-1" style={{ color: palette.textSecondary }}>
          Pañales
        </Text>
        {saveFeedback?.section === 'diaper' ? (
          <View
            className="rounded-xl border-2 px-4 py-3"
            style={{
              backgroundColor: palette.brandSurface,
              borderColor: palette.brandPrimary,
            }}
          >
            <Text className="text-sm font-bold" style={{ color: palette.brandText }}>
              {saveFeedback.message}
            </Text>
          </View>
        ) : null}
        <View className="flex-row gap-2">
          <Pressable
            onPress={handleQuickWetDiaper}
            className="flex-1 rounded-xl border px-2 py-2.5 items-center justify-center"
            style={{
              minHeight: MIN_TOUCH_TARGET_PX,
              backgroundColor: palette.bgElevated,
              borderColor: palette.borderInteractive,
            }}
          >
            <Text className="text-xs font-bold" style={{ color: palette.textPrimary }}>
              Pipí
            </Text>
          </Pressable>

          <Pressable
            onPress={() =>
              setPendingDiaperKind((k) => (k === 'dirty' ? null : 'dirty'))
            }
            className="flex-1 rounded-xl border px-2 py-2.5 items-center justify-center"
            style={{
              minHeight: MIN_TOUCH_TARGET_PX,
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
            <Text className="text-xs font-bold" style={{ color: palette.textPrimary }}>
              Popó
            </Text>
          </Pressable>

          <Pressable
            onPress={() =>
              setPendingDiaperKind((k) => (k === 'both' ? null : 'both'))
            }
            className="flex-1 rounded-xl border px-2 py-2.5 items-center justify-center"
            style={{
              minHeight: MIN_TOUCH_TARGET_PX,
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
            <Text className="text-xs font-bold" style={{ color: palette.textPrimary }}>
              Ambos
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
            <Text className="text-xs font-bold text-center" style={{ color: palette.textPrimary }}>
              Color de la popó:
            </Text>
            <View className="flex-row flex-wrap justify-center gap-1.5">
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
              className="rounded-xl px-4 py-2 self-center justify-center"
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
        {saveFeedback?.section === 'sleep' ? (
          <View
            className="rounded-xl border-2 px-4 py-3"
            style={{
              backgroundColor: palette.brandSurface,
              borderColor: palette.brandPrimary,
            }}
          >
            <Text className="text-sm font-bold" style={{ color: palette.brandText }}>
              {saveFeedback.message}
            </Text>
          </View>
        ) : null}
        {activeSleepStartMs !== null ? (
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
                onPress={() => {
                  const mins = Math.max(1, Math.round(sleepElapsedSec / 60));
                  saveActiveSleepTimer();
                  flashFeedback('sleep', `✓ Siesta (${mins} min) guardada`);
                }}
                className="rounded-xl px-4 py-2 justify-center"
                style={{ minHeight: MIN_TOUCH_TARGET_PX, backgroundColor: palette.brandPrimary }}
              >
                <Text className="text-xs font-bold" style={{ color: palette.onBrandPrimary }}>
                  Guardar siesta
                </Text>
              </Pressable>
              <Pressable
                onPress={cancelSleepTimer}
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
          <View className="flex-row flex-wrap justify-center gap-2">
            <Pressable
              onPress={() => startSleepTimer(retroOffsetMin)}
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

        <Text className="text-xs font-bold uppercase pt-1" style={{ color: palette.textSecondary }}>
          Eventos
        </Text>
        {saveFeedback?.section === 'event' ? (
          <View
            className="rounded-xl border-2 px-4 py-3"
            style={{
              backgroundColor: palette.brandSurface,
              borderColor: palette.brandPrimary,
            }}
          >
            <Text className="text-sm font-bold text-center" style={{ color: palette.brandText }}>
              {saveFeedback.message}
            </Text>
          </View>
        ) : null}
        <View className="flex-row flex-wrap justify-center gap-2">
          {BABY_EVENT_OPTIONS_MX.map((ev) => (
            <Pressable
              key={ev.id}
              onPress={() => handleQuickEvent(ev.id, ev.labelMx)}
              hitSlop={4}
              className="rounded-xl border px-3 py-1.5 items-center justify-center"
              style={{
                minHeight: 36,
                backgroundColor: palette.bgElevated,
                borderColor: palette.borderInteractive,
              }}
            >
              <Text className="text-xs font-bold text-center" style={{ color: palette.textPrimary }}>
                {ev.labelMx}
              </Text>
            </Pressable>
          ))}
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
          <Text className="text-base font-bold" style={{ color: palette.textPrimary }}>
            Resumen y promedios
          </Text>
          <Text className="text-xs" style={{ color: palette.textSecondary }}>
            {activeRange.startDateKey} a {activeRange.endDateKey} ({summary.daysInRange}{' '}
            {summary.daysInRange === 1 ? 'día' : 'días'})
          </Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 6 }}
        >
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
        </ScrollView>

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
            <Text className="text-xs text-center" style={{ color: palette.textSecondary }}>
              Tomas
            </Text>
            <Text className="text-xl font-bold text-center" style={{ color: palette.textPrimary }}>
              {summary.totalFeeds}
            </Text>
            <Text className="text-xs font-semibold text-center" style={{ color: palette.brandText }}>
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
            <Text className="text-xs text-center" style={{ color: palette.textSecondary }}>
              Pecho / Biberón
            </Text>
            <Text className="text-sm font-bold text-center" style={{ color: palette.textPrimary }}>
              {summary.totalBreastMin} min · {summary.totalBottleMl} ml
            </Text>
            <Text className="text-xs font-semibold text-center" style={{ color: palette.brandText }}>
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
            <Text className="text-xs text-center" style={{ color: palette.textSecondary }}>
              Pipí / Popó
            </Text>
            <Text className="text-xl font-bold text-center" style={{ color: palette.textPrimary }}>
              {summary.wetDiapers} / {summary.dirtyDiapers}
            </Text>
            <Text className="text-xs font-semibold text-center" style={{ color: palette.brandText }}>
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
            <Text className="text-xs text-center" style={{ color: palette.textSecondary }}>
              Sueño / Siestas
            </Text>
            <Text className="text-xl font-bold text-center" style={{ color: palette.textPrimary }}>
              {summary.totalSleeps} ({summary.totalSleepMin} min)
            </Text>
            <Text className="text-xs font-semibold text-center" style={{ color: palette.brandText }}>
              Prom: {summary.avgSleepMinPerDay} min / día
            </Text>
          </View>

          {summary.totalPumpingMl > 0 || summary.solidsCount > 0 ? (
            <View
              className="flex-1 min-w-[140px] rounded-xl border p-3 gap-0.5"
              style={{
                backgroundColor: palette.bgElevated,
                borderColor: palette.borderInteractive,
              }}
            >
              <Text className="text-xs text-center" style={{ color: palette.textSecondary }}>
                Extracción / Sólidos
              </Text>
              <Text className="text-sm font-bold text-center" style={{ color: palette.textPrimary }}>
                {summary.totalPumpingMl} ml · {summary.solidsCount} comidas
              </Text>
              <Text className="text-xs font-semibold text-center" style={{ color: palette.brandText }}>
                {summary.avgPumpingMlPerDay} ml/d · {summary.avgSolidsPerDay}/d
              </Text>
            </View>
          ) : null}
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
                      : entry.feedType === 'pumping'
                        ? `Extracción (${entry.volumeMl ?? 0} ml)`
                        : entry.feedType === 'solids'
                          ? `Sólidos: ${entry.foodMx ?? 'Comida'}${entry.isNewFood ? ' (nuevo)' : ''}`
                          : `Biberón (${entry.volumeMl ?? 0} ml)`
                  : entry.kind === 'sleep'
                    ? `Siesta (${Math.max(1, Math.round(entry.durationSec / 60))} min)`
                    : entry.kind === 'event'
                      ? `Evento: ${BABY_EVENT_OPTIONS_MX.find((o) => o.id === entry.eventType)?.labelMx ?? entry.eventType}`
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
