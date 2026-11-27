import { describe, expect, it } from 'vitest';
import {
  computeTimerElapsedSec,
  countInclusiveDays,
  formatTimerClock,
  getWakeWindowGuidanceMx,
  resolveDateRangePreset,
  suggestNextNapWindowMx,
  summarizeDailyLog,
  type ActiveFeedTimer,
  type DailyLogEntry,
} from '../domain/dailyLog';

describe('dailyLog domain', () => {
  it('resolves date range presets including last_week (Mon-Sun)', () => {
    // Wednesday 2026-11-25
    const wed = new Date(2026, 10, 25, 10, 0, 0);
    expect(resolveDateRangePreset('today', wed)).toEqual({
      startDateKey: '2026-11-25',
      endDateKey: '2026-11-25',
    });
    expect(resolveDateRangePreset('last_3_days', wed)).toEqual({
      startDateKey: '2026-11-23',
      endDateKey: '2026-11-25',
    });
    expect(resolveDateRangePreset('last_7_days', wed)).toEqual({
      startDateKey: '2026-11-19',
      endDateKey: '2026-11-25',
    });
    const lastWeek = resolveDateRangePreset('last_week', wed);
    expect(lastWeek).toEqual({
      startDateKey: '2026-11-16',
      endDateKey: '2026-11-22',
    });
    expect(countInclusiveDays(lastWeek)).toBe(7);

    const last30 = resolveDateRangePreset('last_30_days', wed);
    expect(last30).toEqual({
      startDateKey: '2026-10-27',
      endDateKey: '2026-11-25',
    });
    expect(countInclusiveDays(last30)).toBe(30);

    const thisMonth = resolveDateRangePreset('this_month', wed);
    expect(thisMonth).toEqual({
      startDateKey: '2026-11-01',
      endDateKey: '2026-11-25',
    });
    expect(countInclusiveDays(thisMonth)).toBe(25);
  });

  it('computes monthly averages over a 30-day window', () => {
    const now = new Date(2026, 10, 25, 18, 0, 0);
    const entries: DailyLogEntry[] = [
      {
        id: 'm1',
        kind: 'feed',
        timestampIso: new Date(2026, 10, 1, 9, 0, 0).toISOString(),
        feedType: 'bottle',
        volumeMl: 300,
      },
      {
        id: 'm2',
        kind: 'sleep',
        timestampIso: new Date(2026, 10, 25, 9, 0, 0).toISOString(),
        durationSec: 1800,
      },
    ];
    const range30 = resolveDateRangePreset('last_30_days', now);
    const summary30 = summarizeDailyLog(entries, range30, now);
    expect(summary30.daysInRange).toBe(30);
    expect(summary30.totalBottleMl).toBe(300);
    expect(summary30.avgBottleMlPerDay).toBe(10);
    expect(summary30.totalSleepMin).toBe(30);
    expect(summary30.avgSleepMinPerDay).toBe(1);
  });

  it('computes daily averages, >8h wet diaper alert, and stool alert', () => {
    const now = new Date(2026, 10, 25, 18, 0, 0);
    const entries: DailyLogEntry[] = [
      {
        id: 'f1',
        kind: 'feed',
        timestampIso: new Date(2026, 10, 25, 8, 0, 0).toISOString(),
        feedType: 'breast_left',
        durationSec: 600,
      },
      {
        id: 'f2',
        kind: 'feed',
        timestampIso: new Date(2026, 10, 24, 12, 0, 0).toISOString(),
        feedType: 'bottle',
        volumeMl: 90,
      },
      {
        id: 'd1',
        kind: 'diaper',
        timestampIso: new Date(2026, 10, 25, 9, 0, 0).toISOString(),
        diaperKind: 'both',
        poopColor: 'roja',
      },
    ];

    const summary = summarizeDailyLog(
      entries,
      { startDateKey: '2026-11-23', endDateKey: '2026-11-25' },
      now,
    );

    expect(summary.daysInRange).toBe(3);
    expect(summary.totalFeeds).toBe(2);
    expect(summary.avgFeedsPerDay).toBe(0.7);
    expect(summary.totalBottleMl).toBe(90);
    expect(summary.avgBottleMlPerDay).toBe(30);
    expect(summary.totalDiapers).toBe(1);
    expect(summary.lastBreastSide).toBe('breast_left');
    expect(summary.hoursSinceLastWetDiaper).toBe(9);
    expect(summary.hydrationAlertMx).toContain('9 h');
    expect(summary.stoolAlertMx).toContain('valoración médica');
  });

  it('computes timer elapsed seconds for running and paused states', () => {
    const running: ActiveFeedTimer = {
      side: 'breast_right',
      startedAtMs: 1_000,
      accumulatedSec: 30,
      paused: false,
    };
    expect(computeTimerElapsedSec(running, 16_000)).toBe(45);
    expect(formatTimerClock(45)).toBe('00:45');

    const paused: ActiveFeedTimer = {
      ...running,
      accumulatedSec: 125,
      paused: true,
    };
    expect(computeTimerElapsedSec(paused, 999_999)).toBe(125);
    expect(formatTimerClock(125)).toBe('02:05');
  });

  it('summarizes sleep entries and computes wake window guidance', () => {
    const now = new Date('2026-11-25T12:00:00.000Z');
    const summary = summarizeDailyLog(
      [
        {
          id: 's1',
          kind: 'sleep',
          timestampIso: '2026-11-25T10:30:00.000Z',
          durationSec: 3600,
          noteMx: 'Siesta tranquila',
        },
      ],
      { startDateKey: '2026-11-25', endDateKey: '2026-11-25' },
      now,
    );
    expect(summary.totalSleeps).toBe(1);
    expect(summary.totalSleepMin).toBe(60);
    expect(summary.hoursSinceLastSleep).toBe(1.5);
    expect(getWakeWindowGuidanceMx(2, summary.hoursSinceLastSleep)).toContain(
      '45–90 min',
    );
  });

  it('tracks pumping separately from feeds, counts solids, and suggests nap windows', () => {
    const baseSleep = new Date(2026, 10, 25, 10, 0, 0);
    const entries: DailyLogEntry[] = [
      {
        id: 'p1',
        kind: 'feed',
        timestampIso: new Date(2026, 10, 25, 9, 0, 0).toISOString(),
        feedType: 'pumping',
        volumeMl: 120,
      },
      {
        id: 'sol1',
        kind: 'feed',
        timestampIso: new Date(2026, 10, 25, 11, 0, 0).toISOString(),
        feedType: 'solids',
        foodMx: 'Aguacate',
        isNewFood: true,
      },
      {
        id: 'sl1',
        kind: 'sleep',
        timestampIso: baseSleep.toISOString(),
        durationSec: 2700,
      },
    ];
    const summary = summarizeDailyLog(
      entries,
      { startDateKey: '2026-11-25', endDateKey: '2026-11-25' },
      new Date(2026, 10, 25, 11, 45, 0),
    );
    expect(summary.totalFeeds).toBe(1);
    expect(summary.pumpingFeeds).toBe(1);
    expect(summary.totalPumpingMl).toBe(120);
    expect(summary.solidsCount).toBe(1);
    expect(summary.avgSolidsPerDay).toBe(1);

    // 4 months -> 90..150 min window -> 11:30–12:30
    expect(
      suggestNextNapWindowMx(4, summary.lastSleepIso, new Date(2026, 10, 25, 11, 0, 0)),
    ).toContain('Próxima siesta sugerida: 11:30–12:30');
    expect(
      suggestNextNapWindowMx(4, summary.lastSleepIso, new Date(2026, 10, 25, 12, 0, 0)),
    ).toContain('Ventana de siesta abierta ahora (11:30–12:30)');
    expect(
      suggestNextNapWindowMx(4, summary.lastSleepIso, new Date(2026, 10, 25, 13, 0, 0)),
    ).toContain('Ventana sugerida pasada (11:30–12:30)');
  });
});
