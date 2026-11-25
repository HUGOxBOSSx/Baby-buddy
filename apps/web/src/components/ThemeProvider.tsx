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
  ChildProfileSummary,
  CreateChildProfileInput,
  StageId,
  StoredSnapshotSummary,
  ThemeMode,
  ThemeScheduleConfig,
} from '@baby-buddy/core';
import {
  acceptStoredOnboarding,
  applyThemeToDocument,
  deleteStoredAccountAndData,
  getLocalAppSnapshot,
  getServerAppSnapshot,
  notifyLocalStoreChange,
  saveStoredChildProfile,
  seedStoredDemoData,
  setStoredActiveStageId,
  setStoredThemeMode,
  setStoredThemeSchedule,
  subscribeLocalStore,
  toggleStoredThemeMode,
} from '@/lib/localAdapter';

export interface AppStateContextValue {
  readonly themeMode: ThemeMode;
  readonly themeSchedule: ThemeScheduleConfig;
  readonly activeStageId: StageId;
  readonly onboardingAccepted: boolean;
  readonly childProfile: ChildProfileSummary | null;
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
  readonly acceptOnboardingDisclaimer: () => Promise<void>;
  readonly seedDemoData: () => Promise<void>;
  readonly deleteAccountAndData: (
    reason?: string,
  ) => Promise<AccountDeletionResult>;
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
      snapshotSummary: snapshot.snapshotSummary,
      statusMessage: snapshot.statusMessage,
      lastDeletionResult: snapshot.lastDeletionResult,
      toggleTheme: toggleStoredThemeMode,
      setThemeMode: setStoredThemeMode,
      setThemeSchedule: setStoredThemeSchedule,
      setActiveStageId: setStoredActiveStageId,
      saveChildProfile: saveStoredChildProfile,
      acceptOnboardingDisclaimer: acceptStoredOnboarding,
      seedDemoData: seedStoredDemoData,
      deleteAccountAndData: deleteStoredAccountAndData,
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
