import { parseDailyLogEntries, type DailyLogEntry } from './dailyLog';
import {
  EMPTY_HEALTH_LOG_STATE,
  parseHealthLogState,
  type HealthLogState,
} from './healthLog';
import type { ChildProfileSummary } from './profile';

export type SyncEntityType = 'profile' | 'daily_log' | 'health_log';
export type SyncOperation = 'upsert' | 'delete';

export interface SyncQueueItem {
  readonly id: string;
  readonly entityType: SyncEntityType;
  readonly entityId: string;
  readonly operation: SyncOperation;
  readonly updatedAtIso: string;
}

export interface FamilyBackupPayloadV1 {
  readonly schemaVersion: 1;
  readonly exportedAtIso: string;
  readonly childProfiles: readonly ChildProfileSummary[];
  readonly activeChildId: string | null;
  readonly dailyLogs: readonly DailyLogEntry[];
  readonly healthState: HealthLogState;
}

export function enqueueSyncMutation(
  queue: readonly SyncQueueItem[],
  item: SyncQueueItem,
): readonly SyncQueueItem[] {
  const filtered = queue.filter(
    (q) => !(q.entityType === item.entityType && q.entityId === item.entityId),
  );
  return [item, ...filtered];
}

export function parseSyncQueue(raw: string | null): readonly SyncQueueItem[] {
  if (!raw || raw.trim().length === 0) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is SyncQueueItem => {
      if (typeof item !== 'object' || item === null) return false;
      const obj = item as Record<string, unknown>;
      return (
        typeof obj.id === 'string' &&
        (obj.entityType === 'profile' ||
          obj.entityType === 'daily_log' ||
          obj.entityType === 'health_log') &&
        typeof obj.entityId === 'string' &&
        (obj.operation === 'upsert' || obj.operation === 'delete') &&
        typeof obj.updatedAtIso === 'string'
      );
    });
  } catch {
    return [];
  }
}

export function mergeDailyLogEntries(
  local: readonly DailyLogEntry[],
  incoming: readonly DailyLogEntry[],
): readonly DailyLogEntry[] {
  const byId = new Map<string, DailyLogEntry>();
  for (const item of local) {
    byId.set(item.id, item);
  }
  for (const item of incoming) {
    if (!byId.has(item.id)) {
      byId.set(item.id, item);
    }
  }
  return Array.from(byId.values()).sort(
    (a, b) =>
      new Date(b.timestampIso).getTime() - new Date(a.timestampIso).getTime(),
  );
}

function mergeByIdDesc<T extends { readonly id: string; readonly timestampIso: string }>(
  local: readonly T[],
  incoming: readonly T[],
): readonly T[] {
  const byId = new Map<string, T>();
  for (const item of local) {
    byId.set(item.id, item);
  }
  for (const item of incoming) {
    if (!byId.has(item.id)) {
      byId.set(item.id, item);
    }
  }
  return Array.from(byId.values()).sort(
    (a, b) =>
      new Date(b.timestampIso).getTime() - new Date(a.timestampIso).getTime(),
  );
}

export function mergeHealthLogState(
  local: HealthLogState,
  incoming: HealthLogState,
): HealthLogState {
  const vaccines = Array.from(
    new Set([...local.completedVaccineIds, ...incoming.completedVaccineIds]),
  );
  const milestones = Array.from(
    new Set([
      ...(local.completedMilestoneIds ?? []),
      ...(incoming.completedMilestoneIds ?? []),
    ]),
  );
  return {
    temperatures: mergeByIdDesc(local.temperatures, incoming.temperatures),
    medications: mergeByIdDesc(local.medications, incoming.medications),
    growth: mergeByIdDesc(local.growth, incoming.growth),
    completedVaccineIds: vaccines,
    completedMilestoneIds: milestones,
  };
}

export function mergeChildProfiles(
  local: readonly ChildProfileSummary[],
  incoming: readonly ChildProfileSummary[],
): readonly ChildProfileSummary[] {
  const byId = new Map<string, ChildProfileSummary>();
  for (const p of local) {
    byId.set(p.id, p);
  }
  for (const p of incoming) {
    const existing = byId.get(p.id);
    if (!existing || p.updatedAtIso > existing.updatedAtIso) {
      byId.set(p.id, p);
    }
  }
  return Array.from(byId.values());
}

export function exportFamilyBackupJson(
  input: Omit<FamilyBackupPayloadV1, 'schemaVersion'>,
): string {
  const payload: FamilyBackupPayloadV1 = {
    schemaVersion: 1,
    ...input,
  };
  return JSON.stringify(payload, null, 2);
}

export function parseFamilyBackupJson(
  raw: string,
): FamilyBackupPayloadV1 | null {
  if (!raw || raw.trim().length === 0) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return null;
    const obj = parsed as Record<string, unknown>;
    if (obj.schemaVersion !== 1 || typeof obj.exportedAtIso !== 'string') {
      return null;
    }
    const childProfiles = Array.isArray(obj.childProfiles)
      ? obj.childProfiles.filter(
          (p): p is ChildProfileSummary =>
            typeof p === 'object' &&
            p !== null &&
            typeof (p as Record<string, unknown>).id === 'string' &&
            typeof (p as Record<string, unknown>).nicknameMx === 'string' &&
            typeof (p as Record<string, unknown>).ageMonths === 'number' &&
            typeof (p as Record<string, unknown>).stageId === 'string',
        )
      : [];
    const activeChildId =
      typeof obj.activeChildId === 'string' ? obj.activeChildId : null;
    const dailyLogs = parseDailyLogEntries(
      Array.isArray(obj.dailyLogs) ? JSON.stringify(obj.dailyLogs) : null,
    );
    const healthState =
      typeof obj.healthState === 'object' && obj.healthState !== null
        ? parseHealthLogState(JSON.stringify(obj.healthState))
        : EMPTY_HEALTH_LOG_STATE;

    return {
      schemaVersion: 1,
      exportedAtIso: obj.exportedAtIso,
      childProfiles,
      activeChildId,
      dailyLogs,
      healthState,
    };
  } catch {
    return null;
  }
}
