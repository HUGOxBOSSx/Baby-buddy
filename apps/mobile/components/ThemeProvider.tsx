import Feather from '@expo/vector-icons/Feather';
import {
  DEFAULT_APP_PREFERENCES,
  DEFAULT_THEME_SCHEDULE,
  EMPTY_HEALTH_LOG_STATE,
  ETHICAL_GUARDRAILS,
  STAGE_SPECS,
  assertEthicalComplianceConfig,
  createChildProfileSummary,
  getThemePalette,
  resolveEffectiveThemeMode,
  type AccountDeletionResult,
  type ActiveFeedTimer,
  type ChildProfileSummary,
  type CreateChildProfileInput,
  type DailyLogEntry,
  type GrowthLogEntry,
  type HealthLogState,
  type MedicationLogEntry,
  type StageId,
  type StoredSnapshotSummary,
  type TemperatureLogEntry,
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
  loadPersistedActiveFeedTimer,
  loadPersistedChildProfile,
  loadPersistedChildProfiles,
  loadPersistedDailyLogs,
  loadPersistedHealthState,
  loadPersistedStageId,
  loadPersistedThemeMode,
  loadPersistedThemeSchedule,
  savePersistedActiveFeedTimer,
  savePersistedChildProfile,
  savePersistedChildProfiles,
  savePersistedDailyLogs,
  savePersistedHealthState,
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
  readonly addChildProfile: (
    input: Omit<CreateChildProfileInput, 'id'>,
  ) => Promise<ChildProfileSummary>;
  readonly selectChildProfile: (id: string) => Promise<void>;
  readonly onboardingAccepted: boolean;
  readonly acceptOnboardingDisclaimer: () => Promise<void>;
  readonly deleteAccountAndData: (
    reason?: string,
  ) => Promise<AccountDeletionResult>;
  readonly seedDemoData: () => Promise<void>;
  readonly snapshotSummary: StoredSnapshotSummary;
  readonly childProfile: ChildProfileSummary | null;
  readonly childProfiles: readonly ChildProfileSummary[];
  readonly lastDeletionResult: AccountDeletionResult | null;
  readonly clearLastDeletionResult: () => void;
  readonly dailyLogs: readonly DailyLogEntry[];
  readonly activeFeedTimer: ActiveFeedTimer | null;
  readonly addDailyLogEntry: (entry: DailyLogEntry) => void;
  readonly deleteDailyLogEntry: (id: string) => void;
  readonly startFeedTimer: (side: 'breast_left' | 'breast_right') => void;
  readonly togglePauseFeedTimer: () => void;
  readonly saveActiveFeedTimer: () => void;
  readonly cancelActiveFeedTimer: () => void;
  readonly healthState: HealthLogState;
  readonly addTemperatureLog: (entry: TemperatureLogEntry) => void;
  readonly deleteTemperatureLog: (id: string) => void;
  readonly addMedicationLog: (entry: MedicationLogEntry) => void;
  readonly deleteMedicationLog: (id: string) => void;
  readonly addGrowthLog: (entry: GrowthLogEntry) => void;
  readonly deleteGrowthLog: (id: string) => void;
  readonly toggleVaccineCompleted: (vaccineId: string) => void;
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
  const [childProfiles, setChildProfiles] = useState<
    readonly ChildProfileSummary[]
  >([]);
  const [lastDeletionResult, setLastDeletionResult] =
    useState<AccountDeletionResult | null>(null);
  const [dailyLogs, setDailyLogs] = useState<readonly DailyLogEntry[]>([]);
  const [activeFeedTimer, setActiveFeedTimer] =
    useState<ActiveFeedTimer | null>(null);
  const [healthState, setHealthState] = useState<HealthLogState>(
    EMPTY_HEALTH_LOG_STATE,
  );
  const [statusAnnouncement, setStatusAnnouncement] = useState('');
  const [hydrated, setHydrated] = useState(false);
  const [iconsLoaded, setIconsLoaded] = useState(false);

  const refreshSnapshot = useCallback(async () => {
    const [summary, single, multi] = await Promise.all([
      accountLifecycleAdapter.getStoredSnapshotSummary(),
      loadPersistedChildProfile(),
      loadPersistedChildProfiles(),
    ]);
    const list =
      multi.profiles.length > 0 ? multi.profiles : single ? [single] : [];
    const activeProfile =
      (multi.activeId
        ? list.find((p) => p.id === multi.activeId)
        : undefined) ??
      list[0] ??
      single;
    setSnapshotSummary(summary);
    setChildProfiles(list);
    setChildProfile(activeProfile);
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
      loadPersistedChildProfiles(),
      loadPersistedDailyLogs(),
      loadPersistedActiveFeedTimer(),
      loadPersistedHealthState(),
    ])
      .then(
        ([
          savedMode,
          savedSchedule,
          savedStage,
          accepted,
          summary,
          profile,
          multi,
          savedLogs,
          savedTimer,
          savedHealth,
        ]) => {
          if (!active) {
            return;
          }
          const list =
            multi.profiles.length > 0 ? multi.profiles : profile ? [profile] : [];
          const activeProfile =
            (multi.activeId
              ? list.find((p) => p.id === multi.activeId)
              : undefined) ??
            list[0] ??
            profile;
          setThemeScheduleState(savedSchedule);
          setModeState(
            resolveEffectiveThemeMode(
              savedSchedule,
              savedMode,
              new Date().getHours(),
            ),
          );
          setSelectedStageState(activeProfile ? activeProfile.stageId : savedStage);
          setOnboardingAccepted(accepted);
          setSnapshotSummary(summary);
          setChildProfiles(list);
          setChildProfile(activeProfile);
          setDailyLogs(savedLogs);
          setActiveFeedTimer(savedTimer);
          setHealthState(savedHealth);
          setHydrated(true);
        },
      )
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
          ? 'Modo nocturno activado manualmente.'
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
      const nextList = childProfiles.some((p) => p.id === saved.id)
        ? childProfiles.map((p) => (p.id === saved.id ? saved : p))
        : [...childProfiles, saved];
      await savePersistedChildProfiles(nextList, saved);
      setChildProfiles(nextList);
      setChildProfile(saved);
      setSelectedStageState(saved.stageId);
      await refreshSnapshot();
      return saved;
    },
    [childProfile?.id, childProfiles, refreshSnapshot],
  );

  const addChildProfile = useCallback(
    async (input: Omit<CreateChildProfileInput, 'id'>) => {
      const created = createChildProfileSummary({
        ...input,
        id: `bebe-${Date.now()}`,
      });
      const nextList = [...childProfiles, created];
      await savePersistedChildProfiles(nextList, created);
      setChildProfiles(nextList);
      setChildProfile(created);
      setSelectedStageState(created.stageId);
      await refreshSnapshot();
      return created;
    },
    [childProfiles, refreshSnapshot],
  );

  const selectChildProfile = useCallback(
    async (id: string) => {
      const found = childProfiles.find((p) => p.id === id);
      if (!found) return;
      await savePersistedChildProfiles(childProfiles, found);
      setChildProfile(found);
      setSelectedStageState(found.stageId);
      await refreshSnapshot();
    },
    [childProfiles, refreshSnapshot],
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
      setChildProfiles([]);
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

  const addDailyLogEntry = useCallback((entry: DailyLogEntry) => {
    setDailyLogs((prev) => {
      const next = [entry, ...prev];
      void savePersistedDailyLogs(next);
      return next;
    });
    setStatusAnnouncement(
      entry.kind === 'feed' ? 'Toma registrada.' : 'Pañal registrado.',
    );
  }, []);

  const deleteDailyLogEntry = useCallback((id: string) => {
    setDailyLogs((prev) => {
      const next = prev.filter((e) => e.id !== id);
      void savePersistedDailyLogs(next);
      return next;
    });
    setStatusAnnouncement('Registro eliminado.');
  }, []);

  const startFeedTimer = useCallback((side: 'breast_left' | 'breast_right') => {
    const timer: ActiveFeedTimer = {
      side,
      startedAtMs: Date.now(),
      accumulatedSec: 0,
      paused: false,
    };
    setActiveFeedTimer(timer);
    void savePersistedActiveFeedTimer(timer);
  }, []);

  const togglePauseFeedTimer = useCallback(() => {
    setActiveFeedTimer((current) => {
      if (!current) return null;
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
      void savePersistedActiveFeedTimer(next);
      return next;
    });
  }, []);

  const saveActiveFeedTimer = useCallback(() => {
    if (!activeFeedTimer) return;
    const nowMs = Date.now();
    const durationSec = activeFeedTimer.paused
      ? activeFeedTimer.accumulatedSec
      : activeFeedTimer.accumulatedSec +
        Math.max(0, Math.floor((nowMs - activeFeedTimer.startedAtMs) / 1000));
    const entry: DailyLogEntry = {
      id: `feed-${nowMs}`,
      kind: 'feed',
      timestampIso: new Date(nowMs).toISOString(),
      feedType: activeFeedTimer.side,
      durationSec: Math.max(1, durationSec),
    };
    setActiveFeedTimer(null);
    void savePersistedActiveFeedTimer(null);
    addDailyLogEntry(entry);
  }, [activeFeedTimer, addDailyLogEntry]);

  const cancelActiveFeedTimer = useCallback(() => {
    setActiveFeedTimer(null);
    void savePersistedActiveFeedTimer(null);
  }, []);

  const addTemperatureLog = useCallback((entry: TemperatureLogEntry) => {
    setHealthState((prev) => {
      const next: HealthLogState = {
        ...prev,
        temperatures: [entry, ...prev.temperatures],
      };
      void savePersistedHealthState(next);
      return next;
    });
  }, []);

  const deleteTemperatureLog = useCallback((id: string) => {
    setHealthState((prev) => {
      const next: HealthLogState = {
        ...prev,
        temperatures: prev.temperatures.filter((t) => t.id !== id),
      };
      void savePersistedHealthState(next);
      return next;
    });
  }, []);

  const addMedicationLog = useCallback((entry: MedicationLogEntry) => {
    setHealthState((prev) => {
      const next: HealthLogState = {
        ...prev,
        medications: [entry, ...prev.medications],
      };
      void savePersistedHealthState(next);
      return next;
    });
  }, []);

  const deleteMedicationLog = useCallback((id: string) => {
    setHealthState((prev) => {
      const next: HealthLogState = {
        ...prev,
        medications: prev.medications.filter((m) => m.id !== id),
      };
      void savePersistedHealthState(next);
      return next;
    });
  }, []);

  const addGrowthLog = useCallback((entry: GrowthLogEntry) => {
    setHealthState((prev) => {
      const next: HealthLogState = {
        ...prev,
        growth: [entry, ...prev.growth],
      };
      void savePersistedHealthState(next);
      return next;
    });
  }, []);

  const deleteGrowthLog = useCallback((id: string) => {
    setHealthState((prev) => {
      const next: HealthLogState = {
        ...prev,
        growth: prev.growth.filter((g) => g.id !== id),
      };
      void savePersistedHealthState(next);
      return next;
    });
  }, []);

  const toggleVaccineCompleted = useCallback((vaccineId: string) => {
    setHealthState((prev) => {
      const exists = prev.completedVaccineIds.includes(vaccineId);
      const next: HealthLogState = {
        ...prev,
        completedVaccineIds: exists
          ? prev.completedVaccineIds.filter((id) => id !== vaccineId)
          : [...prev.completedVaccineIds, vaccineId],
      };
      void savePersistedHealthState(next);
      return next;
    });
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
      addChildProfile,
      selectChildProfile,
      onboardingAccepted,
      acceptOnboardingDisclaimer,
      deleteAccountAndData,
      seedDemoData,
      snapshotSummary,
      childProfile,
      childProfiles,
      lastDeletionResult,
      clearLastDeletionResult,
      dailyLogs,
      activeFeedTimer,
      addDailyLogEntry,
      deleteDailyLogEntry,
      startFeedTimer,
      togglePauseFeedTimer,
      saveActiveFeedTimer,
      cancelActiveFeedTimer,
      healthState,
      addTemperatureLog,
      deleteTemperatureLog,
      addMedicationLog,
      deleteMedicationLog,
      addGrowthLog,
      deleteGrowthLog,
      toggleVaccineCompleted,
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
      addChildProfile,
      selectChildProfile,
      onboardingAccepted,
      acceptOnboardingDisclaimer,
      deleteAccountAndData,
      seedDemoData,
      snapshotSummary,
      childProfile,
      childProfiles,
      lastDeletionResult,
      clearLastDeletionResult,
      dailyLogs,
      activeFeedTimer,
      addDailyLogEntry,
      deleteDailyLogEntry,
      startFeedTimer,
      togglePauseFeedTimer,
      saveActiveFeedTimer,
      cancelActiveFeedTimer,
      healthState,
      addTemperatureLog,
      deleteTemperatureLog,
      addMedicationLog,
      deleteMedicationLog,
      addGrowthLog,
      deleteGrowthLog,
      toggleVaccineCompleted,
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
