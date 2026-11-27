'use client';

import {
  DEFAULT_APP_PREFERENCES,
  DEFAULT_THEME_SCHEDULE,
  EMPTY_HEALTH_LOG_STATE,
  LOCAL_STORAGE_KEYS,
  LOCAL_STORAGE_PREFIX,
  LocalAccountLifecycleAdapter,
  createChildProfileSummary,
  enqueueSyncMutation,
  exportFamilyBackupJson,
  isStageId,
  isValidHour,
  mergeChildProfiles,
  mergeDailyLogEntries,
  mergeHealthLogState,
  parseActiveFeedTimer,
  parseDailyLogEntries,
  parseFamilyBackupJson,
  parseHealthLogState,
  parseSyncQueue,
  resolveEffectiveThemeMode,
  resolveLiveChildProfile,
  type AccountDeletionResult,
  type ActiveFeedTimer,
  type ChildProfileSummary,
  type ChildSex,
  type CreateChildProfileInput,
  type DailyLogEntry,
  type GrowthLogEntry,
  type HealthLogState,
  type KeyValueStoragePort,
  type MedicationLogEntry,
  type StageId,
  type StoredSnapshotSummary,
  type TemperatureLogEntry,
  type ThemeMode,
  type ThemeScheduleConfig,
} from '@baby-buddy/core';

export class BrowserLocalStorageAdapter implements KeyValueStoragePort {
  private readonly fallback = new Map<string, string>();

  getItemSync(key: string): string | null {
    if (typeof window === 'undefined') {
      return this.fallback.get(key) ?? null;
    }
    try {
      const value = window.localStorage.getItem(key);
      if (value !== null) {
        return value;
      }
      return this.fallback.get(key) ?? null;
    } catch {
      return this.fallback.get(key) ?? null;
    }
  }

  setItemSync(key: string, value: string): void {
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(key, value);
        this.fallback.delete(key);
        return;
      } catch {
        // Fallback below when localStorage is unavailable or quota-restricted.
      }
    }
    this.fallback.set(key, value);
  }

  removeItemSync(key: string): void {
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.removeItem(key);
      } catch {
        // Ignore storage errors and clear fallback below.
      }
    }
    this.fallback.delete(key);
  }

  keysSync(): string[] {
    const keySet = new Set<string>(this.fallback.keys());
    if (typeof window !== 'undefined') {
      try {
        for (let index = 0; index < window.localStorage.length; index += 1) {
          const k = window.localStorage.key(index);
          if (k !== null) {
            keySet.add(k);
          }
        }
      } catch {
        // Return fallback keys if localStorage enumeration fails.
      }
    }
    return Array.from(keySet);
  }

  async getItem(key: string): Promise<string | null> {
    return this.getItemSync(key);
  }

  async setItem(key: string, value: string): Promise<void> {
    this.setItemSync(key, value);
  }

  async removeItem(key: string): Promise<void> {
    this.removeItemSync(key);
  }

  async keys(): Promise<string[]> {
    return this.keysSync();
  }
}

export const browserStorage = new BrowserLocalStorageAdapter();
export const accountLifecycleAdapter = new LocalAccountLifecycleAdapter(
  browserStorage,
);

export interface LocalAppSnapshot {
  readonly themeMode: ThemeMode;
  readonly themeSchedule: ThemeScheduleConfig;
  readonly activeStageId: StageId;
  readonly onboardingAccepted: boolean;
  readonly childProfile: ChildProfileSummary | null;
  readonly childProfiles: readonly ChildProfileSummary[];
  readonly dailyLogs: readonly DailyLogEntry[];
  readonly activeFeedTimer: ActiveFeedTimer | null;
  readonly healthState: HealthLogState;
  readonly pendingSyncCount: number;
  readonly snapshotSummary: StoredSnapshotSummary;
  readonly statusMessage: string;
  readonly lastDeletionResult: AccountDeletionResult | null;
}

export const SERVER_APP_SNAPSHOT: LocalAppSnapshot = {
  themeMode: DEFAULT_APP_PREFERENCES.themeMode,
  themeSchedule: DEFAULT_THEME_SCHEDULE,
  activeStageId: DEFAULT_APP_PREFERENCES.activeStageId,
  onboardingAccepted: false,
  childProfile: null,
  childProfiles: [],
  dailyLogs: [],
  activeFeedTimer: null,
  healthState: EMPTY_HEALTH_LOG_STATE,
  pendingSyncCount: 0,
  snapshotSummary: {
    hasActiveProfile: false,
    onboardingAccepted: false,
    itemCount: 0,
    keys: [],
  },
  statusMessage: '',
  lastDeletionResult: null,
};

const listeners = new Set<() => void>();
let transientStatusMessage = '';
let transientDeletionResult: AccountDeletionResult | null = null;
let lastSnapshotSignature: string | null = null;
let cachedSnapshot: LocalAppSnapshot = SERVER_APP_SNAPSHOT;

function parseChildProfile(raw: string | null): ChildProfileSummary | null {
  if (!raw || raw.trim().length === 0) {
    return null;
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) {
      return null;
    }
    const candidate = parsed as Record<string, unknown>;
    if (
      typeof candidate.id !== 'string' ||
      typeof candidate.nicknameMx !== 'string' ||
      typeof candidate.ageMonths !== 'number' ||
      typeof candidate.stageId !== 'string' ||
      !isStageId(candidate.stageId) ||
      typeof candidate.createdAtIso !== 'string' ||
      typeof candidate.updatedAtIso !== 'string'
    ) {
      return null;
    }
    const sex: ChildSex =
      candidate.sex === 'niño' ||
      candidate.sex === 'niña' ||
      candidate.sex === 'no_especificado'
        ? candidate.sex
        : 'no_especificado';
    return resolveLiveChildProfile({
      id: candidate.id,
      nicknameMx: candidate.nicknameMx,
      ageMonths: candidate.ageMonths,
      stageId: candidate.stageId,
      sex,
      birthDateIso:
        typeof candidate.birthDateIso === 'string'
          ? candidate.birthDateIso
          : undefined,
      createdAtIso: candidate.createdAtIso,
      updatedAtIso: candidate.updatedAtIso,
    });
  } catch {
    return null;
  }
}

function parseThemeSchedule(raw: string | null): ThemeScheduleConfig {
  if (!raw || raw.trim().length === 0) {
    return DEFAULT_THEME_SCHEDULE;
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) {
      return DEFAULT_THEME_SCHEDULE;
    }
    const candidate = parsed as Record<string, unknown>;
    const mode = candidate.mode === 'manual' ? 'manual' : 'auto';
    const nightStartHour =
      typeof candidate.nightStartHour === 'number' &&
      isValidHour(candidate.nightStartHour)
        ? candidate.nightStartHour
        : DEFAULT_THEME_SCHEDULE.nightStartHour;
    const nightEndHour =
      typeof candidate.nightEndHour === 'number' &&
      isValidHour(candidate.nightEndHour)
        ? candidate.nightEndHour
        : DEFAULT_THEME_SCHEDULE.nightEndHour;
    return { mode, nightStartHour, nightEndHour };
  } catch {
    return DEFAULT_THEME_SCHEDULE;
  }
}

export function applyThemeToDocument(
  themeMode: ThemeMode,
  onboardingAccepted: boolean,
): void {
  if (typeof document === 'undefined') {
    return;
  }
  const root = document.documentElement;
  if (themeMode === 'night_3am') {
    root.dataset.theme = 'night-3am';
  } else {
    delete root.dataset.theme;
  }
  if (onboardingAccepted) {
    root.dataset.onboarding = 'accepted';
  } else {
    delete root.dataset.onboarding;
  }
}

export function notifyLocalStoreChange(): void {
  for (const listener of listeners) {
    listener();
  }
}

export function subscribeLocalStore(listener: () => void): () => void {
  listeners.add(listener);
  if (typeof window === 'undefined') {
    return () => {
      listeners.delete(listener);
    };
  }

  const handleStorage = (event: StorageEvent) => {
    if (
      event.key === null ||
      event.key.startsWith(LOCAL_STORAGE_PREFIX)
    ) {
      listener();
    }
  };

  window.addEventListener('storage', handleStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', handleStorage);
  };
}

export function getServerAppSnapshot(): LocalAppSnapshot {
  return SERVER_APP_SNAPSHOT;
}

export function getLocalAppSnapshot(): LocalAppSnapshot {
  if (typeof window === 'undefined') {
    return SERVER_APP_SNAPSHOT;
  }

  const rawTheme = browserStorage.getItemSync(LOCAL_STORAGE_KEYS.themeMode);
  const rawSchedule = browserStorage.getItemSync(
    LOCAL_STORAGE_KEYS.themeSchedule,
  );
  const rawStage = browserStorage.getItemSync(LOCAL_STORAGE_KEYS.activeStageId);
  const rawOnboarding = browserStorage.getItemSync(
    LOCAL_STORAGE_KEYS.onboardingAcceptedAt,
  );
  const rawDailyLogs = browserStorage.getItemSync(LOCAL_STORAGE_KEYS.dailyLogs);
  const rawActiveTimer = browserStorage.getItemSync(
    LOCAL_STORAGE_KEYS.activeFeedTimer,
  );
  const rawHealthState = browserStorage.getItemSync(
    LOCAL_STORAGE_KEYS.healthState,
  );
  const rawProfile = browserStorage.getItemSync(
    LOCAL_STORAGE_KEYS.childProfile,
  );
  const rawProfiles = browserStorage.getItemSync(
    LOCAL_STORAGE_KEYS.childProfiles,
  );
  const rawActiveChildId = browserStorage.getItemSync(
    LOCAL_STORAGE_KEYS.activeChildId,
  );
  const rawSyncQueue = browserStorage.getItemSync(
    LOCAL_STORAGE_KEYS.syncQueue,
  );
  const ownedKeys = browserStorage
    .keysSync()
    .filter((k) => k.startsWith(LOCAL_STORAGE_PREFIX))
    .sort();

  const deletionSig = transientDeletionResult
    ? `${transientDeletionResult.deletedAtIso}:${transientDeletionResult.deletedKeysCount}`
    : '';
  const currentHour = new Date().getHours();

  const signature = [
    rawTheme ?? '',
    rawSchedule ?? '',
    String(currentHour),
    rawStage ?? '',
    rawOnboarding ?? '',
    rawProfile ?? '',
    rawProfiles ?? '',
    rawActiveChildId ?? '',
    rawSyncQueue ?? '',
    ownedKeys.join(','),
    transientStatusMessage,
    deletionSig,
  ].join('\n');

  if (signature === lastSnapshotSignature) {
    return cachedSnapshot;
  }

  const manualThemeMode: ThemeMode =
    rawTheme === 'night_3am' ? 'night_3am' : 'day';
  const themeSchedule = parseThemeSchedule(rawSchedule);
  const themeMode = resolveEffectiveThemeMode(
    themeSchedule,
    manualThemeMode,
    currentHour,
  );
  const singleProfile = parseChildProfile(rawProfile);
  let parsedProfiles: ChildProfileSummary[] = [];
  if (rawProfiles && rawProfiles.trim().length > 0) {
    try {
      const arr: unknown = JSON.parse(rawProfiles);
      if (Array.isArray(arr)) {
        parsedProfiles = arr
          .map((item) => parseChildProfile(JSON.stringify(item)))
          .filter((p): p is ChildProfileSummary => p !== null);
      }
    } catch {
      parsedProfiles = [];
    }
  }
  const childProfiles =
    parsedProfiles.length > 0
      ? parsedProfiles
      : singleProfile
        ? [singleProfile]
        : [];
  const childProfile =
    (rawActiveChildId
      ? childProfiles.find((p) => p.id === rawActiveChildId)
      : undefined) ??
    childProfiles[0] ??
    singleProfile;
  const activeStageId: StageId = childProfile
    ? childProfile.stageId
    : rawStage !== null && isStageId(rawStage)
      ? rawStage
      : DEFAULT_APP_PREFERENCES.activeStageId;
  const onboardingAccepted =
    rawOnboarding !== null && rawOnboarding.trim().length > 0;

  cachedSnapshot = {
    themeMode,
    themeSchedule,
    activeStageId,
    onboardingAccepted,
    childProfile,
    childProfiles,
    dailyLogs: parseDailyLogEntries(rawDailyLogs),
    activeFeedTimer: parseActiveFeedTimer(rawActiveTimer),
    healthState: parseHealthLogState(rawHealthState),
    pendingSyncCount: parseSyncQueue(rawSyncQueue).length,
    snapshotSummary: {
      hasActiveProfile: rawProfile !== null && rawProfile.trim().length > 0,
      onboardingAccepted,
      itemCount: ownedKeys.length,
      keys: ownedKeys,
    },
    statusMessage: transientStatusMessage,
    lastDeletionResult: transientDeletionResult,
  };
  lastSnapshotSignature = signature;
  return cachedSnapshot;
}

export function setStoredThemeMode(mode: ThemeMode): void {
  browserStorage.setItemSync(LOCAL_STORAGE_KEYS.themeMode, mode);
  const currentSchedule = getLocalAppSnapshot().themeSchedule;
  const manualSchedule: ThemeScheduleConfig = {
    ...currentSchedule,
    mode: 'manual',
  };
  browserStorage.setItemSync(
    LOCAL_STORAGE_KEYS.themeSchedule,
    JSON.stringify(manualSchedule),
  );
  const snapshot = getLocalAppSnapshot();
  applyThemeToDocument(mode, snapshot.onboardingAccepted);
  transientStatusMessage =
    mode === 'night_3am'
      ? 'Modo nocturno activado manualmente.'
      : 'Modo Día Calma activado manualmente.';
  notifyLocalStoreChange();
}

export function setStoredThemeSchedule(schedule: ThemeScheduleConfig): void {
  browserStorage.setItemSync(
    LOCAL_STORAGE_KEYS.themeSchedule,
    JSON.stringify(schedule),
  );
  const snapshot = getLocalAppSnapshot();
  applyThemeToDocument(snapshot.themeMode, snapshot.onboardingAccepted);
  transientStatusMessage =
    schedule.mode === 'auto'
      ? `Modo noche automático configurado de ${schedule.nightStartHour}:00 a ${schedule.nightEndHour}:00.`
      : 'Modo de tema manual activado.';
  notifyLocalStoreChange();
}

function recordSyncMutation(
  entityType: 'profile' | 'daily_log' | 'health_log',
  entityId: string,
  operation: 'upsert' | 'delete',
): void {
  const currentQueue = parseSyncQueue(
    browserStorage.getItemSync(LOCAL_STORAGE_KEYS.syncQueue),
  );
  const nowIso = new Date().toISOString();
  const nextQueue = enqueueSyncMutation(currentQueue, {
    id: `sync-${Date.now()}-${entityId}`,
    entityType,
    entityId,
    operation,
    updatedAtIso: nowIso,
  });
  browserStorage.setItemSync(
    LOCAL_STORAGE_KEYS.syncQueue,
    JSON.stringify(nextQueue),
  );
}

export function saveStoredChildProfile(
  input: Omit<CreateChildProfileInput, 'id'>,
): ChildProfileSummary {
  const snap = getLocalAppSnapshot();
  const existing = snap.childProfile;
  const profile = createChildProfileSummary({
    ...input,
    id: existing?.id ?? 'bebe-local-01',
  });
  const nextList = snap.childProfiles.some((p) => p.id === profile.id)
    ? snap.childProfiles.map((p) => (p.id === profile.id ? profile : p))
    : [...snap.childProfiles, profile];
  browserStorage.setItemSync(
    LOCAL_STORAGE_KEYS.childProfiles,
    JSON.stringify(nextList),
  );
  browserStorage.setItemSync(LOCAL_STORAGE_KEYS.activeChildId, profile.id);
  browserStorage.setItemSync(
    LOCAL_STORAGE_KEYS.childProfile,
    JSON.stringify(profile),
  );
  browserStorage.setItemSync(LOCAL_STORAGE_KEYS.activeStageId, profile.stageId);
  recordSyncMutation('profile', profile.id, 'upsert');
  transientStatusMessage = `Datos de ${profile.nicknameMx} guardados (${profile.stageId}).`;
  notifyLocalStoreChange();
  return profile;
}

export function addStoredChildProfile(
  input: Omit<CreateChildProfileInput, 'id'>,
): ChildProfileSummary {
  const snap = getLocalAppSnapshot();
  const profile = createChildProfileSummary({
    ...input,
    id: `bebe-${Date.now()}`,
  });
  const nextList = [...snap.childProfiles, profile];
  browserStorage.setItemSync(
    LOCAL_STORAGE_KEYS.childProfiles,
    JSON.stringify(nextList),
  );
  browserStorage.setItemSync(LOCAL_STORAGE_KEYS.activeChildId, profile.id);
  browserStorage.setItemSync(
    LOCAL_STORAGE_KEYS.childProfile,
    JSON.stringify(profile),
  );
  browserStorage.setItemSync(LOCAL_STORAGE_KEYS.activeStageId, profile.stageId);
  recordSyncMutation('profile', profile.id, 'upsert');
  transientStatusMessage = `Perfil agregado: ${profile.nicknameMx}.`;
  notifyLocalStoreChange();
  return profile;
}

export function selectStoredChildProfile(id: string): void {
  const snap = getLocalAppSnapshot();
  const found = snap.childProfiles.find((p) => p.id === id);
  if (!found) return;
  browserStorage.setItemSync(LOCAL_STORAGE_KEYS.activeChildId, found.id);
  browserStorage.setItemSync(
    LOCAL_STORAGE_KEYS.childProfile,
    JSON.stringify(found),
  );
  browserStorage.setItemSync(LOCAL_STORAGE_KEYS.activeStageId, found.stageId);
  transientStatusMessage = `Bebé activo: ${found.nicknameMx}.`;
  notifyLocalStoreChange();
}

export function toggleStoredThemeMode(): void {
  const current = getLocalAppSnapshot().themeMode;
  setStoredThemeMode(current === 'night_3am' ? 'day' : 'night_3am');
}

export function setStoredActiveStageId(stageId: StageId): void {
  browserStorage.setItemSync(LOCAL_STORAGE_KEYS.activeStageId, stageId);
  transientStatusMessage = `Etapa seleccionada: ${stageId}.`;
  notifyLocalStoreChange();
}

export async function acceptStoredOnboarding(): Promise<void> {
  await accountLifecycleAdapter.acceptOnboardingDisclaimer(
    new Date().toISOString(),
  );
  transientDeletionResult = null;
  transientStatusMessage =
    'Aviso educativo aceptado. Ya puedes consultar Baby Buddy MX.';
  const current = getLocalAppSnapshot();
  applyThemeToDocument(current.themeMode, true);
  notifyLocalStoreChange();
}

export async function seedStoredDemoData(): Promise<void> {
  await accountLifecycleAdapter.seedDemoLocalData(new Date().toISOString());
  transientDeletionResult = null;
  transientStatusMessage =
    'Datos demo locales cargados (perfil de ejemplo y notas en tu dispositivo).';
  applyThemeToDocument('day', true);
  notifyLocalStoreChange();
}

export async function deleteStoredAccountAndData(
  reason?: string,
): Promise<AccountDeletionResult> {
  const trimmedReason = reason?.trim();
  const result = await accountLifecycleAdapter.deleteAccountAndData({
    confirmedAtIso: new Date().toISOString(),
    reason: trimmedReason && trimmedReason.length > 0 ? trimmedReason : undefined,
  });
  transientDeletionResult = result;
  transientStatusMessage = `Datos locales eliminados (${result.deletedKeysCount} registros borrados).`;
  applyThemeToDocument('day', false);
  notifyLocalStoreChange();
  return result;
}

export function addStoredDailyLogEntry(entry: DailyLogEntry): void {
  const current = getLocalAppSnapshot().dailyLogs;
  const next = [entry, ...current];
  browserStorage.setItemSync(LOCAL_STORAGE_KEYS.dailyLogs, JSON.stringify(next));
  recordSyncMutation('daily_log', entry.id, 'upsert');
  transientStatusMessage =
    entry.kind === 'feed' ? 'Toma registrada.' : 'Pañal registrado.';
  notifyLocalStoreChange();
}

export function deleteStoredDailyLogEntry(id: string): void {
  const current = getLocalAppSnapshot().dailyLogs;
  const next = current.filter((e) => e.id !== id);
  browserStorage.setItemSync(LOCAL_STORAGE_KEYS.dailyLogs, JSON.stringify(next));
  recordSyncMutation('daily_log', id, 'delete');
  transientStatusMessage = 'Registro eliminado.';
  notifyLocalStoreChange();
}

export function startStoredFeedTimer(
  side: 'breast_left' | 'breast_right',
): void {
  const timer: ActiveFeedTimer = {
    side,
    startedAtMs: Date.now(),
    accumulatedSec: 0,
    paused: false,
  };
  browserStorage.setItemSync(
    LOCAL_STORAGE_KEYS.activeFeedTimer,
    JSON.stringify(timer),
  );
  notifyLocalStoreChange();
}

export function togglePauseStoredFeedTimer(): void {
  const current = getLocalAppSnapshot().activeFeedTimer;
  if (!current) return;
  const nowMs = Date.now();
  const next: ActiveFeedTimer = current.paused
    ? { ...current, startedAtMs: nowMs, paused: false }
    : {
        ...current,
        accumulatedSec:
          current.accumulatedSec +
          Math.max(0, Math.floor((nowMs - current.startedAtMs) / 1000)),
        paused: true,
      };
  browserStorage.setItemSync(
    LOCAL_STORAGE_KEYS.activeFeedTimer,
    JSON.stringify(next),
  );
  notifyLocalStoreChange();
}

export function saveStoredActiveFeedTimer(): void {
  const current = getLocalAppSnapshot().activeFeedTimer;
  if (!current) return;
  const nowMs = Date.now();
  const durationSec = current.paused
    ? current.accumulatedSec
    : current.accumulatedSec +
      Math.max(0, Math.floor((nowMs - current.startedAtMs) / 1000));
  const entry: DailyLogEntry = {
    id: `feed-${nowMs}`,
    kind: 'feed',
    timestampIso: new Date(nowMs).toISOString(),
    feedType: current.side,
    durationSec: Math.max(1, durationSec),
  };
  browserStorage.removeItemSync(LOCAL_STORAGE_KEYS.activeFeedTimer);
  addStoredDailyLogEntry(entry);
}

export function cancelStoredActiveFeedTimer(): void {
  browserStorage.removeItemSync(LOCAL_STORAGE_KEYS.activeFeedTimer);
  notifyLocalStoreChange();
}

function saveStoredHealthState(next: HealthLogState, msg: string): void {
  browserStorage.setItemSync(
    LOCAL_STORAGE_KEYS.healthState,
    JSON.stringify(next),
  );
  recordSyncMutation('health_log', 'health_state', 'upsert');
  transientStatusMessage = msg;
  notifyLocalStoreChange();
}

export function addStoredTemperatureLog(entry: TemperatureLogEntry): void {
  const cur = getLocalAppSnapshot().healthState;
  saveStoredHealthState(
    { ...cur, temperatures: [entry, ...cur.temperatures] },
    'Temperatura registrada.',
  );
}

export function deleteStoredTemperatureLog(id: string): void {
  const cur = getLocalAppSnapshot().healthState;
  saveStoredHealthState(
    { ...cur, temperatures: cur.temperatures.filter((t) => t.id !== id) },
    'Temperatura eliminada.',
  );
}

export function addStoredMedicationLog(entry: MedicationLogEntry): void {
  const cur = getLocalAppSnapshot().healthState;
  saveStoredHealthState(
    { ...cur, medications: [entry, ...cur.medications] },
    'Medicamento registrado.',
  );
}

export function deleteStoredMedicationLog(id: string): void {
  const cur = getLocalAppSnapshot().healthState;
  saveStoredHealthState(
    { ...cur, medications: cur.medications.filter((m) => m.id !== id) },
    'Medicamento eliminado.',
  );
}

export function addStoredGrowthLog(entry: GrowthLogEntry): void {
  const cur = getLocalAppSnapshot().healthState;
  saveStoredHealthState(
    { ...cur, growth: [entry, ...cur.growth] },
    'Crecimiento registrado.',
  );
}

export function deleteStoredGrowthLog(id: string): void {
  const cur = getLocalAppSnapshot().healthState;
  saveStoredHealthState(
    { ...cur, growth: cur.growth.filter((g) => g.id !== id) },
    'Registro de crecimiento eliminado.',
  );
}

export function toggleStoredVaccineCompleted(vaccineId: string): void {
  const cur = getLocalAppSnapshot().healthState;
  const exists = cur.completedVaccineIds.includes(vaccineId);
  const nextIds = exists
    ? cur.completedVaccineIds.filter((id) => id !== vaccineId)
    : [...cur.completedVaccineIds, vaccineId];
  saveStoredHealthState(
    { ...cur, completedVaccineIds: nextIds },
    exists ? 'Vacuna desmarcada.' : 'Vacuna marcada como aplicada.',
  );
}

export function toggleStoredMilestoneCompleted(milestoneId: string): void {
  const cur = getLocalAppSnapshot().healthState;
  const currentIds = cur.completedMilestoneIds ?? [];
  const exists = currentIds.includes(milestoneId);
  const nextIds = exists
    ? currentIds.filter((id) => id !== milestoneId)
    : [...currentIds, milestoneId];
  saveStoredHealthState(
    { ...cur, completedMilestoneIds: nextIds },
    exists ? 'Hito desmarcado.' : 'Hito marcado como logrado.',
  );
}

export function exportStoredFamilyBackup(): string {
  const snap = getLocalAppSnapshot();
  return exportFamilyBackupJson({
    exportedAtIso: new Date().toISOString(),
    childProfiles: snap.childProfiles,
    activeChildId: snap.childProfile?.id ?? null,
    dailyLogs: snap.dailyLogs,
    healthState: snap.healthState,
  });
}

export function importStoredFamilyBackup(rawJson: string): {
  readonly ok: boolean;
  readonly messageMx: string;
} {
  const parsed = parseFamilyBackupJson(rawJson);
  if (!parsed) {
    return {
      ok: false,
      messageMx: 'Archivo de respaldo no válido (formato JSON incorrecto).',
    };
  }
  const snap = getLocalAppSnapshot();
  const mergedProfiles = mergeChildProfiles(
    snap.childProfiles,
    parsed.childProfiles,
  );
  const mergedLogs = mergeDailyLogEntries(snap.dailyLogs, parsed.dailyLogs);
  const mergedHealth = mergeHealthLogState(snap.healthState, parsed.healthState);
  const activeProfile =
    snap.childProfile ??
    (parsed.activeChildId
      ? mergedProfiles.find((p) => p.id === parsed.activeChildId)
      : undefined) ??
    mergedProfiles[0] ??
    null;

  browserStorage.setItemSync(
    LOCAL_STORAGE_KEYS.childProfiles,
    JSON.stringify(mergedProfiles),
  );
  if (activeProfile) {
    browserStorage.setItemSync(
      LOCAL_STORAGE_KEYS.activeChildId,
      activeProfile.id,
    );
    browserStorage.setItemSync(
      LOCAL_STORAGE_KEYS.childProfile,
      JSON.stringify(activeProfile),
    );
    browserStorage.setItemSync(
      LOCAL_STORAGE_KEYS.activeStageId,
      activeProfile.stageId,
    );
  }
  browserStorage.setItemSync(
    LOCAL_STORAGE_KEYS.dailyLogs,
    JSON.stringify(mergedLogs),
  );
  browserStorage.setItemSync(
    LOCAL_STORAGE_KEYS.healthState,
    JSON.stringify(mergedHealth),
  );
  transientStatusMessage = `Respaldo fusionado (${mergedLogs.length} registros diarios).`;
  notifyLocalStoreChange();
  return {
    ok: true,
    messageMx: `✓ Respaldo fusionado: ${mergedProfiles.length} perfil(es) y ${mergedLogs.length} registros diarios.`,
  };
}
