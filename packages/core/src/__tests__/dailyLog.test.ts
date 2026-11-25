import { describe, expect, it } from 'vitest';
import {
  computeTimerElapsedSec,
  countInclusiveDays,
  formatTimerClock,
  resolveDateRangePreset,
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
});
