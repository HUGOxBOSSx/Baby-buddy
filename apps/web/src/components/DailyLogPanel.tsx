'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import {
  BOTTLE_PRESET_ML,
  POOP_COLOR_TAG_OPTIONS,
  computeTimerElapsedSec,
  filterEntriesByDateRange,
  formatTimerClock,
  resolveDateRangePreset,
  summarizeDailyLog,
  toLocalDateKey,
  type DateRangePreset,
  type DiaperKind,
  type PoopColorTag,
} from '@baby-buddy/core';
import { useAppState } from '@/components/ThemeProvider';

const RANGE_PRESETS: readonly {
  readonly id: DateRangePreset;
  readonly label: string;
}[] = [
  { id: 'today', label: 'Hoy' },
  { id: 'last_3_days', label: 'Últimos 3 días' },
  { id: 'last_7_days', label: 'Últimos 7 días' },
  { id: 'last_week', label: 'Semana pasada' },
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
    dailyLogs,
    activeFeedTimer,
    addDailyLogEntry,
    deleteDailyLogEntry,
    startFeedTimer,
    togglePauseFeedTimer,
    saveActiveFeedTimer,
    cancelActiveFeedTimer,
  } = useAppState();

  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  const [showBottlePicker, setShowBottlePicker] = useState(false);
  const [bottleMlInput, setBottleMlInput] = useState('90');
  const [pendingDiaperKind, setPendingDiaperKind] = useState<DiaperKind | null>(
    null,
  );
  const [selectedPoopColor, setSelectedPoopColor] =
    useState<PoopColorTag>('mostaza');

  const [rangePreset, setRangePreset] = useState<DateRangePreset>('today');
  const [customStart, setCustomStart] = useState<string>(() =>
    toLocalDateKey(new Date()),
  );
  const [customEnd, setCustomEnd] = useState<string>(() =>
    toLocalDateKey(new Date()),
  );

  useEffect(() => {
    if (!activeFeedTimer || activeFeedTimer.paused) {
      return;
    }
    const id = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => window.clearInterval(id);
  }, [activeFeedTimer]);

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

  const handleSaveBottle = useCallback(
    (mlValue: number) => {
      const safeMl = Math.max(5, Math.min(500, Math.round(mlValue)));
      const now = Date.now();
      addDailyLogEntry({
        id: `feed-${now}`,
        kind: 'feed',
        timestampIso: new Date(now).toISOString(),
        feedType: 'bottle',
        volumeMl: safeMl,
      });
      setShowBottlePicker(false);
    },
    [addDailyLogEntry],
  );

  const handleQuickWetDiaper = useCallback(() => {
    const now = Date.now();
    addDailyLogEntry({
      id: `diaper-${now}`,
      kind: 'diaper',
      timestampIso: new Date(now).toISOString(),
      diaperKind: 'wet',
    });
    setPendingDiaperKind(null);
  }, [addDailyLogEntry]);

  const handleSaveDirtyDiaper = useCallback(() => {
    if (!pendingDiaperKind) return;
    const now = Date.now();
    addDailyLogEntry({
      id: `diaper-${now}`,
      kind: 'diaper',
      timestampIso: new Date(now).toISOString(),
      diaperKind: pendingDiaperKind,
      poopColor: selectedPoopColor,
    });
    setPendingDiaperKind(null);
  }, [addDailyLogEntry, pendingDiaperKind, selectedPoopColor]);

  return (
    <section className="space-y-5">
      {/* 1-Tap Quick Registration */}
      <div className="rounded-3xl border border-border-interactive bg-bg-card p-5 space-y-4 shadow-sm">
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-ink-primary">
            Registro rápido (1 toque)
          </h2>
          <p className="text-xs text-ink-secondary">
            Toca pecho izquierdo o derecho para iniciar el cronómetro, o registra
            biberón y pañales al instante.
          </p>
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
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={togglePauseFeedTimer}
                  className="inline-flex min-h-12 items-center rounded-xl border border-border-interactive bg-bg-card px-4 py-2 text-xs font-bold text-ink-primary"
                >
                  {activeFeedTimer.paused ? 'Reanudar' : 'Pausar'}
                </button>
                <button
                  type="button"
                  onClick={saveActiveFeedTimer}
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
          <div className="grid gap-3 sm:grid-cols-3">
            <button
              type="button"
              onClick={() => startFeedTimer('breast_left')}
              className="flex min-h-14 flex-col items-center justify-center rounded-2xl border-2 border-brand-primary bg-brand-surface px-4 py-3 text-center hover:opacity-90"
            >
              <span className="text-sm font-bold text-brand-text">
                Pecho Izquierdo
              </span>
              <span className="text-[11px] font-semibold text-ink-secondary">
                {suggestedNextSide === 'breast_left'
                  ? 'Siguiente sugerido · Iniciar timer'
                  : 'Iniciar cronómetro'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => startFeedTimer('breast_right')}
              className="flex min-h-14 flex-col items-center justify-center rounded-2xl border-2 border-brand-primary bg-brand-surface px-4 py-3 text-center hover:opacity-90"
            >
              <span className="text-sm font-bold text-brand-text">
                Pecho Derecho
              </span>
              <span className="text-[11px] font-semibold text-ink-secondary">
                {suggestedNextSide === 'breast_right'
                  ? 'Siguiente sugerido · Iniciar timer'
                  : 'Iniciar cronómetro'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setShowBottlePicker((v) => !v)}
              aria-expanded={showBottlePicker}
              className="flex min-h-14 flex-col items-center justify-center rounded-2xl border-2 border-border-interactive bg-bg-elevated px-4 py-3 text-center hover:bg-brand-surface"
            >
              <span className="text-sm font-bold text-ink-primary">
                Biberón (ml)
              </span>
              <span className="text-[11px] font-semibold text-ink-secondary">
                Elegir cantidad
              </span>
            </button>
          </div>

          {showBottlePicker ? (
            <div className="rounded-2xl border border-border-interactive bg-bg-elevated p-4 space-y-3">
              <p className="text-xs font-bold text-ink-primary">
                Selecciona mililitros (ml):
              </p>
              <div className="flex flex-wrap gap-2">
                {BOTTLE_PRESET_ML.map((ml) => (
                  <button
                    key={ml}
                    type="button"
                    onClick={() => handleSaveBottle(ml)}
                    className="inline-flex min-h-12 items-center rounded-xl border border-brand-primary bg-brand-surface px-4 py-2 text-xs font-bold text-brand-text"
                  >
                    {ml} ml
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="number"
                  min={5}
                  max={500}
                  value={bottleMlInput}
                  onChange={(e) => setBottleMlInput(e.target.value)}
                  className="min-h-12 w-28 rounded-xl border border-border-interactive bg-bg-card px-3 py-2 text-sm text-ink-primary"
                  aria-label="Mililitros personalizados"
                />
                <button
                  type="button"
                  onClick={() =>
                    handleSaveBottle(Number.parseFloat(bottleMlInput) || 90)
                  }
                  className="inline-flex min-h-12 items-center rounded-xl bg-brand-primary px-4 py-2 text-xs font-bold text-brand-on"
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
            Pañales y evacuaciones
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            <button
              type="button"
              onClick={handleQuickWetDiaper}
              className="flex min-h-14 flex-col items-center justify-center rounded-2xl border-2 border-border-interactive bg-bg-elevated px-4 py-3 text-center hover:bg-brand-surface"
            >
              <span className="text-sm font-bold text-ink-primary">
                Solo Pipí
              </span>
              <span className="text-[11px] font-semibold text-ink-secondary">
                Guardar en 1 toque
              </span>
            </button>

            <button
              type="button"
              onClick={() =>
                setPendingDiaperKind((k) => (k === 'dirty' ? null : 'dirty'))
              }
              aria-pressed={pendingDiaperKind === 'dirty'}
              className={`flex min-h-14 flex-col items-center justify-center rounded-2xl border-2 px-4 py-3 text-center ${
                pendingDiaperKind === 'dirty'
                  ? 'border-brand-primary bg-brand-surface'
                  : 'border-border-interactive bg-bg-elevated'
              }`}
            >
              <span className="text-sm font-bold text-ink-primary">
                Solo Popó
              </span>
              <span className="text-[11px] font-semibold text-ink-secondary">
                Elegir color
              </span>
            </button>

            <button
              type="button"
              onClick={() =>
                setPendingDiaperKind((k) => (k === 'both' ? null : 'both'))
              }
              aria-pressed={pendingDiaperKind === 'both'}
              className={`flex min-h-14 flex-col items-center justify-center rounded-2xl border-2 px-4 py-3 text-center ${
                pendingDiaperKind === 'both'
                  ? 'border-brand-primary bg-brand-surface'
                  : 'border-border-interactive bg-bg-elevated'
              }`}
            >
              <span className="text-sm font-bold text-ink-primary">
                Pipí + Popó
              </span>
              <span className="text-[11px] font-semibold text-ink-secondary">
                Elegir color
              </span>
            </button>
          </div>

          {pendingDiaperKind ? (
            <div className="rounded-2xl border border-border-interactive bg-bg-elevated p-4 space-y-3">
              <p className="text-xs font-bold text-ink-primary">
                Color de la popó:
              </p>
              <div className="flex flex-wrap gap-2">
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
              <button
                type="button"
                onClick={handleSaveDirtyDiaper}
                className="inline-flex min-h-12 items-center rounded-xl bg-brand-primary px-4 py-2 text-xs font-bold text-brand-on"
              >
                Guardar pañal
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {/* Summary & Date Range Averages */}
      <div className="rounded-3xl border border-border-interactive bg-bg-card p-5 space-y-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-ink-primary">
              Resumen y promedios
            </h2>
            <p className="text-xs text-ink-secondary">
              Periodo: {activeRange.startDateKey} a {activeRange.endDateKey} (
              {summary.daysInRange}{' '}
              {summary.daysInRange === 1 ? 'día' : 'días'})
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {RANGE_PRESETS.map((preset) => {
            const active = rangePreset === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => setRangePreset(preset.id)}
                aria-pressed={active}
                className={`inline-flex min-h-10 items-center rounded-full border px-3.5 py-1.5 text-xs font-bold ${
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
          <div className="rounded-2xl border border-border-interactive bg-bg-elevated p-3.5 space-y-1">
            <p className="text-xs font-semibold text-ink-secondary">Tomas</p>
            <p className="text-2xl font-bold text-ink-primary">
              {summary.totalFeeds}
            </p>
            <p className="text-xs font-semibold text-brand-text">
              Promedio: {summary.avgFeedsPerDay} / día
            </p>
          </div>

          <div className="rounded-2xl border border-border-interactive bg-bg-elevated p-3.5 space-y-1">
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

          <div className="rounded-2xl border border-border-interactive bg-bg-elevated p-3.5 space-y-1">
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

          <div className="rounded-2xl border border-border-interactive bg-bg-elevated p-3.5 space-y-1">
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
                            : `Biberón (${entry.volumeMl ?? 0} ml)`
                        : entry.diaperKind === 'wet'
                          ? 'Pañal: Pipí'
                          : entry.diaperKind === 'dirty'
                            ? `Pañal: Popó (${entry.poopColor ?? 'normal'})`
                            : `Pañal: Pipí + Popó (${entry.poopColor ?? 'normal'})`}
                    </span>
                    <span className="ml-2 text-ink-secondary">
                      {formatEntryTime(entry.timestampIso)}
                    </span>
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
