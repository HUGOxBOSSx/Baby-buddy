'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  BABY_EVENT_OPTIONS_MX,
  BOTTLE_PRESET_ML,
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
import { useAppState } from '@/components/ThemeProvider';

const OZ_PRESETS = [1, 2, 3, 4, 5, 6] as const;

const RANGE_PRESETS: readonly {
  readonly id: DateRangePreset;
  readonly label: string;
}[] = [
  { id: 'today', label: 'Hoy' },
  { id: 'last_3_days', label: 'Últimos 3 días' },
  { id: 'last_7_days', label: 'Últimos 7 días' },
  { id: 'last_week', label: 'Semana pasada' },
  { id: 'last_30_days', label: 'Últimos 30 días' },
  { id: 'this_month', label: 'Este mes' },
  { id: 'custom', label: 'Personalizado' },
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
  } = useAppState();

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
  const feedbackTimerRef = useRef<number | null>(null);

  const flashFeedback = useCallback(
    (section: 'feed' | 'diaper' | 'sleep' | 'event', message: string) => {
      setSaveFeedback({ section, message });
      if (feedbackTimerRef.current !== null) {
        window.clearTimeout(feedbackTimerRef.current);
      }
      feedbackTimerRef.current = window.setTimeout(() => {
        setSaveFeedback(null);
      }, 3500);
    },
    [],
  );

  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current !== null) {
        window.clearTimeout(feedbackTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if ((!activeFeedTimer || activeFeedTimer.paused) && activeSleepStartMs === null) {
      return;
    }
    const id = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => window.clearInterval(id);
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

  const getEntryTimestampIso = useCallback(
    (now: number) => new Date(now - retroOffsetMin * 60_000).toISOString(),
    [retroOffsetMin],
  );

  const handleSaveBottle = useCallback(
    (rawValue: number) => {
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
    },
    [addDailyLogEntry, flashFeedback, getEntryTimestampIso, volumeUnit],
  );

  const handleSavePumping = useCallback(
    (rawValue: number) => {
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
    },
    [addDailyLogEntry, flashFeedback, getEntryTimestampIso, volumeUnit],
  );

  const handleSaveSolids = useCallback(() => {
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
  }, [
    addDailyLogEntry,
    flashFeedback,
    getEntryTimestampIso,
    solidsFoodInput,
    solidsIsNew,
  ]);

  const handleQuickWetDiaper = useCallback(() => {
    const now = Date.now();
    addDailyLogEntry({
      id: `diaper-${now}`,
      kind: 'diaper',
      timestampIso: getEntryTimestampIso(now),
      diaperKind: 'wet',
    });
    setPendingDiaperKind(null);
    flashFeedback('diaper', '✓ Pipí guardado');
  }, [addDailyLogEntry, flashFeedback, getEntryTimestampIso]);

  const handleSaveDirtyDiaper = useCallback(() => {
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
  }, [addDailyLogEntry, flashFeedback, getEntryTimestampIso, pendingDiaperKind, selectedPoopColor]);

  const handleSaveSleep = useCallback(
    (durationSec: number) => {
      const safeSec = Math.max(60, Math.round(durationSec));
      const now = Date.now();
      addDailyLogEntry({
        id: `sleep-${now}`,
        kind: 'sleep',
        timestampIso: getEntryTimestampIso(now),
        durationSec: safeSec,
      });
      flashFeedback('sleep', `✓ Siesta (${Math.round(safeSec / 60)} min) guardada`);
    },
    [addDailyLogEntry, flashFeedback, getEntryTimestampIso],
  );

  const handleQuickEvent = useCallback(
    (eventType: BabyEventKind, labelMx: string) => {
      const now = Date.now();
      addDailyLogEntry({
        id: `event-${now}`,
        kind: 'event',
        timestampIso: getEntryTimestampIso(now),
        eventType,
      });
      flashFeedback('event', `✓ ${labelMx} registrado`);
    },
    [addDailyLogEntry, flashFeedback, getEntryTimestampIso],
  );

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
    <section className="space-y-5">
      {/* Franja visual "Hace cuánto..." */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-border-interactive bg-bg-card p-3.5 text-center space-y-1">
          <p className="text-[11px] font-bold uppercase text-ink-secondary">
            Última toma
          </p>
          <p className="text-base font-extrabold text-brand-text tabular-nums">
            {summary.hoursSinceLastFeed !== null
              ? `Hace ${summary.hoursSinceLastFeed} h`
              : 'Sin registro'}
          </p>
          {suggestedNextSide ? (
            <p className="text-[11px] text-ink-secondary">
              Siguiente:{' '}
              {suggestedNextSide === 'breast_left'
                ? 'Pecho izquierdo'
                : 'Pecho derecho'}
            </p>
          ) : null}
        </div>
        <div className="rounded-2xl border border-border-interactive bg-bg-card p-3.5 text-center space-y-1">
          <p className="text-[11px] font-bold uppercase text-ink-secondary">
            Último pañal
          </p>
          <p className="text-base font-extrabold text-ink-primary tabular-nums">
            {summary.hoursSinceLastDiaper !== null
              ? `Hace ${summary.hoursSinceLastDiaper} h`
              : 'Sin registro'}
          </p>
          <p className="text-[11px] text-ink-secondary">
            Pipí hoy: {summary.wetDiapers} · Popó: {summary.dirtyDiapers}
          </p>
        </div>
        <div className="rounded-2xl border border-border-interactive bg-bg-card p-3.5 text-center space-y-1">
          <p className="text-[11px] font-bold uppercase text-ink-secondary">
            Última siesta
          </p>
          <p className="text-base font-extrabold text-ink-primary tabular-nums">
            {summary.hoursSinceLastSleep !== null
              ? `Hace ${summary.hoursSinceLastSleep} h`
              : 'Sin registro'}
          </p>
          <p className="text-[11px] text-ink-secondary">{wakeGuidance}</p>
          <p className="text-[11px] font-semibold text-brand-text">
            {napSuggestion}
          </p>
        </div>
      </div>

      {/* Recordatorios locales compactos */}
      {!remindersDismissed && reminders.length > 0 ? (
        <div className="rounded-2xl border border-border-subtle bg-bg-elevated px-4 py-3 space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-bold text-ink-primary">
              Recordatorios locales
            </p>
            <button
              type="button"
              onClick={() => setRemindersDismissed(true)}
              className="text-[11px] font-semibold text-ink-secondary hover:text-ink-primary"
            >
              Ocultar
            </button>
          </div>
          {reminders.slice(0, 2).map((rem) => (
            <div
              key={rem.id}
              className="flex flex-wrap items-center justify-between gap-2"
            >
              <p className="min-w-0 flex-1 text-xs text-ink-secondary">
                <strong
                  className={
                    rem.urgency === 'due' ? 'text-warm-text' : 'text-brand-text'
                  }
                >
                  {rem.titleMx}:
                </strong>{' '}
                {rem.detailMx}
              </p>
              {rem.kind === 'vaccine' ? (
                <Link
                  href="/salud?tab=vacunas"
                  className="inline-flex shrink-0 items-center rounded-lg border border-brand-primary bg-brand-surface px-2.5 py-1 text-[11px] font-bold text-brand-text hover:opacity-90"
                >
                  Ir a vacunas →
                </Link>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}

      {/* 1-Tap Quick Registration */}
      <div className="rounded-2xl border border-border-subtle bg-bg-card p-4 sm:p-5 space-y-4 shadow-sm">
        <h2 className="text-base font-bold text-ink-primary">
          Registro rápido
        </h2>

        {/* Retroactive time presets + custom slider (up to 5 h) */}
        <div className="space-y-2.5 border-b border-border-subtle pb-3">
          <div className="flex flex-wrap items-center justify-center gap-1.5">
            <span className="text-xs font-bold text-ink-secondary">Hora:</span>
            {([
              { min: 0, label: 'Ahora' },
              { min: 5, label: '−5m' },
              { min: 10, label: '−10m' },
              { min: 20, label: '−20m' },
              { min: 30, label: '−30m' },
            ] as const).map((opt) => (
              <button
                key={opt.min}
                type="button"
                onClick={() => {
                  setRetroOffsetMin(opt.min);
                  setCustomRetroOpen(false);
                }}
                aria-pressed={!customRetroOpen && retroOffsetMin === opt.min}
                className={`min-h-9 rounded-full border px-2.5 py-1 text-xs font-bold ${
                  !customRetroOpen && retroOffsetMin === opt.min
                    ? 'border-brand-primary bg-brand-primary text-brand-on'
                    : 'border-border-interactive bg-bg-elevated text-ink-primary'
                }`}
              >
                {opt.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setCustomRetroOpen((v) => !v)}
              aria-pressed={customRetroOpen}
              className={`min-h-9 rounded-full border px-2.5 py-1 text-xs font-bold ${
                customRetroOpen
                  ? 'border-brand-primary bg-brand-primary text-brand-on'
                  : 'border-border-interactive bg-bg-elevated text-brand-text'
              }`}
            >
              {customRetroOpen && retroOffsetMin > 0
                ? formatRetroOffsetLabelMx(retroOffsetMin)
                : 'Personalizado'}
            </button>
          </div>
          {customRetroOpen ? (
            <div className="rounded-xl border border-border-subtle bg-bg-elevated p-3 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-ink-secondary">
                  Tiempo atrás (hasta 5 h):
                </span>
                <strong className="text-brand-text tabular-nums">
                  {formatRetroOffsetLabelMx(retroOffsetMin)}
                </strong>
              </div>
              <input
                type="range"
                min={0}
                max={300}
                step={5}
                value={retroOffsetMin}
                onChange={(e) =>
                  setRetroOffsetMin(Number.parseInt(e.target.value, 10))
                }
                aria-label="Ajustar tiempo atrás hasta 5 horas"
                className="w-full accent-brand-primary"
              />
            </div>
          ) : null}
        </div>

        {/* Active Timer Banner */}
        {activeFeedTimer ? (
          <div className="rounded-2xl border-2 border-brand-primary bg-brand-surface p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-xs font-bold uppercase text-brand-text">
                  {activeFeedTimer.side === 'breast_left'
                    ? 'Toma en curso · Pecho izquierdo'
                    : 'Toma en curso · Pecho derecho'}
                </p>
                <p className="text-3xl font-extrabold tabular-nums text-ink-primary">
                  {formatTimerClock(timerElapsedSec)}
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                <button
                  type="button"
                  onClick={togglePauseFeedTimer}
                  className="inline-flex min-h-12 items-center rounded-xl border border-border-interactive bg-bg-card px-4 py-2 text-xs font-bold text-ink-primary"
                >
                  {activeFeedTimer.paused ? 'Reanudar' : 'Pausar'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    saveActiveFeedTimer();
                    flashFeedback('feed', '✓ Toma guardada');
                  }}
                  className="inline-flex min-h-12 items-center rounded-xl bg-brand-primary px-4 py-2 text-xs font-bold text-brand-on"
                >
                  Guardar toma
                </button>
                <button
                  type="button"
                  onClick={cancelActiveFeedTimer}
                  className="inline-flex min-h-12 items-center rounded-xl border border-alert-red bg-alert-surface px-3 py-2 text-xs font-bold text-alert-text"
                >
                  Descartar
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {/* Feed 1-Tap Buttons */}
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-wide text-ink-secondary">
            Tomas
          </p>
          {saveFeedback?.section === 'feed' ? (
            <div
              role="status"
              aria-live="polite"
              className="rounded-xl border-2 border-brand-primary bg-brand-surface px-4 py-3 text-center text-sm font-bold text-brand-text"
            >
              {saveFeedback.message}
            </div>
          ) : null}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => startFeedTimer('breast_left')}
              className="flex min-h-11 flex-col items-center justify-center rounded-xl border border-brand-primary bg-brand-surface px-2 py-1.5 text-center hover:opacity-90"
            >
              <span className="text-sm font-bold text-brand-text">
                Pecho izquierdo
              </span>
              {suggestedNextSide === 'breast_left' ? (
                <span className="mt-0.5 rounded-full bg-brand-primary px-2 py-0.5 text-[10px] font-bold text-brand-on">
                  Sugerido
                </span>
              ) : null}
            </button>

            <button
              type="button"
              onClick={() => startFeedTimer('breast_right')}
              className="flex min-h-11 flex-col items-center justify-center rounded-xl border border-brand-primary bg-brand-surface px-2 py-1.5 text-center hover:opacity-90"
            >
              <span className="text-sm font-bold text-brand-text">
                Pecho derecho
              </span>
              {suggestedNextSide === 'breast_right' ? (
                <span className="mt-0.5 rounded-full bg-brand-primary px-2 py-0.5 text-[10px] font-bold text-brand-on">
                  Sugerido
                </span>
              ) : null}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setShowBottlePicker((v) => !v);
                setShowPumpingPicker(false);
                setShowSolidsPicker(false);
              }}
              aria-expanded={showBottlePicker}
              className={`flex min-h-10 items-center justify-center rounded-xl border px-3 py-1.5 text-xs font-bold ${
                showBottlePicker
                  ? 'border-brand-primary bg-brand-surface text-brand-text'
                  : 'border-border-interactive bg-bg-elevated text-ink-primary hover:bg-brand-surface'
              }`}
            >
              Biberón
            </button>
            <button
              type="button"
              onClick={() => {
                setShowPumpingPicker((v) => !v);
                setShowBottlePicker(false);
                setShowSolidsPicker(false);
              }}
              aria-expanded={showPumpingPicker}
              className={`flex min-h-10 items-center justify-center rounded-xl border px-3 py-1.5 text-xs font-bold ${
                showPumpingPicker
                  ? 'border-brand-primary bg-brand-surface text-brand-text'
                  : 'border-border-interactive bg-bg-elevated text-ink-primary'
              }`}
            >
              Extracción
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              setShowSolidsPicker((v) => !v);
              setShowBottlePicker(false);
              setShowPumpingPicker(false);
            }}
            aria-expanded={showSolidsPicker}
            className={`flex w-full min-h-10 items-center justify-center rounded-xl border px-3 py-1.5 text-xs font-bold ${
              showSolidsPicker
                ? 'border-brand-primary bg-brand-surface text-brand-text'
                : 'border-border-interactive bg-bg-elevated text-ink-primary'
            }`}
          >
            Sólidos / comida
          </button>

          {showPumpingPicker ? (
            <div className="rounded-2xl border border-border-subtle bg-bg-elevated p-3.5 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-bold text-ink-primary">
                  Extracción de leche:
                </p>
                <div className="flex gap-1">
                  {(['ml', 'oz'] as const).map((unit) => (
                    <button
                      key={`pump-u-${unit}`}
                      type="button"
                      onClick={() => {
                        setVolumeUnit(unit);
                        setPumpingMlInput(unit === 'ml' ? '90' : '3');
                      }}
                      aria-pressed={volumeUnit === unit}
                      className={`min-h-8 rounded-lg border px-2.5 py-0.5 text-xs font-bold ${
                        volumeUnit === unit
                          ? 'border-brand-primary bg-brand-primary text-brand-on'
                          : 'border-border-interactive bg-bg-card text-ink-primary'
                      }`}
                    >
                      {unit}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex flex-wrap justify-center gap-1.5">
                {(volumeUnit === 'ml' ? BOTTLE_PRESET_ML : OZ_PRESETS).map((val) => (
                  <button
                    key={`pump-${volumeUnit}-${val}`}
                    type="button"
                    onClick={() => handleSavePumping(val)}
                    className="inline-flex min-h-9 items-center rounded-xl border border-brand-primary bg-brand-surface px-3 py-1 text-xs font-bold text-brand-text"
                  >
                    {val} {volumeUnit}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <input
                  type="number"
                  step={volumeUnit === 'oz' ? '0.5' : '5'}
                  min={volumeUnit === 'oz' ? 0.5 : 5}
                  max={volumeUnit === 'oz' ? 17 : 500}
                  value={pumpingMlInput}
                  onChange={(e) => setPumpingMlInput(e.target.value)}
                  className="min-h-10 w-24 rounded-xl border border-border-interactive bg-bg-card px-3 py-1.5 text-sm text-ink-primary"
                  aria-label="Cantidad de extracción"
                />
                <button
                  type="button"
                  onClick={() =>
                    handleSavePumping(
                      Number.parseFloat(pumpingMlInput) || (volumeUnit === 'ml' ? 90 : 3),
                    )
                  }
                  className="inline-flex min-h-10 items-center rounded-xl bg-brand-primary px-3.5 py-1.5 text-xs font-bold text-brand-on"
                >
                  Guardar extracción
                </button>
              </div>
            </div>
          ) : null}

          {showSolidsPicker ? (
            <div className="rounded-2xl border border-border-subtle bg-bg-elevated p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-center gap-2">
                <input
                  type="text"
                  value={solidsFoodInput}
                  onChange={(e) => setSolidsFoodInput(e.target.value)}
                  placeholder="Alimento (ej. aguacate, avena)"
                  className="min-h-11 flex-1 min-w-[160px] rounded-xl border border-border-interactive bg-bg-card px-3 py-2 text-xs text-ink-primary"
                />
                <button
                  type="button"
                  onClick={() => setSolidsIsNew((v) => !v)}
                  aria-pressed={solidsIsNew}
                  className={`inline-flex min-h-11 items-center rounded-xl border px-3 py-2 text-xs font-bold ${
                    solidsIsNew
                      ? 'border-brand-primary bg-brand-primary text-brand-on'
                      : 'border-border-interactive bg-bg-card text-ink-primary'
                  }`}
                >
                  {solidsIsNew ? '✓ Alimento nuevo' : 'Alimento nuevo'}
                </button>
                <button
                  type="button"
                  onClick={handleSaveSolids}
                  className="inline-flex min-h-11 items-center rounded-xl bg-brand-primary px-4 py-2 text-xs font-bold text-brand-on"
                >
                  Guardar sólidos
                </button>
              </div>
            </div>
          ) : null}

          {showBottlePicker ? (
            <div className="rounded-2xl border border-border-interactive bg-bg-elevated p-3.5 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-bold text-ink-primary">
                  Biberón:
                </p>
                <div className="flex gap-1">
                  {(['ml', 'oz'] as const).map((unit) => (
                    <button
                      key={`bot-u-${unit}`}
                      type="button"
                      onClick={() => {
                        setVolumeUnit(unit);
                        setBottleMlInput(unit === 'ml' ? '90' : '3');
                      }}
                      aria-pressed={volumeUnit === unit}
                      className={`min-h-8 rounded-lg border px-2.5 py-0.5 text-xs font-bold ${
                        volumeUnit === unit
                          ? 'border-brand-primary bg-brand-primary text-brand-on'
                          : 'border-border-interactive bg-bg-card text-ink-primary'
                      }`}
                    >
                      {unit}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex flex-wrap justify-center gap-1.5">
                {(volumeUnit === 'ml' ? BOTTLE_PRESET_ML : OZ_PRESETS).map((val) => (
                  <button
                    key={`bot-${volumeUnit}-${val}`}
                    type="button"
                    onClick={() => handleSaveBottle(val)}
                    className="inline-flex min-h-9 items-center rounded-xl border border-brand-primary bg-brand-surface px-3 py-1 text-xs font-bold text-brand-text"
                  >
                    {val} {volumeUnit}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <input
                  type="number"
                  step={volumeUnit === 'oz' ? '0.5' : '5'}
                  min={volumeUnit === 'oz' ? 0.5 : 5}
                  max={volumeUnit === 'oz' ? 17 : 500}
                  value={bottleMlInput}
                  onChange={(e) => setBottleMlInput(e.target.value)}
                  className="min-h-10 w-24 rounded-xl border border-border-interactive bg-bg-card px-3 py-1.5 text-sm text-ink-primary"
                  aria-label="Cantidad personalizada"
                />
                <button
                  type="button"
                  onClick={() =>
                    handleSaveBottle(
                      Number.parseFloat(bottleMlInput) || (volumeUnit === 'ml' ? 90 : 3),
                    )
                  }
                  className="inline-flex min-h-10 items-center rounded-xl bg-brand-primary px-3.5 py-1.5 text-xs font-bold text-brand-on"
                >
                  Guardar biberón
                </button>
              </div>
            </div>
          ) : null}
        </div>

        {/* Diapers Multi-Choice 1-Tap Buttons */}
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-wide text-ink-secondary">
            Pañales
          </p>
          {saveFeedback?.section === 'diaper' ? (
            <div
              role="status"
              aria-live="polite"
              className="rounded-xl border-2 border-brand-primary bg-brand-surface px-4 py-3 text-sm font-bold text-brand-text"
            >
              {saveFeedback.message}
            </div>
          ) : null}
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={handleQuickWetDiaper}
              className="flex min-h-10 items-center justify-center rounded-xl border border-border-interactive bg-bg-elevated px-2 py-1.5 text-center hover:bg-brand-surface"
            >
              <span className="text-xs font-bold text-ink-primary">
                Pipí
              </span>
            </button>

            <button
              type="button"
              onClick={() =>
                setPendingDiaperKind((k) => (k === 'dirty' ? null : 'dirty'))
              }
              aria-pressed={pendingDiaperKind === 'dirty'}
              className={`flex min-h-10 items-center justify-center rounded-xl border px-2 py-1.5 text-center ${
                pendingDiaperKind === 'dirty'
                  ? 'border-brand-primary bg-brand-surface'
                  : 'border-border-interactive bg-bg-elevated'
              }`}
            >
              <span className="text-xs font-bold text-ink-primary">
                Popó
              </span>
            </button>

            <button
              type="button"
              onClick={() =>
                setPendingDiaperKind((k) => (k === 'both' ? null : 'both'))
              }
              aria-pressed={pendingDiaperKind === 'both'}
              className={`flex min-h-10 items-center justify-center rounded-xl border px-2 py-1.5 text-center ${
                pendingDiaperKind === 'both'
                  ? 'border-brand-primary bg-brand-surface'
                  : 'border-border-interactive bg-bg-elevated'
              }`}
            >
              <span className="text-xs font-bold text-ink-primary">
                Ambos
              </span>
            </button>
          </div>

          {pendingDiaperKind ? (
            <div className="rounded-2xl border border-border-interactive bg-bg-elevated p-4 space-y-3">
              <p className="text-center text-xs font-bold text-ink-primary">
                Color de la popó:
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {POOP_COLOR_TAG_OPTIONS.map((opt) => {
                  const active = selectedPoopColor === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setSelectedPoopColor(opt.id)}
                      aria-pressed={active}
                      className={`inline-flex min-h-10 items-center rounded-full border px-3 py-1.5 text-xs font-semibold ${
                        active
                          ? opt.isAlertColor
                            ? 'border-alert-red bg-alert-surface text-alert-text'
                            : 'border-brand-primary bg-brand-primary text-brand-on'
                          : 'border-border-interactive bg-bg-card text-ink-primary'
                      }`}
                    >
                      {opt.labelMx}
                    </button>
                  );
                })}
              </div>
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={handleSaveDirtyDiaper}
                  className="inline-flex min-h-12 items-center rounded-xl bg-brand-primary px-4 py-2 text-xs font-bold text-brand-on"
                >
                  Guardar pañal
                </button>
              </div>
            </div>
          ) : null}
        </div>

        {/* Sleep / Nap Tracker */}
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-wide text-ink-secondary">
            Sueño y siestas
          </p>
          {saveFeedback?.section === 'sleep' ? (
            <div
              role="status"
              aria-live="polite"
              className="rounded-xl border-2 border-brand-primary bg-brand-surface px-4 py-3 text-sm font-bold text-brand-text"
            >
              {saveFeedback.message}
            </div>
          ) : null}
          {activeSleepStartMs !== null ? (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border-2 border-brand-primary bg-brand-surface p-3">
              <div>
                <p className="text-xs font-bold uppercase text-brand-text">
                  Siesta en curso
                </p>
                <p className="text-2xl font-extrabold tabular-nums text-ink-primary">
                  {formatTimerClock(sleepElapsedSec)}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const mins = Math.max(1, Math.round(sleepElapsedSec / 60));
                    saveActiveSleepTimer();
                    flashFeedback('sleep', `✓ Siesta (${mins} min) guardada`);
                  }}
                  className="inline-flex min-h-12 items-center rounded-xl bg-brand-primary px-4 py-2 text-xs font-bold text-brand-on"
                >
                  Guardar siesta
                </button>
                <button
                  type="button"
                  onClick={cancelSleepTimer}
                  className="inline-flex min-h-12 items-center rounded-xl border border-alert-red bg-alert-surface px-3 py-2 text-xs font-bold text-alert-text"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap justify-center gap-2">
              <button
                type="button"
                onClick={() => startSleepTimer(retroOffsetMin)}
                className="inline-flex min-h-12 items-center rounded-xl border-2 border-brand-primary bg-brand-surface px-4 py-2 text-xs font-bold text-brand-text"
              >
                Iniciar siesta (cronómetro)
              </button>
              {([30, 60, 90, 120] as const).map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => handleSaveSleep(mins * 60)}
                  className="inline-flex min-h-12 items-center rounded-xl border border-border-interactive bg-bg-elevated px-3 py-2 text-xs font-bold text-ink-primary hover:bg-brand-surface"
                >
                  {mins < 60 ? `${mins} min` : `${mins / 60} h`}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Quick Events */}
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-wide text-ink-secondary">
            Eventos
          </p>
          {saveFeedback?.section === 'event' ? (
            <div
              role="status"
              aria-live="polite"
              className="rounded-xl border-2 border-brand-primary bg-brand-surface px-4 py-3 text-center text-sm font-bold text-brand-text"
            >
              {saveFeedback.message}
            </div>
          ) : null}
          <div className="flex flex-wrap justify-center gap-2">
            {BABY_EVENT_OPTIONS_MX.map((ev) => (
              <button
                key={ev.id}
                type="button"
                onClick={() => handleQuickEvent(ev.id, ev.labelMx)}
                className="inline-flex min-h-9 items-center justify-center rounded-xl border border-border-interactive bg-bg-elevated px-3 py-1.5 text-center text-xs font-bold text-ink-primary hover:bg-brand-surface"
              >
                {ev.labelMx}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary & Date Range Averages */}
      <div className="rounded-2xl border border-border-subtle bg-bg-card p-4 sm:p-5 space-y-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-ink-primary">
              Resumen y promedios
            </h2>
            <p className="text-xs text-ink-secondary">
              {activeRange.startDateKey} a {activeRange.endDateKey} (
              {summary.daysInRange}{' '}
              {summary.daysInRange === 1 ? 'día' : 'días'})
            </p>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {RANGE_PRESETS.map((preset) => {
            const active = rangePreset === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => setRangePreset(preset.id)}
                aria-pressed={active}
                className={`inline-flex min-h-10 shrink-0 items-center rounded-full border px-3.5 py-1.5 text-xs font-bold whitespace-nowrap ${
                  active
                    ? 'border-brand-primary bg-brand-primary text-brand-on'
                    : 'border-border-interactive bg-bg-elevated text-ink-primary'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        {rangePreset === 'custom' ? (
          <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border-subtle bg-bg-elevated p-3">
            <label className="text-xs font-semibold text-ink-primary">
              Desde:{' '}
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="ml-1 rounded-lg border border-border-interactive bg-bg-card px-2 py-1 text-xs"
              />
            </label>
            <label className="text-xs font-semibold text-ink-primary">
              Hasta:{' '}
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="ml-1 rounded-lg border border-border-interactive bg-bg-card px-2 py-1 text-xs"
              />
            </label>
          </div>
        ) : null}

        {summary.hydrationAlertMx ? (
          <div className="rounded-2xl border border-alert-red bg-alert-surface p-3 space-y-1">
            <p className="text-xs font-bold text-alert-text">
              {summary.hydrationAlertMx}
            </p>
            <Link
              href="/guias/sin-mojar-panal-deshidratacion"
              className="inline-block text-xs font-bold text-alert-text underline"
            >
              Ver qué hacer (&gt;8 h sin mojar pañal) →
            </Link>
          </div>
        ) : null}

        {summary.stoolAlertMx ? (
          <div className="rounded-2xl border border-alert-red bg-alert-surface p-3 space-y-1">
            <p className="text-xs font-bold text-alert-text">
              {summary.stoolAlertMx}
            </p>
            <Link
              href="/guias"
              className="inline-block text-xs font-bold text-alert-text underline"
            >
              Consultar Tabla de popó en ¿Es normal? →
            </Link>
          </div>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-border-interactive bg-bg-elevated p-3.5 text-center space-y-1">
            <p className="text-xs font-semibold text-ink-secondary">Tomas</p>
            <p className="text-2xl font-bold text-ink-primary">
              {summary.totalFeeds}
            </p>
            <p className="text-xs font-semibold text-brand-text">
              Promedio: {summary.avgFeedsPerDay} / día
            </p>
          </div>

          <div className="rounded-2xl border border-border-interactive bg-bg-elevated p-3.5 text-center space-y-1">
            <p className="text-xs font-semibold text-ink-secondary">
              Pecho / Biberón
            </p>
            <p className="text-sm font-bold text-ink-primary">
              {summary.totalBreastMin} min · {summary.totalBottleMl} ml
            </p>
            <p className="text-xs font-semibold text-brand-text">
              Prom: {summary.avgBreastMinPerDay} min/d ·{' '}
              {summary.avgBottleMlPerDay} ml/d
            </p>
          </div>

          <div className="rounded-2xl border border-border-interactive bg-bg-elevated p-3.5 text-center space-y-1">
            <p className="text-xs font-semibold text-ink-secondary">
              Pañales mojados (Pipí)
            </p>
            <p className="text-2xl font-bold text-ink-primary">
              {summary.wetDiapers}
            </p>
            <p className="text-xs font-semibold text-brand-text">
              Promedio: {summary.avgWetDiapersPerDay} / día
            </p>
          </div>

          <div className="rounded-2xl border border-border-interactive bg-bg-elevated p-3.5 text-center space-y-1">
            <p className="text-xs font-semibold text-ink-secondary">
              Evacuaciones (Popó)
            </p>
            <p className="text-2xl font-bold text-ink-primary">
              {summary.dirtyDiapers}
            </p>
            <p className="text-xs font-semibold text-brand-text">
              Promedio: {summary.avgDirtyDiapersPerDay} / día
            </p>
          </div>

          <div className="rounded-2xl border border-border-interactive bg-bg-elevated p-3.5 text-center space-y-1">
            <p className="text-xs font-semibold text-ink-secondary">
              Sueño / Siestas
            </p>
            <p className="text-2xl font-bold text-ink-primary">
              {summary.totalSleeps} ({summary.totalSleepMin} min)
            </p>
            <p className="text-xs font-semibold text-brand-text">
              Promedio: {summary.avgSleepMinPerDay} min / día
            </p>
          </div>

          {summary.totalPumpingMl > 0 || summary.solidsCount > 0 ? (
            <div className="rounded-2xl border border-border-subtle bg-bg-elevated p-3.5 text-center space-y-1">
              <p className="text-xs font-semibold text-ink-secondary">
                Extracción / Sólidos
              </p>
              <p className="text-sm font-bold text-ink-primary">
                {summary.totalPumpingMl} ml · {summary.solidsCount} comidas
              </p>
              <p className="text-xs font-semibold text-brand-text">
                Prom: {summary.avgPumpingMlPerDay} ml/d · {summary.avgSolidsPerDay}/d
              </p>
            </div>
          ) : null}
        </div>

        {/* History list */}
        <div className="space-y-2 pt-2 border-t border-border-subtle">
          <p className="text-xs font-bold uppercase tracking-wide text-ink-secondary">
            Registros del periodo ({entriesInRange.length})
          </p>
          {entriesInRange.length === 0 ? (
            <p className="text-xs text-ink-secondary">
              Aún no hay registros en este rango de fechas.
            </p>
          ) : (
            <ul className="space-y-2">
              {entriesInRange.slice(0, 15).map((entry) => (
                <li
                  key={entry.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border-subtle bg-bg-elevated px-3 py-2 text-xs"
                >
                  <div>
                    <span className="font-bold text-ink-primary">
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
                    </span>
                    <span className="ml-2 text-ink-secondary">
                      {formatEntryTime(entry.timestampIso)}
                    </span>
                    {entry.noteMx ? (
                      <span className="block text-[11px] text-ink-secondary">
                        Nota: {entry.noteMx}
                      </span>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteDailyLogEntry(entry.id)}
                    className="rounded-lg border border-border-interactive bg-bg-card px-2.5 py-1 text-[11px] font-semibold text-ink-secondary hover:text-alert-text"
                  >
                    Eliminar
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
