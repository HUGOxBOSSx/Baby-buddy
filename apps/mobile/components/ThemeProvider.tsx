import Feather from '@expo/vector-icons/Feather';
import {
  DEFAULT_APP_PREFERENCES,
  DEFAULT_THEME_SCHEDULE,
  ETHICAL_GUARDRAILS,
  STAGE_SPECS,
  assertEthicalComplianceConfig,
  getThemePalette,
  resolveEffectiveThemeMode,
  type AccountDeletionResult,
  type ChildProfileSummary,
  type CreateChildProfileInput,
  type StageId,
  type StoredSnapshotSummary,
  type ThemeMode,
  type ThemePalette,
  type ThemeScheduleConfig,
} from '@baby-buddy/core';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  accountLifecycleAdapter,
  loadPersistedChildProfile,
  loadPersistedStageId,
  loadPersistedThemeMode,
  loadPersistedThemeSchedule,
  savePersistedChildProfile,
  savePersistedStageId,
  savePersistedThemeMode,
  savePersistedThemeSchedule,
} from '../lib/localAdapter';

assertEthicalComplianceConfig(ETHICAL_GUARDRAILS);

const EMPTY_SNAPSHOT_SUMMARY: StoredSnapshotSummary = {
  hasActiveProfile: false,
  onboardingAccepted: false,
  itemCount: 0,
  keys: [],
};

export interface ThemeContextValue {
  readonly mode: ThemeMode;
  readonly palette: ThemePalette;
  readonly themeSchedule: ThemeScheduleConfig;
  readonly setThemeSchedule: (schedule: ThemeScheduleConfig) => void;
  readonly toggleMode: () => void;
  readonly setMode: (nextMode: ThemeMode) => void;
  readonly selectedStage: StageId;
  readonly setSelectedStage: (stageId: StageId) => void;
  readonly saveChildProfile: (
    input: Omit<CreateChildProfileInput, 'id'>,
  ) => Promise<ChildProfileSummary>;
  readonly onboardingAccepted: boolean;
  readonly acceptOnboardingDisclaimer: () => Promise<void>;
  readonly deleteAccountAndData: (
    reason?: string,
  ) => Promise<AccountDeletionResult>;
  readonly seedDemoData: () => Promise<void>;
  readonly snapshotSummary: StoredSnapshotSummary;
  readonly childProfile: ChildProfileSummary | null;
  readonly lastDeletionResult: AccountDeletionResult | null;
  readonly clearLastDeletionResult: () => void;
  readonly statusAnnouncement: string;
  readonly hydrated: boolean;
  readonly iconsLoaded: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { readonly children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(
    DEFAULT_APP_PREFERENCES.themeMode,
  );
  const [themeSchedule, setThemeScheduleState] =
    useState<ThemeScheduleConfig>(DEFAULT_THEME_SCHEDULE);
  const [selectedStage, setSelectedStageState] = useState<StageId>(
    DEFAULT_APP_PREFERENCES.activeStageId,
  );
  const [onboardingAccepted, setOnboardingAccepted] = useState(false);
  const [snapshotSummary, setSnapshotSummary] = useState<StoredSnapshotSummary>(
    EMPTY_SNAPSHOT_SUMMARY,
  );
  const [childProfile, setChildProfile] = useState<ChildProfileSummary | null>(
    null,
  );
  const [lastDeletionResult, setLastDeletionResult] =
    useState<AccountDeletionResult | null>(null);
  const [statusAnnouncement, setStatusAnnouncement] = useState('');
  const [hydrated, setHydrated] = useState(false);
  const [iconsLoaded, setIconsLoaded] = useState(false);

  const refreshSnapshot = useCallback(async () => {
    const [summary, profile] = await Promise.all([
      accountLifecycleAdapter.getStoredSnapshotSummary(),
      loadPersistedChildProfile(),
    ]);
    setSnapshotSummary(summary);
    setChildProfile(profile);
    return summary;
  }, []);

  useEffect(() => {
    let active = true;

    assertEthicalComplianceConfig(ETHICAL_GUARDRAILS);

    Feather.loadFont()
      .then(() => {
        if (active) {
          setIconsLoaded(true);
        }
      })
      .catch(() => {
        // Fallback symbol badge remains active in StatusBadge if font preload fails.
      });

    Promise.all([
      loadPersistedThemeMode(),
      loadPersistedThemeSchedule(),
      loadPersistedStageId(),
      accountLifecycleAdapter.hasAcceptedOnboardingDisclaimer(),
      accountLifecycleAdapter.getStoredSnapshotSummary(),
      loadPersistedChildProfile(),
    ])
      .then(([savedMode, savedSchedule, savedStage, accepted, summary, profile]) => {
        if (!active) {
          return;
        }
        setThemeScheduleState(savedSchedule);
        setModeState(
          resolveEffectiveThemeMode(
            savedSchedule,
            savedMode,
            new Date().getHours(),
          ),
        );
        setSelectedStageState(profile ? profile.stageId : savedStage);
        setOnboardingAccepted(accepted);
        setSnapshotSummary(summary);
        setChildProfile(profile);
        setHydrated(true);
      })
      .catch(() => {
        if (active) {
          setHydrated(true);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const setMode = useCallback(
    (nextMode: ThemeMode) => {
      setModeState(nextMode);
      const manualSchedule: ThemeScheduleConfig = {
        ...themeSchedule,
        mode: 'manual',
      };
      setThemeScheduleState(manualSchedule);
      setStatusAnnouncement(
        nextMode === 'night_3am'
          ? 'Modo 3:00 AM activado manualmente.'
          : 'Modo Calma de día activado manualmente.',
      );
      void savePersistedThemeMode(nextMode);
      void savePersistedThemeSchedule(manualSchedule);
    },
    [themeSchedule],
  );

  const setThemeSchedule = useCallback(
    (schedule: ThemeScheduleConfig) => {
      setThemeScheduleState(schedule);
      setModeState(
        resolveEffectiveThemeMode(schedule, mode, new Date().getHours()),
      );
      void savePersistedThemeSchedule(schedule);
    },
    [mode],
  );

  const saveChildProfile = useCallback(
    async (input: Omit<CreateChildProfileInput, 'id'>) => {
      const saved = await savePersistedChildProfile(input, childProfile?.id);
      setChildProfile(saved);
      setSelectedStageState(saved.stageId);
      await refreshSnapshot();
      return saved;
    },
    [childProfile?.id, refreshSnapshot],
  );

  const toggleMode = useCallback(() => {
    const next: ThemeMode = mode === 'day' ? 'night_3am' : 'day';
    setMode(next);
  }, [mode, setMode]);

  const setSelectedStage = useCallback((stageId: StageId) => {
    setSelectedStageState(stageId);
    setStatusAnnouncement(`Etapa activa: ${STAGE_SPECS[stageId].label}.`);
    void savePersistedStageId(stageId);
  }, []);

  const acceptOnboardingDisclaimer = useCallback(async () => {
    await accountLifecycleAdapter.acceptOnboardingDisclaimer(
      new Date().toISOString(),
    );
    await refreshSnapshot();
    setOnboardingAccepted(true);
    setLastDeletionResult(null);
    setStatusAnnouncement(
      'Aviso orientativo aceptado. Bienvenida o bienvenido a Baby Buddy MX.',
    );
  }, [refreshSnapshot]);

  const seedDemoData = useCallback(async () => {
    await accountLifecycleAdapter.seedDemoLocalData(new Date().toISOString());
    const [savedMode, savedStage] = await Promise.all([
      loadPersistedThemeMode(),
      loadPersistedStageId(),
    ]);
    await refreshSnapshot();
    setModeState(savedMode);
    setSelectedStageState(savedStage);
    setOnboardingAccepted(true);
    setLastDeletionResult(null);
    setStatusAnnouncement(
      'Perfil de demostración guardado localmente en este dispositivo.',
    );
  }, [refreshSnapshot]);

  const deleteAccountAndData = useCallback(
    async (reason?: string): Promise<AccountDeletionResult> => {
      const result = await accountLifecycleAdapter.deleteAccountAndData({
        reason,
        confirmedAtIso: new Date().toISOString(),
      });
      setModeState(DEFAULT_APP_PREFERENCES.themeMode);
      setSelectedStageState(DEFAULT_APP_PREFERENCES.activeStageId);
      setOnboardingAccepted(false);
      setChildProfile(null);
      await refreshSnapshot();
      setLastDeletionResult(result);
      setStatusAnnouncement(
        `Datos locales eliminados: ${result.deletedKeysCount} registros borrados.`,
      );
      return result;
    },
    [refreshSnapshot],
  );

  const clearLastDeletionResult = useCallback(() => {
    setLastDeletionResult(null);
  }, []);

  const palette = useMemo(() => getThemePalette(mode), [mode]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      palette,
      themeSchedule,
      setThemeSchedule,
      toggleMode,
      setMode,
      selectedStage,
      setSelectedStage,
      saveChildProfile,
      onboardingAccepted,
      acceptOnboardingDisclaimer,
      deleteAccountAndData,
      seedDemoData,
      snapshotSummary,
      childProfile,
      lastDeletionResult,
      clearLastDeletionResult,
      statusAnnouncement,
      hydrated,
      iconsLoaded,
    }),
    [
      mode,
      palette,
      themeSchedule,
      setThemeSchedule,
      toggleMode,
      setMode,
      selectedStage,
      setSelectedStage,
      saveChildProfile,
      onboardingAccepted,
      acceptOnboardingDisclaimer,
      deleteAccountAndData,
      seedDemoData,
      snapshotSummary,
      childProfile,
      lastDeletionResult,
      clearLastDeletionResult,
      statusAnnouncement,
      hydrated,
      iconsLoaded,
    ],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useThemeContext(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (ctx === null) {
    throw new Error(
      'useThemeContext debe utilizarse dentro de un ThemeProvider.',
    );
  }
  return ctx;
}
