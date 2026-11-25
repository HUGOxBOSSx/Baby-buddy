import type { ThemeMode } from '../theme/tokens';
import { getStageForAgeMonths, type StageId } from './stages';

export interface ChildProfileSummary {
  readonly id: string;
  readonly nicknameMx: string;
  readonly ageMonths: number;
  readonly stageId: StageId;
  readonly birthDateIso?: string;
  readonly createdAtIso: string;
  readonly updatedAtIso: string;
}

export interface AppPreferences {
  readonly themeMode: ThemeMode;
  readonly activeStageId: StageId;
  readonly onboardingAcceptedAtIso: string | null;
  readonly locale: 'es-MX';
}

export const DEFAULT_APP_PREFERENCES: AppPreferences = {
  themeMode: 'day',
  activeStageId: '0-3m',
  onboardingAcceptedAtIso: null,
  locale: 'es-MX',
};

export interface CreateChildProfileInput {
  readonly id: string;
  readonly nicknameMx: string;
  readonly ageMonths: number;
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
    ...(input.birthDateIso !== undefined
      ? { birthDateIso: input.birthDateIso }
      : {}),
    createdAtIso: nowIso,
    updatedAtIso: nowIso,
  };
}
