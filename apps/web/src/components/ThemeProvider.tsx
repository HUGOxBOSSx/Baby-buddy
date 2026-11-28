'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import {
  computeLocalRemindersMx,
  computeTimerElapsedSec,
  formatTimerClock,
  resolveDateRangePreset,
  summarizeDailyLog,
  type AccountDeletionResult,
  type ActiveFeedTimer,
  type ChildProfileSummary,
  type CreateChildProfileInput,
  type DailyLogEntry,
  type GrowthLogEntry,
  type HealthLogState,
  type MedicationLogEntry,
  type PlanTier,
  type StageId,
  type StoredSnapshotSummary,
  type TemperatureLogEntry,
  type ThemeMode,
  type ThemeScheduleConfig,
} from '@baby-buddy/core';
import {
  getWebNotificationPermission,
  requestWebNotificationPermission,
  showWebNotification,
  type WebNotificationPermissionState,
} from '@/lib/notifications';

export interface AdPreviewConfig {
  readonly enabled: boolean;
  readonly plan: PlanTier;
  readonly hourMode: 'day_14' | 'night_23' | 'real';
}
import {
  acceptStoredOnboarding,
  addStoredChildProfile,
  addStoredDailyLogEntry,
  addStoredGrowthLog,
  addStoredMedicationLog,
  addStoredTemperatureLog,
  applyThemeToDocument,
  cancelStoredActiveFeedTimer,
  cancelStoredSleepTimer,
  deleteStoredAccountAndData,
  deleteStoredDailyLogEntry,
  deleteStoredGrowthLog,
  deleteStoredMedicationLog,
  deleteStoredTemperatureLog,
  exportStoredFamilyBackup,
  getLocalAppSnapshot,
  getServerAppSnapshot,
  importStoredFamilyBackup,
  notifyLocalStoreChange,
  saveStoredActiveFeedTimer,
  saveStoredActiveSleepTimer,
  saveStoredChildProfile,
  seedStoredDemoData,
  selectStoredChildProfile,
  setStoredActiveStageId,
  setStoredThemeMode,
  setStoredThemeSchedule,
  startStoredFeedTimer,
  startStoredSleepTimer,
  subscribeLocalStore,
  togglePauseStoredFeedTimer,
  toggleStoredMilestoneCompleted,
  toggleStoredThemeMode,
  toggleStoredVaccineCompleted,
} from '@/lib/localAdapter';

export interface AppStateContextValue {
  readonly themeMode: ThemeMode;
  readonly themeSchedule: ThemeScheduleConfig;
  readonly activeStageId: StageId;
  readonly onboardingAccepted: boolean;
  readonly childProfile: ChildProfileSummary | null;
  readonly childProfiles: readonly ChildProfileSummary[];
  readonly dailyLogs: readonly DailyLogEntry[];
  readonly activeFeedTimer: ActiveFeedTimer | null;
  readonly activeSleepStartMs: number | null;
  readonly healthState: HealthLogState;
  readonly pendingSyncCount: number;
  readonly snapshotSummary: StoredSnapshotSummary;
  readonly statusMessage: string;
  readonly lastDeletionResult: AccountDeletionResult | null;
  readonly toggleTheme: () => void;
  readonly setThemeMode: (mode: ThemeMode) => void;
  readonly setThemeSchedule: (schedule: ThemeScheduleConfig) => void;
  readonly setActiveStageId: (stageId: StageId) => void;
  readonly saveChildProfile: (
    input: Omit<CreateChildProfileInput, 'id'>,
  ) => ChildProfileSummary;
  readonly addChildProfile: (
    input: Omit<CreateChildProfileInput, 'id'>,
  ) => ChildProfileSummary;
  readonly selectChildProfile: (id: string) => void;
  readonly acceptOnboardingDisclaimer: () => Promise<void>;
  readonly seedDemoData: () => Promise<void>;
  readonly deleteAccountAndData: (
    reason?: string,
  ) => Promise<AccountDeletionResult>;
  readonly addDailyLogEntry: (entry: DailyLogEntry) => void;
  readonly deleteDailyLogEntry: (id: string) => void;
  readonly startFeedTimer: (side: 'breast_left' | 'breast_right') => void;
  readonly togglePauseFeedTimer: () => void;
  readonly saveActiveFeedTimer: () => void;
  readonly cancelActiveFeedTimer: () => void;
  readonly startSleepTimer: (offsetMin?: number) => void;
  readonly saveActiveSleepTimer: (noteMx?: string) => void;
  readonly cancelSleepTimer: () => void;
  readonly addTemperatureLog: (entry: TemperatureLogEntry) => void;
  readonly deleteTemperatureLog: (id: string) => void;
  readonly addMedicationLog: (entry: MedicationLogEntry) => void;
  readonly deleteMedicationLog: (id: string) => void;
  readonly addGrowthLog: (entry: GrowthLogEntry) => void;
  readonly deleteGrowthLog: (id: string) => void;
  readonly toggleVaccineCompleted: (vaccineId: string) => void;
  readonly toggleMilestoneCompleted: (milestoneId: string) => void;
  readonly exportFamilyBackup: () => string;
  readonly importFamilyBackup: (rawJson: string) => {
    readonly ok: boolean;
    readonly messageMx: string;
  };
  readonly adPreview: AdPreviewConfig;
  readonly setAdPreview: (next: AdPreviewConfig) => void;
  readonly notificationsEnabled: boolean;
  readonly notificationPermission: WebNotificationPermissionState;
  readonly enableNotifications: () => Promise<WebNotificationPermissionState>;
  readonly disableNotifications: () => void;
}

const AppStateContext = createContext<AppStateContextValue | null>(null);

export function ThemeProvider({ children }: { readonly children: ReactNode }) {
  const snapshot = useSyncExternalStore(
    subscribeLocalStore,
    getLocalAppSnapshot,
    getServerAppSnapshot,
  );
  const [adPreview, setAdPreview] = useState<AdPreviewConfig>({
    enabled: false,
    plan: 'free',
    hourMode: 'day_14',
  });
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationPermission, setNotificationPermission] =
    useState<WebNotificationPermissionState>('default');
  const notifiedIdsRef = useRef<Set<string>>(new Set());
  const autoPromptedNotifRef = useRef(false);

  useEffect(() => {
    const id = window.setTimeout(() => {
      const current = getWebNotificationPermission();
      setNotificationPermission(current);
      if (current === 'granted') {
        setNotificationsEnabled(true);
        return;
      }
      if (
        current === 'default' &&
        snapshot.onboardingAccepted &&
        !autoPromptedNotifRef.current
      ) {
        autoPromptedNotifRef.current = true;
        void requestWebNotificationPermission()
          .then((perm) => {
            setNotificationPermission(perm);
            if (perm === 'granted') {
              setNotificationsEnabled(true);
            }
          })
          .catch(() => {});
      }
    }, 0);
    return () => window.clearTimeout(id);
  }, [snapshot.onboardingAccepted]);

  const enableNotifications = useCallback(async () => {
    const perm = await requestWebNotificationPermission();
    setNotificationPermission(perm);
    if (perm === 'granted') {
      setNotificationsEnabled(true);
    }
    return perm;
  }, []);

  const acceptOnboardingWithNotifications = useCallback(async () => {
    await acceptStoredOnboarding();
    if (getWebNotificationPermission() === 'default') {
      autoPromptedNotifRef.current = true;
      await enableNotifications();
    }
    if (
      typeof window !== 'undefined' &&
      window.isSecureContext &&
      typeof navigator !== 'undefined' &&
      navigator.geolocation
    ) {
      navigator.geolocation.getCurrentPosition(
        () => {},
        () => {},
        { timeout: 5000, maximumAge: 600_000 },
      );
    }
  }, [enableNotifications]);

  const disableNotifications = useCallback(() => {
    setNotificationsEnabled(false);
  }, []);

  // Live timer in browser tab title (visible even when switching tabs)
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const { activeFeedTimer, activeSleepStartMs, childProfile } = snapshot;
    if (!activeFeedTimer && activeSleepStartMs === null) {
      document.title = 'Baby Buddy MX';
      return;
    }
    const updateTitle = () => {
      const now = Date.now();
      const babyPrefix = childProfile ? `${childProfile.nicknameMx} · ` : '';
      if (activeFeedTimer) {
        const sec = computeTimerElapsedSec(activeFeedTimer, now);
        const side =
          activeFeedTimer.side === 'breast_left'
            ? 'Pecho izquierdo'
            : 'Pecho derecho';
        document.title = `⏱ ${formatTimerClock(sec)} · ${babyPrefix}${side} — Baby Buddy MX`;
      } else if (activeSleepStartMs !== null) {
        const sec = Math.max(0, Math.floor((now - activeSleepStartMs) / 1000));
        document.title = `😴 ${formatTimerClock(sec)} · ${babyPrefix}Siesta — Baby Buddy MX`;
      }
    };
    updateTitle();
    const id = window.setInterval(updateTitle, 1000);
    return () => window.clearInterval(id);
  }, [snapshot]);

  // Active timer notification when user leaves tab (and every 60s while hidden)
  useEffect(() => {
    if (
      typeof document === 'undefined' ||
      !notificationsEnabled ||
      notificationPermission !== 'granted'
    ) {
      return;
    }
    const { activeFeedTimer, activeSleepStartMs, childProfile } = snapshot;
    if (!activeFeedTimer && activeSleepStartMs === null) {
      return;
    }

    const pushTimerNotification = () => {
      const now = Date.now();
      const babyName = childProfile?.nicknameMx ?? 'tu bebé';
      if (activeFeedTimer) {
        const sec = computeTimerElapsedSec(activeFeedTimer, now);
        const side =
          activeFeedTimer.side === 'breast_left'
            ? 'Pecho izquierdo'
            : 'Pecho derecho';
        showWebNotification({
          title: `⏱ Toma en curso · ${babyName}`,
          body: `${side} · ${formatTimerClock(sec)}`,
          tag: 'bbmx-active-timer',
          silent: true,
          onClickUrl: '/',
        });
      } else if (activeSleepStartMs !== null) {
        const sec = Math.max(0, Math.floor((now - activeSleepStartMs) / 1000));
        showWebNotification({
          title: `😴 Siesta en curso · ${babyName}`,
          body: `Tiempo transcurrido: ${formatTimerClock(sec)}`,
          tag: 'bbmx-active-timer',
          silent: true,
          onClickUrl: '/',
        });
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        pushTimerNotification();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    const intervalId = window.setInterval(() => {
      if (document.visibilityState === 'hidden') {
        pushTimerNotification();
      }
    }, 60_000);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.clearInterval(intervalId);
    };
  }, [notificationsEnabled, notificationPermission, snapshot]);

  // Reminders & daily alerts notifications (deduplicated per session)
  useEffect(() => {
    if (!notificationsEnabled || notificationPermission !== 'granted') return;
    const now = new Date();
    const todaySummary = summarizeDailyLog(
      snapshot.dailyLogs,
      resolveDateRangePreset('today', now),
      now,
    );
    if (todaySummary.hydrationAlertMx) {
      const key = `hydration:${todaySummary.hydrationAlertMx}`;
      if (!notifiedIdsRef.current.has(key)) {
        notifiedIdsRef.current.add(key);
        showWebNotification({
          title: 'Alerta de hidratación — Baby Buddy MX',
          body: todaySummary.hydrationAlertMx,
          tag: 'bbmx-hydration-alert',
          onClickUrl: '/',
        });
      }
    }
    if (todaySummary.stoolAlertMx) {
      const key = `stool:${todaySummary.stoolAlertMx}`;
      if (!notifiedIdsRef.current.has(key)) {
        notifiedIdsRef.current.add(key);
        showWebNotification({
          title: 'Alerta de evacuación — Baby Buddy MX',
          body: todaySummary.stoolAlertMx,
          tag: 'bbmx-stool-alert',
          onClickUrl: '/guias',
        });
      }
    }
    const reminders = computeLocalRemindersMx({
      profile: snapshot.childProfile,
      dailySummary: todaySummary,
      healthState: snapshot.healthState,
      now,
    });
    for (const rem of reminders) {
      if (rem.urgency !== 'due') continue;
      const key = `rem:${rem.id}:${rem.titleMx}`;
      if (!notifiedIdsRef.current.has(key)) {
        notifiedIdsRef.current.add(key);
        showWebNotification({
          title: rem.titleMx,
          body: rem.detailMx,
          tag: `bbmx-${rem.id}`,
          onClickUrl: rem.kind === 'vaccine' ? '/salud?tab=vacunas' : '/',
        });
      }
    }
  }, [
    notificationsEnabled,
    notificationPermission,
    snapshot.childProfile,
    snapshot.dailyLogs,
    snapshot.healthState,
  ]);

  useEffect(() => {
    applyThemeToDocument(snapshot.themeMode, snapshot.onboardingAccepted);
  }, [snapshot.themeMode, snapshot.onboardingAccepted]);

  useEffect(() => {
    if (snapshot.themeSchedule.mode !== 'auto') {
      return;
    }
    const timer = window.setInterval(() => {
      notifyLocalStoreChange();
    }, 60_000);
    return () => window.clearInterval(timer);
  }, [snapshot.themeSchedule.mode]);

  const value = useMemo<AppStateContextValue>(
    () => ({
      themeMode: snapshot.themeMode,
      themeSchedule: snapshot.themeSchedule,
      activeStageId: snapshot.activeStageId,
      onboardingAccepted: snapshot.onboardingAccepted,
      childProfile: snapshot.childProfile,
      childProfiles: snapshot.childProfiles,
      dailyLogs: snapshot.dailyLogs,
      activeFeedTimer: snapshot.activeFeedTimer,
      activeSleepStartMs: snapshot.activeSleepStartMs,
      healthState: snapshot.healthState,
      pendingSyncCount: snapshot.pendingSyncCount,
      snapshotSummary: snapshot.snapshotSummary,
      statusMessage: snapshot.statusMessage,
      lastDeletionResult: snapshot.lastDeletionResult,
      toggleTheme: toggleStoredThemeMode,
      setThemeMode: setStoredThemeMode,
      setThemeSchedule: setStoredThemeSchedule,
      setActiveStageId: setStoredActiveStageId,
      saveChildProfile: saveStoredChildProfile,
      addChildProfile: addStoredChildProfile,
      selectChildProfile: selectStoredChildProfile,
      acceptOnboardingDisclaimer: acceptOnboardingWithNotifications,
      seedDemoData: seedStoredDemoData,
      deleteAccountAndData: deleteStoredAccountAndData,
      addDailyLogEntry: addStoredDailyLogEntry,
      deleteDailyLogEntry: deleteStoredDailyLogEntry,
      startFeedTimer: startStoredFeedTimer,
      togglePauseFeedTimer: togglePauseStoredFeedTimer,
      saveActiveFeedTimer: saveStoredActiveFeedTimer,
      cancelActiveFeedTimer: cancelStoredActiveFeedTimer,
      startSleepTimer: startStoredSleepTimer,
      saveActiveSleepTimer: saveStoredActiveSleepTimer,
      cancelSleepTimer: cancelStoredSleepTimer,
      addTemperatureLog: addStoredTemperatureLog,
      deleteTemperatureLog: deleteStoredTemperatureLog,
      addMedicationLog: addStoredMedicationLog,
      deleteMedicationLog: deleteStoredMedicationLog,
      addGrowthLog: addStoredGrowthLog,
      deleteGrowthLog: deleteStoredGrowthLog,
      toggleVaccineCompleted: toggleStoredVaccineCompleted,
      toggleMilestoneCompleted: toggleStoredMilestoneCompleted,
      exportFamilyBackup: exportStoredFamilyBackup,
      importFamilyBackup: importStoredFamilyBackup,
      adPreview,
      setAdPreview,
      notificationsEnabled,
      notificationPermission,
      enableNotifications,
      disableNotifications,
    }),
    [
      snapshot,
      adPreview,
      notificationsEnabled,
      notificationPermission,
      enableNotifications,
      disableNotifications,
      acceptOnboardingWithNotifications,
    ],
  );

  return (
    <AppStateContext.Provider value={value}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className="sr-only"
        data-persistence="localStorage"
      >
        {snapshot.statusMessage}
      </div>
    </AppStateContext.Provider>
  );
}

export function useAppState(): AppStateContextValue {
  const context = useContext(AppStateContext);
  if (context === null) {
    throw new Error(
      'useAppState debe utilizarse dentro de ThemeProvider.',
    );
  }
  return context;
}
