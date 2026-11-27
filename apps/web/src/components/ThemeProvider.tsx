'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import type {
  AccountDeletionResult,
  ActiveFeedTimer,
  ChildProfileSummary,
  CreateChildProfileInput,
  DailyLogEntry,
  GrowthLogEntry,
  HealthLogState,
  MedicationLogEntry,
  StageId,
  StoredSnapshotSummary,
  TemperatureLogEntry,
  ThemeMode,
  ThemeScheduleConfig,
} from '@baby-buddy/core';
import {
  acceptStoredOnboarding,
  addStoredChildProfile,
  addStoredDailyLogEntry,
  addStoredGrowthLog,
  addStoredMedicationLog,
  addStoredTemperatureLog,
  applyThemeToDocument,
  cancelStoredActiveFeedTimer,
  deleteStoredAccountAndData,
  deleteStoredDailyLogEntry,
  deleteStoredGrowthLog,
  deleteStoredMedicationLog,
  deleteStoredTemperatureLog,
  getLocalAppSnapshot,
  getServerAppSnapshot,
  notifyLocalStoreChange,
  saveStoredActiveFeedTimer,
  saveStoredChildProfile,
  seedStoredDemoData,
  selectStoredChildProfile,
  setStoredActiveStageId,
  setStoredThemeMode,
  setStoredThemeSchedule,
  startStoredFeedTimer,
  subscribeLocalStore,
  togglePauseStoredFeedTimer,
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
  readonly healthState: HealthLogState;
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
  readonly addTemperatureLog: (entry: TemperatureLogEntry) => void;
  readonly deleteTemperatureLog: (id: string) => void;
  readonly addMedicationLog: (entry: MedicationLogEntry) => void;
  readonly deleteMedicationLog: (id: string) => void;
  readonly addGrowthLog: (entry: GrowthLogEntry) => void;
  readonly deleteGrowthLog: (id: string) => void;
  readonly toggleVaccineCompleted: (vaccineId: string) => void;
}

const AppStateContext = createContext<AppStateContextValue | null>(null);

export function ThemeProvider({ children }: { readonly children: ReactNode }) {
  const snapshot = useSyncExternalStore(
    subscribeLocalStore,
    getLocalAppSnapshot,
    getServerAppSnapshot,
  );

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
      healthState: snapshot.healthState,
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
      acceptOnboardingDisclaimer: acceptStoredOnboarding,
      seedDemoData: seedStoredDemoData,
      deleteAccountAndData: deleteStoredAccountAndData,
      addDailyLogEntry: addStoredDailyLogEntry,
      deleteDailyLogEntry: deleteStoredDailyLogEntry,
      startFeedTimer: startStoredFeedTimer,
      togglePauseFeedTimer: togglePauseStoredFeedTimer,
      saveActiveFeedTimer: saveStoredActiveFeedTimer,
      cancelActiveFeedTimer: cancelStoredActiveFeedTimer,
      addTemperatureLog: addStoredTemperatureLog,
      deleteTemperatureLog: deleteStoredTemperatureLog,
      addMedicationLog: addStoredMedicationLog,
      deleteMedicationLog: deleteStoredMedicationLog,
      addGrowthLog: addStoredGrowthLog,
      deleteGrowthLog: deleteStoredGrowthLog,
      toggleVaccineCompleted: toggleStoredVaccineCompleted,
    }),
    [snapshot],
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
