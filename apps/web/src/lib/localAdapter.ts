'use client';

import {
  DEFAULT_APP_PREFERENCES,
  LOCAL_STORAGE_KEYS,
  LOCAL_STORAGE_PREFIX,
  LocalAccountLifecycleAdapter,
  isStageId,
  type AccountDeletionResult,
  type ChildProfileSummary,
  type KeyValueStoragePort,
  type StageId,
  type StoredSnapshotSummary,
  type ThemeMode,
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
  readonly activeStageId: StageId;
  readonly onboardingAccepted: boolean;
  readonly childProfile: ChildProfileSummary | null;
  readonly snapshotSummary: StoredSnapshotSummary;
  readonly statusMessage: string;
  readonly lastDeletionResult: AccountDeletionResult | null;
}

export const SERVER_APP_SNAPSHOT: LocalAppSnapshot = {
  themeMode: DEFAULT_APP_PREFERENCES.themeMode,
  activeStageId: DEFAULT_APP_PREFERENCES.activeStageId,
  onboardingAccepted: false,
  childProfile: null,
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
    return {
      id: candidate.id,
      nicknameMx: candidate.nicknameMx,
      ageMonths: candidate.ageMonths,
      stageId: candidate.stageId,
      birthDateIso:
        typeof candidate.birthDateIso === 'string'
          ? candidate.birthDateIso
          : undefined,
      createdAtIso: candidate.createdAtIso,
      updatedAtIso: candidate.updatedAtIso,
    };
  } catch {
    return null;
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
  const rawStage = browserStorage.getItemSync(LOCAL_STORAGE_KEYS.activeStageId);
  const rawOnboarding = browserStorage.getItemSync(
    LOCAL_STORAGE_KEYS.onboardingAcceptedAt,
  );
  const rawProfile = browserStorage.getItemSync(
    LOCAL_STORAGE_KEYS.childProfile,
  );
  const ownedKeys = browserStorage
    .keysSync()
    .filter((k) => k.startsWith(LOCAL_STORAGE_PREFIX))
    .sort();

  const deletionSig = transientDeletionResult
    ? `${transientDeletionResult.deletedAtIso}:${transientDeletionResult.deletedKeysCount}`
    : '';

  const signature = [
    rawTheme ?? '',
    rawStage ?? '',
    rawOnboarding ?? '',
    rawProfile ?? '',
    ownedKeys.join(','),
    transientStatusMessage,
    deletionSig,
  ].join('\n');

  if (signature === lastSnapshotSignature) {
    return cachedSnapshot;
  }

  const themeMode: ThemeMode = rawTheme === 'night_3am' ? 'night_3am' : 'day';
  const activeStageId: StageId =
    rawStage !== null && isStageId(rawStage)
      ? rawStage
      : DEFAULT_APP_PREFERENCES.activeStageId;
  const onboardingAccepted =
    rawOnboarding !== null && rawOnboarding.trim().length > 0;
  const childProfile = parseChildProfile(rawProfile);

  cachedSnapshot = {
    themeMode,
    activeStageId,
    onboardingAccepted,
    childProfile,
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
  const snapshot = getLocalAppSnapshot();
  applyThemeToDocument(mode, snapshot.onboardingAccepted);
  transientStatusMessage =
    mode === 'night_3am'
      ? 'Modo 3:00 AM activado para cuidar tu descanso.'
      : 'Modo Día Calma activado.';
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
  transientStatusMessage = `Cuenta y datos locales eliminados (${result.deletedKeysCount} registros borrados).`;
  applyThemeToDocument('day', false);
  notifyLocalStoreChange();
  return result;
}
