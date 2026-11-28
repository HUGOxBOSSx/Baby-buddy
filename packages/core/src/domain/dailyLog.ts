export type FeedType =
  | 'breast_left'
  | 'breast_right'
  | 'bottle'
  | 'pumping'
  | 'solids';
export type DiaperKind = 'wet' | 'dirty' | 'both';
export type PoopColorTag =
  | 'mostaza'
  | 'verde'
  | 'cafe'
  | 'meconio'
  | 'blanca_palida'
  | 'roja'
  | 'negra_tardia';

export interface FeedLogEntry {
  readonly id: string;
  readonly kind: 'feed';
  readonly timestampIso: string;
  readonly feedType: FeedType;
  readonly durationSec?: number;
  readonly volumeMl?: number;
  readonly foodMx?: string;
  readonly isNewFood?: boolean;
  readonly noteMx?: string;
}

export interface DiaperLogEntry {
  readonly id: string;
  readonly kind: 'diaper';
  readonly timestampIso: string;
  readonly diaperKind: DiaperKind;
  readonly poopColor?: PoopColorTag;
  readonly noteMx?: string;
}

export interface SleepLogEntry {
  readonly id: string;
  readonly kind: 'sleep';
  readonly timestampIso: string;
  readonly durationSec: number;
  readonly noteMx?: string;
}

export type BabyEventKind =
  | 'reflux'
  | 'vomit'
  | 'colic'
  | 'crying'
  | 'hiccups'
  | 'rash';

export interface EventLogEntry {
  readonly id: string;
  readonly kind: 'event';
  readonly timestampIso: string;
  readonly eventType: BabyEventKind;
  readonly noteMx?: string;
}

export type DailyLogEntry =
  | FeedLogEntry
  | DiaperLogEntry
  | SleepLogEntry
  | EventLogEntry;

export interface ActiveFeedTimer {
  readonly side: 'breast_left' | 'breast_right';
  readonly startedAtMs: number;
  readonly accumulatedSec: number;
  readonly paused: boolean;
}

export type DateRangePreset =
  | 'today'
  | 'last_3_days'
  | 'last_7_days'
  | 'last_week'
  | 'last_30_days'
  | 'this_month'
  | 'custom';

export interface DateRangeWindow {
  readonly startDateKey: string;
  readonly endDateKey: string;
}

export interface DailyLogSummary {
  readonly daysInRange: number;
  readonly totalFeeds: number;
  readonly avgFeedsPerDay: number;
  readonly breastFeeds: number;
  readonly totalBreastMin: number;
  readonly avgBreastMinPerDay: number;
  readonly bottleFeeds: number;
  readonly totalBottleMl: number;
  readonly avgBottleMlPerDay: number;
  readonly pumpingFeeds: number;
  readonly totalPumpingMl: number;
  readonly avgPumpingMlPerDay: number;
  readonly solidsCount: number;
  readonly avgSolidsPerDay: number;
  readonly totalDiapers: number;
  readonly avgDiapersPerDay: number;
  readonly wetDiapers: number;
  readonly avgWetDiapersPerDay: number;
  readonly dirtyDiapers: number;
  readonly avgDirtyDiapersPerDay: number;
  readonly totalSleeps: number;
  readonly totalSleepMin: number;
  readonly avgSleepMinPerDay: number;
  readonly lastBreastSide: 'breast_left' | 'breast_right' | null;
  readonly hoursSinceLastWetDiaper: number | null;
  readonly hoursSinceLastDiaper: number | null;
  readonly hoursSinceLastFeed: number | null;
  readonly hoursSinceLastSleep: number | null;
  readonly lastSleepIso: string | null;
  readonly hydrationAlertMx: string | null;
  readonly stoolAlertMx: string | null;
}

export const BOTTLE_PRESET_ML = [30, 60, 90, 120, 150, 180] as const;

export const BABY_EVENT_OPTIONS_MX: readonly {
  readonly id: BabyEventKind;
  readonly labelMx: string;
}[] = [
  { id: 'reflux', labelMx: 'Reflujo' },
  { id: 'vomit', labelMx: 'Vómito' },
  { id: 'colic', labelMx: 'Cólico / gases' },
  { id: 'crying', labelMx: 'Llanto intenso' },
  { id: 'hiccups', labelMx: 'Hipo' },
  { id: 'rash', labelMx: 'Rozadura' },
] as const;

export function formatRetroOffsetLabelMx(minutes: number): string {
  const safeMin = Math.max(0, Math.round(minutes));
  if (safeMin === 0) return 'Ahora';
  if (safeMin < 60) return `Hace ${safeMin} min`;
  const hrs = Math.floor(safeMin / 60);
  const rem = safeMin % 60;
  return rem === 0 ? `Hace ${hrs} h` : `Hace ${hrs} h ${rem} min`;
}

export const POOP_COLOR_TAG_OPTIONS: readonly {
  readonly id: PoopColorTag;
  readonly labelMx: string;
  readonly isAlertColor: boolean;
}[] = [
  { id: 'mostaza', labelMx: 'Mostaza / amarilla', isAlertColor: false },
  { id: 'verde', labelMx: 'Verde', isAlertColor: false },
  { id: 'cafe', labelMx: 'Café', isAlertColor: false },
  { id: 'meconio', labelMx: 'Meconio (primeros días)', isAlertColor: false },
  { id: 'blanca_palida', labelMx: 'Blanca / pálida', isAlertColor: true },
  { id: 'roja', labelMx: 'Roja / con sangre', isAlertColor: true },
  { id: 'negra_tardia', labelMx: 'Negra tardía', isAlertColor: true },
] as const;

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

export function toLocalDateKey(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function parseDateKeyUtcMs(key: string): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (!match) return null;
  const y = Number(match[1]);
  const m = Number(match[2]);
  const d = Number(match[3]);
  const utc = new Date(Date.UTC(y, m - 1, d));
  if (
    utc.getUTCFullYear() !== y ||
    utc.getUTCMonth() !== m - 1 ||
    utc.getUTCDate() !== d
  ) {
    return null;
  }
  return utc.getTime();
}

export function countInclusiveDays(range: DateRangeWindow): number {
  const startMs = parseDateKeyUtcMs(range.startDateKey);
  const endMs = parseDateKeyUtcMs(range.endDateKey);
  if (startMs === null || endMs === null || endMs < startMs) {
    return 1;
  }
  return Math.floor((endMs - startMs) / 86_400_000) + 1;
}

export function resolveDateRangePreset(
  preset: Exclude<DateRangePreset, 'custom'>,
  now: Date = new Date(),
): DateRangeWindow {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayKey = toLocalDateKey(today);

  if (preset === 'today') {
    return { startDateKey: todayKey, endDateKey: todayKey };
  }
  if (preset === 'last_3_days') {
    const start = new Date(today);
    start.setDate(start.getDate() - 2);
    return { startDateKey: toLocalDateKey(start), endDateKey: todayKey };
  }
  if (preset === 'last_7_days') {
    const start = new Date(today);
    start.setDate(start.getDate() - 6);
    return { startDateKey: toLocalDateKey(start), endDateKey: todayKey };
  }
  if (preset === 'last_30_days') {
    const start = new Date(today);
    start.setDate(start.getDate() - 29);
    return { startDateKey: toLocalDateKey(start), endDateKey: todayKey };
  }
  if (preset === 'this_month') {
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    return { startDateKey: toLocalDateKey(start), endDateKey: todayKey };
  }
  // last_week: previous Monday through Sunday
  const dayOfWeek = today.getDay(); // 0=Sun..6=Sat
  const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const thisMonday = new Date(today);
  thisMonday.setDate(thisMonday.getDate() - daysSinceMonday);
  const lastMonday = new Date(thisMonday);
  lastMonday.setDate(lastMonday.getDate() - 7);
  const lastSunday = new Date(thisMonday);
  lastSunday.setDate(lastSunday.getDate() - 1);
  return {
    startDateKey: toLocalDateKey(lastMonday),
    endDateKey: toLocalDateKey(lastSunday),
  };
}

export function filterEntriesByDateRange(
  entries: readonly DailyLogEntry[],
  range: DateRangeWindow,
): readonly DailyLogEntry[] {
  const startKey =
    range.startDateKey <= range.endDateKey
      ? range.startDateKey
      : range.endDateKey;
  const endKey =
    range.startDateKey <= range.endDateKey
      ? range.endDateKey
      : range.startDateKey;

  return entries.filter((entry) => {
    const d = new Date(entry.timestampIso);
    if (Number.isNaN(d.getTime())) return false;
    const key = toLocalDateKey(d);
    return key >= startKey && key <= endKey;
  });
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

export function summarizeDailyLog(
  entries: readonly DailyLogEntry[],
  range: DateRangeWindow,
  now: Date = new Date(),
): DailyLogSummary {
  const daysInRange = countInclusiveDays(range);
  const inRange = filterEntriesByDateRange(entries, range);

  let totalFeeds = 0;
  let breastFeeds = 0;
  let totalBreastSec = 0;
  let bottleFeeds = 0;
  let totalBottleMl = 0;
  let pumpingFeeds = 0;
  let totalPumpingMl = 0;
  let solidsCount = 0;
  let totalDiapers = 0;
  let wetDiapers = 0;
  let dirtyDiapers = 0;
  let totalSleeps = 0;
  let totalSleepSec = 0;

  for (const entry of inRange) {
    if (entry.kind === 'feed') {
      if (entry.feedType === 'pumping') {
        pumpingFeeds += 1;
        totalPumpingMl += entry.volumeMl ?? 0;
      } else {
        totalFeeds += 1;
        if (entry.feedType === 'bottle') {
          bottleFeeds += 1;
          totalBottleMl += entry.volumeMl ?? 0;
        } else if (entry.feedType === 'solids') {
          solidsCount += 1;
        } else {
          breastFeeds += 1;
          totalBreastSec += entry.durationSec ?? 0;
        }
      }
    } else if (entry.kind === 'sleep') {
      totalSleeps += 1;
      totalSleepSec += entry.durationSec;
    } else if (entry.kind === 'diaper') {
      totalDiapers += 1;
      if (entry.diaperKind === 'wet' || entry.diaperKind === 'both') {
        wetDiapers += 1;
      }
      if (entry.diaperKind === 'dirty' || entry.diaperKind === 'both') {
        dirtyDiapers += 1;
      }
    }
  }

  const sortedAll = [...entries].sort(
    (a, b) =>
      new Date(b.timestampIso).getTime() - new Date(a.timestampIso).getTime(),
  );

  const lastBreast = sortedAll.find(
    (e): e is FeedLogEntry =>
      e.kind === 'feed' &&
      (e.feedType === 'breast_left' || e.feedType === 'breast_right'),
  );
  const lastBreastSide =
    lastBreast &&
    (lastBreast.feedType === 'breast_left' ||
      lastBreast.feedType === 'breast_right')
      ? lastBreast.feedType
      : null;

  const nowMs = now.getTime();
  const lastFeed = sortedAll.find(
    (e) => e.kind === 'feed' && e.feedType !== 'pumping',
  );
  const hoursSinceLastFeed = lastFeed
    ? round1(
        Math.max(0, (nowMs - new Date(lastFeed.timestampIso).getTime()) / 3_600_000),
      )
    : null;

  const lastWet = sortedAll.find(
    (e) =>
      e.kind === 'diaper' &&
      (e.diaperKind === 'wet' || e.diaperKind === 'both'),
  );
  const hoursSinceLastWetDiaper = lastWet
    ? round1(
        Math.max(0, (nowMs - new Date(lastWet.timestampIso).getTime()) / 3_600_000),
      )
    : null;

  const lastDiaper = sortedAll.find((e) => e.kind === 'diaper');
  const hoursSinceLastDiaper = lastDiaper
    ? round1(
        Math.max(0, (nowMs - new Date(lastDiaper.timestampIso).getTime()) / 3_600_000),
      )
    : null;

  const lastSleep = sortedAll.find((e) => e.kind === 'sleep');
  const hoursSinceLastSleep = lastSleep
    ? round1(
        Math.max(0, (nowMs - new Date(lastSleep.timestampIso).getTime()) / 3_600_000),
      )
    : null;

  const hydrationAlertMx =
    hoursSinceLastWetDiaper !== null && hoursSinceLastWetDiaper >= 8
      ? `Lleva ${hoursSinceLastWetDiaper} h desde el último pañal mojado (>= 8 h). Vigila signos de deshidratación y consulta a tu pediatra.`
      : null;

  const alertColorIds = new Set<PoopColorTag>(
    POOP_COLOR_TAG_OPTIONS.filter((o) => o.isAlertColor).map((o) => o.id),
  );
  const hasAlertStool = inRange.some(
    (e) =>
      e.kind === 'diaper' &&
      e.poopColor !== undefined &&
      alertColorIds.has(e.poopColor),
  );
  const stoolAlertMx = hasAlertStool
    ? 'Se registró popó blanca/pálida, roja o negra tardía en este periodo: requiere valoración médica el mismo día.'
    : null;

  const totalBreastMin = Math.round(totalBreastSec / 60);
  const totalSleepMin = Math.round(totalSleepSec / 60);

  return {
    daysInRange,
    totalFeeds,
    avgFeedsPerDay: round1(totalFeeds / daysInRange),
    breastFeeds,
    totalBreastMin,
    avgBreastMinPerDay: round1(totalBreastMin / daysInRange),
    bottleFeeds,
    totalBottleMl,
    avgBottleMlPerDay: round1(totalBottleMl / daysInRange),
    pumpingFeeds,
    totalPumpingMl,
    avgPumpingMlPerDay: round1(totalPumpingMl / daysInRange),
    solidsCount,
    avgSolidsPerDay: round1(solidsCount / daysInRange),
    totalDiapers,
    avgDiapersPerDay: round1(totalDiapers / daysInRange),
    wetDiapers,
    avgWetDiapersPerDay: round1(wetDiapers / daysInRange),
    dirtyDiapers,
    avgDirtyDiapersPerDay: round1(dirtyDiapers / daysInRange),
    totalSleeps,
    totalSleepMin,
    avgSleepMinPerDay: round1(totalSleepMin / daysInRange),
    lastBreastSide,
    hoursSinceLastWetDiaper,
    hoursSinceLastDiaper,
    hoursSinceLastFeed,
    hoursSinceLastSleep,
    lastSleepIso: lastSleep ? lastSleep.timestampIso : null,
    hydrationAlertMx,
    stoolAlertMx,
  };
}

export function computeTimerElapsedSec(
  timer: ActiveFeedTimer,
  nowMs: number = Date.now(),
): number {
  if (timer.paused) {
    return Math.max(0, Math.floor(timer.accumulatedSec));
  }
  const runningSec = Math.max(0, Math.floor((nowMs - timer.startedAtMs) / 1000));
  return Math.max(0, Math.floor(timer.accumulatedSec) + runningSec);
}

export function formatTimerClock(totalSec: number): string {
  const safe = Math.max(0, Math.floor(totalSec));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${pad2(mins)}:${pad2(secs)}`;
}

export function parseDailyLogEntries(
  raw: string | null,
): readonly DailyLogEntry[] {
  if (!raw || raw.trim().length === 0) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is DailyLogEntry => {
      if (typeof item !== 'object' || item === null) return false;
      const obj = item as Record<string, unknown>;
      return (
        typeof obj.id === 'string' &&
        typeof obj.timestampIso === 'string' &&
        (obj.kind === 'feed' ||
          obj.kind === 'diaper' ||
          obj.kind === 'sleep' ||
          obj.kind === 'event')
      );
    });
  } catch {
    return [];
  }
}

export function parseActiveFeedTimer(
  raw: string | null,
): ActiveFeedTimer | null {
  if (!raw || raw.trim().length === 0) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return null;
    const obj = parsed as Record<string, unknown>;
    if (
      (obj.side === 'breast_left' || obj.side === 'breast_right') &&
      typeof obj.startedAtMs === 'number' &&
      typeof obj.accumulatedSec === 'number' &&
      typeof obj.paused === 'boolean'
    ) {
      return {
        side: obj.side,
        startedAtMs: obj.startedAtMs,
        accumulatedSec: obj.accumulatedSec,
        paused: obj.paused,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export function getWakeWindowGuidanceMx(
  ageMonths: number,
  hoursSinceLastSleep: number | null,
): string {
  let windowLabel = 'siesta opcional / descanso nocturno';
  if (ageMonths < 3) {
    windowLabel = '45–90 min';
  } else if (ageMonths < 6) {
    windowLabel = '1.5–2.5 h';
  } else if (ageMonths < 12) {
    windowLabel = '2.5–3.5 h';
  } else if (ageMonths < 36) {
    windowLabel = '4–6 h';
  }

  if (hoursSinceLastSleep === null) {
    return `Ventana de vigilia orientativa: ${windowLabel}.`;
  }
  const awakeStr =
    hoursSinceLastSleep < 1
      ? `${Math.round(hoursSinceLastSleep * 60)} min`
      : `${hoursSinceLastSleep} h`;
  return `Lleva ${awakeStr} despierto · Ventana orientativa: ${windowLabel}.`;
}

function formatLocalHm(date: Date): string {
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

export function suggestNextNapWindowMx(
  ageMonths: number,
  lastSleepIso: string | null,
  now: Date = new Date(),
): string {
  if (ageMonths >= 36) {
    return 'Siesta opcional según su descanso diario.';
  }
  let minMin = 240;
  let maxMin = 360;
  if (ageMonths < 3) {
    minMin = 45;
    maxMin = 90;
  } else if (ageMonths < 6) {
    minMin = 90;
    maxMin = 150;
  } else if (ageMonths < 12) {
    minMin = 150;
    maxMin = 210;
  }

  if (!lastSleepIso) {
    return 'Registra una siesta para sugerir la siguiente ventana.';
  }
  const lastSleepMs = new Date(lastSleepIso).getTime();
  if (Number.isNaN(lastSleepMs)) {
    return 'Registra una siesta para sugerir la siguiente ventana.';
  }

  const start = new Date(lastSleepMs + minMin * 60_000);
  const end = new Date(lastSleepMs + maxMin * 60_000);
  const rangeStr = `${formatLocalHm(start)}–${formatLocalHm(end)}`;
  const nowMs = now.getTime();

  if (nowMs < start.getTime()) {
    return `Próxima siesta sugerida: ${rangeStr}`;
  }
  if (nowMs <= end.getTime()) {
    return `Ventana de siesta abierta ahora (${rangeStr})`;
  }
  return `Ventana sugerida pasada (${rangeStr}); observa señales de sueño.`;
}
