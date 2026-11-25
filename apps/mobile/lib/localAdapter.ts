import {
  DEFAULT_APP_PREFERENCES,
  ETHICAL_GUARDRAILS,
  LOCAL_STORAGE_KEYS,
  LOCAL_STORAGE_PREFIX,
  LocalAccountLifecycleAdapter,
  MemoryStorageAdapter,
  OfflineDeploymentInfoStub,
  OfflineGeminiAssistantStub,
  OfflineSupabasePortStub,
  assertEthicalComplianceConfig,
  isStageId,
  loadOfflineEnvConfig,
  type ChildProfileSummary,
  type KeyValueStoragePort,
  type StageId,
  type ThemeMode,
} from '@baby-buddy/core';

export class WebLocalStorageAdapter implements KeyValueStoragePort {
  private readonly fallback = new MemoryStorageAdapter();
  private useFallbackOnly = false;
  private fallbackMigration: Promise<void> | null = null;
  private readonly writtenKeys = new Set<string>();

  private getBrowserStorage(): Storage | null {
    if (this.useFallbackOnly || typeof window === 'undefined') {
      return null;
    }

    try {
      if (typeof window.localStorage === 'undefined') {
        return null;
      }
      return window.localStorage;
    } catch {
      this.useFallbackOnly = true;
      return null;
    }
  }

  private transitionToFallback(storage: Storage): Promise<void> {
    if (this.fallbackMigration !== null) {
      return this.fallbackMigration;
    }
    if (this.useFallbackOnly) {
      return Promise.resolve();
    }
    this.useFallbackOnly = true;

    this.fallbackMigration = (async () => {
      const keysToMigrate = new Set<string>(this.writtenKeys);
      try {
        for (let i = 0; i < storage.length; i += 1) {
          const key = storage.key(i);
          if (key !== null && key.startsWith(LOCAL_STORAGE_PREFIX)) {
            keysToMigrate.add(key);
          }
        }
      } catch {
        // Ignore enumeration errors (e.g., SecurityError); still migrate writtenKeys.
      }

      const migratedEntries: [string, string][] = [];
      for (const key of keysToMigrate) {
        try {
          const existingValue = storage.getItem(key);
          if (existingValue !== null) {
            migratedEntries.push([key, existingValue]);
          }
        } catch {
          // Ignore read failure during fallback migration.
        }

        try {
          storage.removeItem(key);
        } catch {
          // Ignore cleanup failure during fallback migration.
        }
      }

      for (const [key, value] of migratedEntries) {
        const existingFallbackValue = await this.fallback.getItem(key);
        if (existingFallbackValue === null) {
          await this.fallback.setItem(key, value);
        }
      }
    })();

    return this.fallbackMigration;
  }

  async getItem(key: string): Promise<string | null> {
    if (this.fallbackMigration !== null) {
      await this.fallbackMigration;
    }
    const storage = this.getBrowserStorage();
    if (!storage) {
      return this.fallback.getItem(key);
    }

    try {
      return storage.getItem(key);
    } catch {
      await this.transitionToFallback(storage);
      return this.fallback.getItem(key);
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    if (this.fallbackMigration !== null) {
      await this.fallbackMigration;
    }
    const storage = this.getBrowserStorage();
    if (!storage) {
      this.writtenKeys.add(key);
      await this.fallback.setItem(key, value);
      return;
    }

    try {
      storage.setItem(key, value);
      this.writtenKeys.add(key);
    } catch {
      await this.transitionToFallback(storage);
      this.writtenKeys.add(key);
      await this.fallback.setItem(key, value);
    }
  }

  async removeItem(key: string): Promise<void> {
    if (this.fallbackMigration !== null) {
      await this.fallbackMigration;
    }
    this.writtenKeys.delete(key);
    const storage = this.getBrowserStorage();
    if (!storage) {
      await this.fallback.removeItem(key);
      return;
    }

    try {
      storage.removeItem(key);
      await this.fallback.removeItem(key);
    } catch {
      await this.transitionToFallback(storage);
      await this.fallback.removeItem(key);
    }
  }

  async keys(): Promise<string[]> {
    if (this.fallbackMigration !== null) {
      await this.fallbackMigration;
    }
    const storage = this.getBrowserStorage();
    if (!storage) {
      return this.fallback.keys();
    }

    try {
      const result: string[] = [];
      for (let i = 0; i < storage.length; i += 1) {
        const key = storage.key(i);
        if (key !== null) {
          result.push(key);
        }
      }
      return result;
    } catch {
      await this.transitionToFallback(storage);
      return this.fallback.keys();
    }
  }
}

export function createMobileStorage(): KeyValueStoragePort {
  return new WebLocalStorageAdapter();
}

export const mobileStorage: KeyValueStoragePort = createMobileStorage();

export const accountLifecycleAdapter = new LocalAccountLifecycleAdapter(
  mobileStorage,
);

export async function loadPersistedThemeMode(): Promise<ThemeMode> {
  const raw = await mobileStorage.getItem(LOCAL_STORAGE_KEYS.themeMode);
  return raw === 'night_3am' ? 'night_3am' : DEFAULT_APP_PREFERENCES.themeMode;
}

export async function savePersistedThemeMode(mode: ThemeMode): Promise<void> {
  await mobileStorage.setItem(LOCAL_STORAGE_KEYS.themeMode, mode);
}

export async function loadPersistedStageId(): Promise<StageId> {
  const raw = await mobileStorage.getItem(LOCAL_STORAGE_KEYS.activeStageId);
  if (raw !== null && isStageId(raw)) {
    return raw;
  }
  return DEFAULT_APP_PREFERENCES.activeStageId;
}

export async function savePersistedStageId(stageId: StageId): Promise<void> {
  await mobileStorage.setItem(LOCAL_STORAGE_KEYS.activeStageId, stageId);
}

export async function loadPersistedChildProfile(): Promise<ChildProfileSummary | null> {
  const raw = await mobileStorage.getItem(LOCAL_STORAGE_KEYS.childProfile);
  if (raw === null || raw.trim().length === 0) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      'id' in parsed &&
      'nicknameMx' in parsed &&
      'ageMonths' in parsed &&
      'stageId' in parsed &&
      typeof parsed.id === 'string' &&
      typeof parsed.nicknameMx === 'string' &&
      typeof parsed.ageMonths === 'number' &&
      typeof parsed.stageId === 'string' &&
      isStageId(parsed.stageId)
    ) {
      return parsed as ChildProfileSummary;
    }
    return null;
  } catch {
    return null;
  }
}

export const offlineEnvConfig = loadOfflineEnvConfig();
export const offlineSupabaseStub = new OfflineSupabasePortStub();
export const offlineGeminiStub = new OfflineGeminiAssistantStub();
export const offlineDeploymentStub = new OfflineDeploymentInfoStub();

export const offlineServiceStubs = {
  supabase: offlineSupabaseStub,
  gemini: offlineGeminiStub,
  vercel: offlineDeploymentStub,
} as const;

export function verifyEthicalCompliance(): void {
  assertEthicalComplianceConfig(ETHICAL_GUARDRAILS);
}
