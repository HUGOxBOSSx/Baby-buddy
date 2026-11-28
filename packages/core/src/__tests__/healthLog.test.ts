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

  it('includes today summary, compact age, active alerts, recent events, and milestones', () => {
    const summaryToday = summarizeDailyLog(
      [
        {
          id: 'p1',
          kind: 'feed',
          timestampIso: '2026-11-25T08:00:00Z',
          feedType: 'pumping',
          volumeMl: 90,
        },
        {
          id: 'd1',
          kind: 'diaper',
          timestampIso: '2026-11-25T09:00:00Z',
          diaperKind: 'dirty',
          poopColor: 'blanca_palida',
        },
      ],
      {
        startDateKey: '2026-11-25',
        endDateKey: '2026-11-25',
      },
    );
    const summary3d = summarizeDailyLog([], {
      startDateKey: '2026-11-23',
      endDateKey: '2026-11-25',
    });
    const report = buildPediatricianReportText({
      profile: {
        id: 'c1',
        nicknameMx: 'Mateo',
        birthDateIso: '2026-11-05',
        ageMonths: 0,
        stageId: '0-3m',
        createdAtIso: '2026-11-05T00:00:00Z',
        updatedAtIso: '2026-11-05T00:00:00Z',
      },
      dailySummaryToday: summaryToday,
      dailySummary3d: summary3d,
      recentEvents: [
        {
          id: 'ev1',
          kind: 'event',
          timestampIso: '2026-11-25T09:30:00Z',
          eventType: 'reflux',
        },
        {
          id: 'ev2',
          kind: 'event',
          timestampIso: '2026-11-25T10:00:00Z',
          eventType: 'vomit',
        },
      ],
      stageMilestonesSummary: {
        done: 2,
        total: 5,
        stageLabelMx: '0–3 meses',
      },
      health: {
        ...EMPTY_HEALTH_LOG_STATE,
        completedMilestoneIds: ['m1', 'm2'],
      },
      generatedAtIso: '2026-11-25T12:00:00Z',
    });

    expect(report).toContain('Bebé: Mateo · Edad:');
    expect(report).toContain('--- Hoy (Registro diario) ---');
    expect(report).toContain('Extracción: 90 ml (promedio 90 ml/día)');
    expect(report).toContain('--- Alertas activas del registro diario ---');
    expect(report).toContain('--- Eventos recientes (reflujo, vómito, cólico, etc.) ---');
    expect(report).toContain('Resumen: Reflujo (1) · Vómito (1)');
    expect(report).toContain('2026-11-25 09:30: Reflujo');
    expect(report).toContain('Hitos del desarrollo marcados: 2 de 5 en etapa 0–3 meses (total acumulado: 2)');
  });
});
