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
  StageId,
  StoredSnapshotSummary,
  ThemeMode,
} from '@baby-buddy/core';
import {
  acceptStoredOnboarding,
  applyThemeToDocument,
  deleteStoredAccountAndData,
  getLocalAppSnapshot,
  getServerAppSnapshot,
  seedStoredDemoData,
  setStoredActiveStageId,
  setStoredThemeMode,
  subscribeLocalStore,
  toggleStoredThemeMode,
} from '@/lib/localAdapter';

export interface AppStateContextValue {
  readonly themeMode: ThemeMode;
  readonly activeStageId: StageId;
  readonly onboardingAccepted: boolean;
  readonly childProfile: ChildProfileSummary | null;
  readonly snapshotSummary: StoredSnapshotSummary;
  readonly statusMessage: string;
  readonly lastDeletionResult: AccountDeletionResult | null;
  readonly toggleTheme: () => void;
  readonly setThemeMode: (mode: ThemeMode) => void;
  readonly setActiveStageId: (stageId: StageId) => void;
  readonly acceptOnboarding: () => Promise<void>;
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

  const value = useMemo<AppStateContextValue>(
    () => ({
      themeMode: snapshot.themeMode,
      activeStageId: snapshot.activeStageId,
      onboardingAccepted: snapshot.onboardingAccepted,
      childProfile: snapshot.childProfile,
      snapshotSummary: snapshot.snapshotSummary,
      statusMessage: snapshot.statusMessage,
      lastDeletionResult: snapshot.lastDeletionResult,
      toggleTheme: toggleStoredThemeMode,
      setThemeMode: setStoredThemeMode,
      setActiveStageId: setStoredActiveStageId,
      acceptOnboarding: acceptStoredOnboarding,
      seedDemoData: seedStoredDemoData,
      deleteAccountAndData: deleteStoredAccountAndData,
    }),
    [snapshot],
  );

  return (
    <AppStateContext.Provider value={value}>
      {children}
      <div role="status" aria-live="polite" className="sr-only">
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
