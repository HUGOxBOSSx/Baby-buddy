import { describe, expect, it } from 'vitest';
import { EMPTY_HEALTH_LOG_STATE } from '../domain/healthLog';
import { createChildProfileSummary } from '../domain/profile';
import {
  enqueueSyncMutation,
  exportFamilyBackupJson,
  mergeChildProfiles,
  mergeDailyLogEntries,
  mergeHealthLogState,
  parseFamilyBackupJson,
  parseSyncQueue,
} from '../domain/syncQueue';

describe('syncQueue and family backup', () => {
  it('coalesces idempotent mutations by entityType and entityId', () => {
    const q1 = enqueueSyncMutation([], {
      id: 's1',
      entityType: 'daily_log',
      entityId: 'feed-1',
      operation: 'upsert',
      updatedAtIso: '2026-11-27T10:00:00Z',
    });
    const q2 = enqueueSyncMutation(q1, {
      id: 's2',
      entityType: 'daily_log',
      entityId: 'feed-1',
      operation: 'delete',
      updatedAtIso: '2026-11-27T10:05:00Z',
    });

    expect(q2).toHaveLength(1);
    expect(q2[0]?.operation).toBe('delete');
    expect(parseSyncQueue(JSON.stringify(q2))).toHaveLength(1);
    expect(parseSyncQueue('invalid')).toEqual([]);
  });

  it('merges profiles, daily logs, and health state without duplicates', () => {
    const pLocal = createChildProfileSummary({
      id: 'b1',
      nicknameMx: 'Mateo',
      ageMonths: 2,
      nowIso: '2026-11-27T08:00:00Z',
    });
    const pIncoming = {
      ...pLocal,
      ageMonths: 3,
      updatedAtIso: '2026-11-27T12:00:00Z',
    };
    const mergedProfiles = mergeChildProfiles([pLocal], [pIncoming]);
    expect(mergedProfiles).toHaveLength(1);
    expect(mergedProfiles[0]?.ageMonths).toBe(3);

    const mergedLogs = mergeDailyLogEntries(
      [
        {
          id: 'f1',
          kind: 'feed',
          timestampIso: '2026-11-27T08:00:00Z',
          feedType: 'bottle',
          volumeMl: 90,
        },
      ],
      [
        {
          id: 'f1',
          kind: 'feed',
          timestampIso: '2026-11-27T08:00:00Z',
          feedType: 'bottle',
          volumeMl: 90,
        },
        {
          id: 's1',
          kind: 'sleep',
          timestampIso: '2026-11-27T10:00:00Z',
          durationSec: 1800,
        },
      ],
    );
    expect(mergedLogs).toHaveLength(2);
    expect(mergedLogs[0]?.id).toBe('s1');

    const mergedHealth = mergeHealthLogState(
      { ...EMPTY_HEALTH_LOG_STATE, completedVaccineIds: ['bcg-0m'] },
      {
        ...EMPTY_HEALTH_LOG_STATE,
        completedVaccineIds: ['bcg-0m', 'hepb-0m'],
        completedMilestoneIds: ['m0-motor-cabeza'],
      },
    );
    expect(mergedHealth.completedVaccineIds).toEqual(['bcg-0m', 'hepb-0m']);
    expect(mergedHealth.completedMilestoneIds).toEqual(['m0-motor-cabeza']);
  });

  it('exports and parses FamilyBackupPayloadV1 safely', () => {
    const p = createChildProfileSummary({
      id: 'b1',
      nicknameMx: 'Sofía',
      ageMonths: 4,
    });
    const json = exportFamilyBackupJson({
      exportedAtIso: '2026-11-27T12:00:00Z',
      childProfiles: [p],
      activeChildId: p.id,
      dailyLogs: [],
      healthState: EMPTY_HEALTH_LOG_STATE,
    });
    const parsed = parseFamilyBackupJson(json);
    expect(parsed?.schemaVersion).toBe(1);
    expect(parsed?.childProfiles[0]?.nicknameMx).toBe('Sofía');
    expect(parseFamilyBackupJson('{"schemaVersion":99}')).toBeNull();
  });
});
