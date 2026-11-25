import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  DEFAULT_APP_PREFERENCES,
  ETHICAL_GUARDRAILS,
  LOCAL_STORAGE_KEYS,
  LocalAccountLifecycleAdapter,
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

/**
 * Expo Go incluye AsyncStorage en Android, iOS y web. A diferencia del
 * adaptador web anterior, este almacenamiento persiste al cerrar y reabrir la
 * aplicación nativa.
 */
export class PersistedAppStorageAdapter implements KeyValueStoragePort {
  async getItem(key: string): Promise<string | null> {
    return AsyncStorage.getItem(key);
  }

  async setItem(key: string, value: string): Promise<void> {
    await AsyncStorage.setItem(key, value);
  }

  async removeItem(key: string): Promise<void> {
    await AsyncStorage.removeItem(key);
  }

  async keys(): Promise<string[]> {
    const allKeys = await AsyncStorage.getAllKeys();
    return [...allKeys];
  }
}

export function createMobileStorage(): KeyValueStoragePort {
  return new PersistedAppStorageAdapter();
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
