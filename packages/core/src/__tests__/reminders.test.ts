import { describe, expect, it } from 'vitest';
import { validateSpanishClinicalCopy } from '../compliance/guardrails';
import { summarizeDailyLog } from '../domain/dailyLog';
import { EMPTY_HEALTH_LOG_STATE } from '../domain/healthLog';
import { createChildProfileSummary } from '../domain/profile';
import { computeLocalRemindersMx } from '../domain/reminders';

describe('local reminders domain', () => {
  it('flags due vaccines from Cartilla MX and passes clinical copy checks', () => {
    const profile = createChildProfileSummary({
      id: 'b1',
      nicknameMx: 'Mateo',
      ageMonths: 2,
    });
    const summary = summarizeDailyLog([], {
      startDateKey: '2026-11-27',
      endDateKey: '2026-11-27',
    });

    const reminders = computeLocalRemindersMx({
      profile,
      dailySummary: summary,
      healthState: EMPTY_HEALTH_LOG_STATE,
    });

    expect(reminders.length).toBeGreaterThan(0);
    expect(reminders[0]?.kind).toBe('vaccine');
    expect(reminders[0]?.urgency).toBe('due');
    for (const r of reminders) {
      const check = validateSpanishClinicalCopy(`${r.titleMx}. ${r.detailMx}`);
      expect(check.valid).toBe(true);
    }
  });

  it('flags upcoming vaccine, feed interval, and open nap window', () => {
    const profile = createChildProfileSummary({
      id: 'b2',
      nicknameMx: 'Sofía',
      ageMonths: 1,
    });
    const now = new Date(2026, 10, 27, 14, 0, 0);
    const summary = summarizeDailyLog(
      [
        {
          id: 'f1',
          kind: 'feed',
          timestampIso: new Date(2026, 10, 27, 10, 0, 0).toISOString(),
          feedType: 'breast_left',
          durationSec: 600,
        },
        {
          id: 's1',
          kind: 'sleep',
          timestampIso: new Date(2026, 10, 27, 13, 0, 0).toISOString(),
          durationSec: 2700,
        },
      ],
      { startDateKey: '2026-11-27', endDateKey: '2026-11-27' },
      now,
    );

    const reminders = computeLocalRemindersMx({
      profile,
      dailySummary: summary,
      healthState: {
        ...EMPTY_HEALTH_LOG_STATE,
        completedVaccineIds: ['bcg-0m', 'hepb-0m'],
      },
      now,
    });

    const kinds = reminders.map((r) => r.kind);
    expect(kinds).toContain('vaccine');
    expect(kinds).toContain('feed');
    expect(kinds).toContain('nap');
    expect(reminders.every((r) => r.urgency === 'info')).toBe(true);
  });
});
