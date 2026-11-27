import { describe, expect, it } from 'vitest';
import { summarizeDailyLog } from '../domain/dailyLog';
import {
  EMPTY_HEALTH_LOG_STATE,
  MX_VACCINE_CHECKLIST,
  buildPediatricianReportText,
  evaluateTemperatureAlertMx,
  parseHealthLogState,
} from '../domain/healthLog';

describe('healthLog domain', () => {
  it('evaluates temperature alerts with <3m 38.0 °C hard gate', () => {
    expect(evaluateTemperatureAlertMx(38.0, 2).level).toBe('urgent_911');
    expect(evaluateTemperatureAlertMx(38.2, 6).level).toBe('caution');
    expect(evaluateTemperatureAlertMx(36.8, 1).level).toBe('normal');
  });

  it('provides MX vaccine checklist and parses health state safely', () => {
    expect(MX_VACCINE_CHECKLIST.length).toBeGreaterThanOrEqual(10);
    expect(parseHealthLogState(null)).toEqual(EMPTY_HEALTH_LOG_STATE);
    const parsed = parseHealthLogState(
      JSON.stringify({
        temperatures: [{ id: 't1', timestampIso: '2026-11-25T10:00:00Z', tempC: 37.1 }],
        medications: [],
        growth: [{ id: 'g1', timestampIso: '2026-11-25T10:00:00Z', weightKg: 5.4, heightCm: 58 }],
        completedVaccineIds: ['bcg-0m'],
      }),
    );
    expect(parsed.temperatures).toHaveLength(1);
    expect(parsed.completedVaccineIds).toEqual(['bcg-0m']);
  });

  it('builds a metric-only pediatrician report in Spanish', () => {
    const summary = summarizeDailyLog([], {
      startDateKey: '2026-11-23',
      endDateKey: '2026-11-25',
    });
    const report = buildPediatricianReportText({
      profile: null,
      dailySummary3d: summary,
      health: {
        ...EMPTY_HEALTH_LOG_STATE,
        growth: [
          {
            id: 'g1',
            timestampIso: '2026-11-25T10:00:00Z',
            weightKg: 6.2,
            heightCm: 62,
            headCircumferenceCm: 41.5,
          },
        ],
      },
      generatedAtIso: '2026-11-25T12:00:00Z',
    });
    expect(report).toContain('REPORTE PARA PEDIATRA');
    expect(report).toContain('6.2 kg');
    expect(report).toContain('62 cm');
    expect(report).toContain('PC 41.5 cm');
  });

  it('includes 7-day and 30-day monthly averages in pediatrician report when provided', () => {
    const summary3d = summarizeDailyLog([], {
      startDateKey: '2026-11-23',
      endDateKey: '2026-11-25',
    });
    const summary7d = summarizeDailyLog([], {
      startDateKey: '2026-11-19',
      endDateKey: '2026-11-25',
    });
    const summary30d = summarizeDailyLog(
      [
        {
          id: 'f1',
          kind: 'feed',
          timestampIso: '2026-11-10T10:00:00Z',
          feedType: 'bottle',
          volumeMl: 300,
        },
      ],
      {
        startDateKey: '2026-10-27',
        endDateKey: '2026-11-25',
      },
    );
    const report = buildPediatricianReportText({
      profile: null,
      dailySummary3d: summary3d,
      dailySummary7d: summary7d,
      dailySummary30d: summary30d,
      health: EMPTY_HEALTH_LOG_STATE,
      generatedAtIso: '2026-11-25T12:00:00Z',
    });
    expect(report).toContain('Promedio últimos 7 días');
    expect(report).toContain('Promedio mensual (últimos 30 días)');
    expect(report).toContain('10 ml/día');
    expect(report).toContain('Sueño:');
  });
});
