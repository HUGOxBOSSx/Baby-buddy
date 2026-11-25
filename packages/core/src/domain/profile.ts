import type { ThemeMode } from '../theme/tokens';
import { getStageForAgeMonths, type StageId } from './stages';

export type ChildSex = 'niño' | 'niña' | 'no_especificado';

export const CHILD_SEX_LABELS_MX: Record<ChildSex, string> = {
  niño: 'Niño',
  niña: 'Niña',
  no_especificado: 'No especificado',
};

export type ThemeScheduleMode = 'auto' | 'manual';

export interface ThemeScheduleConfig {
  readonly mode: ThemeScheduleMode;
  readonly nightStartHour: number;
  readonly nightEndHour: number;
}

export const DEFAULT_THEME_SCHEDULE: ThemeScheduleConfig = {
  mode: 'auto',
  nightStartHour: 20,
  nightEndHour: 7,
};

export function isValidHour(hour: number): boolean {
  return Number.isInteger(hour) && hour >= 0 && hour <= 23;
}

export function resolveEffectiveThemeMode(
  schedule: ThemeScheduleConfig,
  manualMode: ThemeMode,
  currentHour: number,
): ThemeMode {
  if (schedule.mode === 'manual') {
    return manualMode;
  }
  if (
    !isValidHour(schedule.nightStartHour) ||
    !isValidHour(schedule.nightEndHour) ||
    !isValidHour(currentHour)
  ) {
    return manualMode;
  }
  if (schedule.nightStartHour === schedule.nightEndHour) {
    return manualMode;
  }
  if (schedule.nightStartHour > schedule.nightEndHour) {
    return currentHour >= schedule.nightStartHour ||
      currentHour < schedule.nightEndHour
      ? 'night_3am'
      : 'day';
  }
  return currentHour >= schedule.nightStartHour &&
    currentHour < schedule.nightEndHour
    ? 'night_3am'
    : 'day';
}

export function formatChildAgeMx(ageMonths: number): string {
  getStageForAgeMonths(ageMonths);
  const rounded = Math.floor(ageMonths);
  if (rounded === 0) {
    return 'Recién nacido (0 meses)';
  }
  if (rounded === 1) {
    return '1 mes';
  }
  if (rounded < 12) {
    return `${rounded} meses`;
  }
  const years = Math.floor(rounded / 12);
  const remMonths = rounded % 12;
  const yearLabel = years === 1 ? '1 año' : `${years} años`;
  if (remMonths === 0) {
    return yearLabel;
  }
  const monthLabel = remMonths === 1 ? '1 mes' : `${remMonths} meses`;
  return `${yearLabel} y ${monthLabel}`;
}

export interface ChildProfileSummary {
  readonly id: string;
  readonly nicknameMx: string;
  readonly ageMonths: number;
  readonly stageId: StageId;
  readonly sex?: ChildSex;
  readonly birthDateIso?: string;
  readonly createdAtIso: string;
  readonly updatedAtIso: string;
}

export interface AppPreferences {
  readonly themeMode: ThemeMode;
  readonly themeSchedule: ThemeScheduleConfig;
  readonly activeStageId: StageId;
  readonly onboardingAcceptedAtIso: string | null;
  readonly locale: 'es-MX';
}

export const DEFAULT_APP_PREFERENCES: AppPreferences = {
  themeMode: 'day',
  themeSchedule: DEFAULT_THEME_SCHEDULE,
  activeStageId: '0-3m',
  onboardingAcceptedAtIso: null,
  locale: 'es-MX',
};

export interface CreateChildProfileInput {
  readonly id: string;
  readonly nicknameMx: string;
  readonly ageMonths: number;
  readonly sex?: ChildSex;
  readonly birthDateIso?: string;
  readonly nowIso?: string;
}

export function createChildProfileSummary(
  input: CreateChildProfileInput,
): ChildProfileSummary {
  const trimmedId = input.id.trim();
  if (!trimmedId) {
    throw new Error('El identificador del perfil infantil no puede estar vacío.');
  }

  const trimmedNickname = input.nicknameMx.trim();
  if (!trimmedNickname) {
    throw new Error('El nombre o apodo del bebé no puede estar vacío.');
  }

  const stageId = getStageForAgeMonths(input.ageMonths);
  const nowIso = input.nowIso ?? new Date().toISOString();

  return {
    id: trimmedId,
    nicknameMx: trimmedNickname,
    ageMonths: input.ageMonths,
    stageId,
    sex: input.sex ?? 'no_especificado',
    ...(input.birthDateIso !== undefined
      ? { birthDateIso: input.birthDateIso }
      : {}),
    createdAtIso: nowIso,
    updatedAtIso: nowIso,
  };
}
