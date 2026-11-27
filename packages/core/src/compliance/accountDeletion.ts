import type { KeyValueStoragePort } from '../adapters/storage';

export const LOCAL_STORAGE_PREFIX = 'baby_buddy_mx:' as const;

export const LOCAL_STORAGE_KEYS = {
  preferences: 'baby_buddy_mx:preferences',
  themeMode: 'baby_buddy_mx:theme_mode',
  themeSchedule: 'baby_buddy_mx:theme_schedule',
  activeStageId: 'baby_buddy_mx:active_stage_id',
  onboardingAcceptedAt: 'baby_buddy_mx:onboarding_accepted_at',
  childProfile: 'baby_buddy_mx:child_profile',
  childProfiles: 'baby_buddy_mx:child_profiles',
  activeChildId: 'baby_buddy_mx:active_child_id',
  demoNotes: 'baby_buddy_mx:demo_notes',
  dailyLogs: 'baby_buddy_mx:daily_logs',
  activeFeedTimer: 'baby_buddy_mx:active_feed_timer',
  healthState: 'baby_buddy_mx:health_state',
} as const;

export interface AccountDeletionRequest {
  readonly reason?: string;
  readonly confirmedAtIso: string;
}

export interface AccountDeletionResult {
  readonly status: 'deleted_local';
  readonly deletedKeysCount: number;
  readonly deletedAtIso: string;
  readonly remoteSyncPending: boolean;
}

export interface StoredSnapshotSummary {
  readonly hasActiveProfile: boolean;
  readonly onboardingAccepted: boolean;
  readonly itemCount: number;
  readonly keys: readonly string[];
}

export interface AccountDataPort {
  getStoredSnapshotSummary(): Promise<StoredSnapshotSummary>;
  acceptOnboardingDisclaimer(acceptedAtIso?: string): Promise<void>;
  hasAcceptedOnboardingDisclaimer(): Promise<boolean>;
  seedDemoLocalData(nowIso?: string): Promise<void>;
  deleteAccountAndData(
    req: AccountDeletionRequest,
  ): Promise<AccountDeletionResult>;
}

const STRICT_ISO_8601_TIMESTAMP_REGEX =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,9})?(?:Z|([+-])(\d{2}):(\d{2}))$/;

function isValidStrictIsoTimestamp(value: string): boolean {
  const match = STRICT_ISO_8601_TIMESTAMP_REGEX.exec(value);
  if (!match) {
    return false;
  }

  const year = Number.parseInt(match[1] ?? '', 10);
  const month = Number.parseInt(match[2] ?? '', 10);
  const day = Number.parseInt(match[3] ?? '', 10);
  const hour = Number.parseInt(match[4] ?? '', 10);
  const minute = Number.parseInt(match[5] ?? '', 10);
  const second = Number.parseInt(match[6] ?? '', 10);

  if (
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31 ||
    hour > 23 ||
    minute > 59 ||
    second > 59
  ) {
    return false;
  }

  const utcCalendarCheck = new Date(Date.UTC(year, month - 1, day));
  if (
    utcCalendarCheck.getUTCFullYear() !== year ||
    utcCalendarCheck.getUTCMonth() !== month - 1 ||
    utcCalendarCheck.getUTCDate() !== day
  ) {
    return false;
  }

  if (match[8] !== undefined && match[9] !== undefined) {
    const offsetHour = Number.parseInt(match[8], 10);
    const offsetMinute = Number.parseInt(match[9], 10);
    if (offsetHour > 23 || offsetMinute > 59) {
      return false;
    }
  }

  return !Number.isNaN(Date.parse(value));
}

export class LocalAccountLifecycleAdapter implements AccountDataPort {
  private readonly storage: KeyValueStoragePort;
  private deletionQueue: Promise<void> = Promise.resolve();

  constructor(storage: KeyValueStoragePort) {
    this.storage = storage;
  }

  async acceptOnboardingDisclaimer(
    acceptedAtIso: string = new Date().toISOString(),
  ): Promise<void> {
    const trimmed = acceptedAtIso.trim();
    if (!trimmed || !isValidStrictIsoTimestamp(trimmed)) {
      throw new Error(
        'Se requiere una marca de tiempo ISO válida para registrar la aceptación.',
      );
    }
    await this.storage.setItem(LOCAL_STORAGE_KEYS.onboardingAcceptedAt, trimmed);
  }

  async hasAcceptedOnboardingDisclaimer(): Promise<boolean> {
    const val = await this.storage.getItem(
      LOCAL_STORAGE_KEYS.onboardingAcceptedAt,
    );
    return val !== null && val.trim().length > 0;
  }

  async seedDemoLocalData(
    nowIso: string = new Date().toISOString(),
  ): Promise<void> {
    await this.acceptOnboardingDisclaimer(nowIso);
    await this.storage.setItem(LOCAL_STORAGE_KEYS.themeMode, 'day');
    await this.storage.setItem(LOCAL_STORAGE_KEYS.activeStageId, '0-3m');
    await this.storage.setItem(
      LOCAL_STORAGE_KEYS.childProfile,
      JSON.stringify({
        id: 'demo-local-01',
        nicknameMx: 'Bebé Demo',
        ageMonths: 2,
        stageId: '0-3m',
        sex: 'niña',
        createdAtIso: nowIso,
        updatedAtIso: nowIso,
      }),
    );
    await this.storage.setItem(
      LOCAL_STORAGE_KEYS.demoNotes,
      JSON.stringify([
        {
          id: 'note-1',
          textMx: 'Control de temperatura en °C y toma en ml registrados localmente.',
          createdAtIso: nowIso,
        },
      ]),
    );
  }

  async getStoredSnapshotSummary(): Promise<StoredSnapshotSummary> {
    const allKeys = await this.storage.keys();
    const ownedKeys = allKeys
      .filter(
        (key): key is string =>
          typeof key === 'string' && key.startsWith(LOCAL_STORAGE_PREFIX),
      )
      .sort();
    const profileValue = await this.storage.getItem(
      LOCAL_STORAGE_KEYS.childProfile,
    );
    const onboardingAccepted = await this.hasAcceptedOnboardingDisclaimer();

    return {
      hasActiveProfile: profileValue !== null && profileValue.trim().length > 0,
      onboardingAccepted,
      itemCount: ownedKeys.length,
      keys: ownedKeys,
    };
  }

  async deleteAccountAndData(
    req: AccountDeletionRequest,
  ): Promise<AccountDeletionResult> {
    const confirmedAt = req.confirmedAtIso.trim();
    if (!confirmedAt || !isValidStrictIsoTimestamp(confirmedAt)) {
      throw new Error(
        'Se requiere confirmación explícita con fecha ISO válida para eliminar cuenta y datos.',
      );
    }

    const runDeletion = async (): Promise<AccountDeletionResult> => {
      const allKeys = await this.storage.keys();
      const ownedKeys = allKeys.filter(
        (key): key is string =>
          typeof key === 'string' && key.startsWith(LOCAL_STORAGE_PREFIX),
      );

      for (const key of ownedKeys) {
        await this.storage.removeItem(key);
      }

      return {
        status: 'deleted_local',
        deletedKeysCount: ownedKeys.length,
        deletedAtIso: confirmedAt,
        remoteSyncPending: false,
      };
    };

    const resultPromise = this.deletionQueue.then(runDeletion, runDeletion);
    this.deletionQueue = resultPromise.then(
      () => undefined,
      () => undefined,
    );
    return resultPromise;
  }
}
