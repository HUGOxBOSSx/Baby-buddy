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

export function formatChildAgeCompactMx(
  profile: Pick<ChildProfileSummary, 'ageMonths' | 'birthDateIso'>,
  now: Date = new Date(),
): string {
  const ymd = profile.birthDateIso?.slice(0, 10) ?? '';
  const match = YMD_DATE_REGEX.exec(ymd);
  if (match) {
    const year = Number.parseInt(match[1] ?? '', 10);
    const month = Number.parseInt(match[2] ?? '', 10);
    const day = Number.parseInt(match[3] ?? '', 10);
    const utcCheck = new Date(Date.UTC(year, month - 1, day));
    if (
      utcCheck.getUTCFullYear() === year &&
      utcCheck.getUTCMonth() === month - 1 &&
      utcCheck.getUTCDate() === day
    ) {
      let months =
        (now.getFullYear() - year) * 12 + (now.getMonth() + 1 - month);
      let days = now.getDate() - day;
      if (days < 0) {
        months -= 1;
        const prevMonthLastDay = new Date(
          now.getFullYear(),
          now.getMonth(),
          0,
        ).getDate();
        days += prevMonthLastDay;
      }
      const safeMonths = Math.max(0, Math.min(72, months));
      const safeDays = Math.max(0, days);
      return `${safeMonths}m ${safeDays}d`;
    }
  }
  return `${Math.max(0, Math.floor(profile.ageMonths))}m 0d`;
}

const YMD_DATE_REGEX = /^(\d{4})-(\d{2})-(\d{2})$/;

export function calculateAgeMonthsFromBirthDate(
  birthDateYmd: string,
  now: Date = new Date(),
): number {
  const match = YMD_DATE_REGEX.exec(birthDateYmd.trim());
  if (!match) {
    throw new RangeError('La fecha de nacimiento debe tener formato AAAA-MM-DD.');
  }
  const year = Number.parseInt(match[1] ?? '', 10);
  const month = Number.parseInt(match[2] ?? '', 10);
  const day = Number.parseInt(match[3] ?? '', 10);
  const utcCheck = new Date(Date.UTC(year, month - 1, day));
  if (
    utcCheck.getUTCFullYear() !== year ||
    utcCheck.getUTCMonth() !== month - 1 ||
    utcCheck.getUTCDate() !== day
  ) {
    throw new RangeError('La fecha de nacimiento no es una fecha válida.');
  }

  let months =
    (now.getFullYear() - year) * 12 + (now.getMonth() + 1 - month);
  if (now.getDate() < day) {
    months -= 1;
  }
  if (months < 0 || months > 72) {
    throw new RangeError(
      'La fecha de nacimiento debe corresponder a una edad entre 0 y 72 meses.',
    );
  }
  return months;
}

export function resolveLiveChildProfile(
  profile: ChildProfileSummary,
  now: Date = new Date(),
): ChildProfileSummary {
  if (!profile.birthDateIso) {
    return profile;
  }
  const ymd = profile.birthDateIso.slice(0, 10);
  if (!YMD_DATE_REGEX.test(ymd)) {
    return profile;
  }
  try {
    const ageMonths = calculateAgeMonthsFromBirthDate(ymd, now);
    const stageId = getStageForAgeMonths(ageMonths);
    if (ageMonths === profile.ageMonths && stageId === profile.stageId) {
      return profile;
    }
    return {
      ...profile,
      ageMonths,
      stageId,
    };
  } catch {
    return profile;
  }
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
  readonly ageMonths?: number;
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

  const nowIso = input.nowIso ?? new Date().toISOString();
  const resolvedAgeMonths =
    input.birthDateIso !== undefined
      ? calculateAgeMonthsFromBirthDate(input.birthDateIso.slice(0, 10))
      : input.ageMonths ?? 0;

  const stageId = getStageForAgeMonths(resolvedAgeMonths);

  return {
    id: trimmedId,
    nicknameMx: trimmedNickname,
    ageMonths: resolvedAgeMonths,
    stageId,
    sex: input.sex ?? 'no_especificado',
    ...(input.birthDateIso !== undefined
      ? { birthDateIso: input.birthDateIso }
      : {}),
    createdAtIso: nowIso,
    updatedAtIso: nowIso,
  };
}

export const FAMILY_CODE_PREFIX = 'BBMX-1-' as const;

export function encodeFamilyBabyCode(
  profile: Pick<
    ChildProfileSummary,
    'nicknameMx' | 'ageMonths' | 'sex' | 'birthDateIso'
  >,
): string {
  const payload: Record<string, unknown> = {
    n: profile.nicknameMx.trim(),
    a: profile.ageMonths,
    s: profile.sex ?? 'no_especificado',
  };
  if (profile.birthDateIso) {
    payload.b = profile.birthDateIso;
  }
  const utf8Bytes = encodeURIComponent(JSON.stringify(payload)).replace(
    /%([0-9A-F]{2})/g,
    (_, hex: string) => String.fromCharCode(Number.parseInt(hex, 16)),
  );
  const b64 = btoa(utf8Bytes)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  return `${FAMILY_CODE_PREFIX}${b64}`;
}

export function decodeFamilyBabyCode(
  raw: string,
): Omit<CreateChildProfileInput, 'id'> | null {
  const trimmed = raw.trim();
  if (!trimmed.startsWith(FAMILY_CODE_PREFIX)) return null;
  const token = trimmed.slice(FAMILY_CODE_PREFIX.length);
  if (!token) return null;
  try {
    const padded = token
      .replace(/-/g, '+')
      .replace(/_/g, '/')
      .padEnd(Math.ceil(token.length / 4) * 4, '=');
    const bin = atob(padded);
    const pct = Array.from(bin)
      .map((ch) => `%${ch.charCodeAt(0).toString(16).padStart(2, '0')}`)
      .join('');
    const parsed: unknown = JSON.parse(decodeURIComponent(pct));
    if (typeof parsed !== 'object' || parsed === null) return null;
    const obj = parsed as Record<string, unknown>;
    if (typeof obj.n !== 'string' || obj.n.trim().length === 0) return null;
    const ageMonths =
      typeof obj.a === 'number' &&
      Number.isInteger(obj.a) &&
      obj.a >= 0 &&
      obj.a <= 72
        ? obj.a
        : 0;
    const sex: ChildSex =
      obj.s === 'niño' || obj.s === 'niña' || obj.s === 'no_especificado'
        ? obj.s
        : 'no_especificado';
    const birthDateIso =
      typeof obj.b === 'string' && /^\d{4}-\d{2}-\d{2}/.test(obj.b)
        ? obj.b.slice(0, 10)
        : undefined;
    return {
      nicknameMx: obj.n.trim(),
      ageMonths,
      sex,
      ...(birthDateIso ? { birthDateIso } : {}),
    };
  } catch {
    return null;
  }
}
