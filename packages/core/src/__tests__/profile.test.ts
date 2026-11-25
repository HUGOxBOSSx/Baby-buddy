import { describe, expect, it } from 'vitest';
import {
  DEFAULT_THEME_SCHEDULE,
  calculateAgeMonthsFromBirthDate,
  createChildProfileSummary,
  formatChildAgeMx,
  resolveEffectiveThemeMode,
  resolveLiveChildProfile,
} from '../domain/profile';

describe('profile & theme schedule helpers', () => {
  it('incluye sexo y formatea edad en español de México', () => {
    const profile = createChildProfileSummary({
      id: 'bebe-1',
      nicknameMx: 'Mateo',
      ageMonths: 14,
      sex: 'niño',
    });
    expect(profile.sex).toBe('niño');
    expect(profile.stageId).toBe('1-3a');
    expect(formatChildAgeMx(0)).toBe('Recién nacido (0 meses)');
    expect(formatChildAgeMx(1)).toBe('1 mes');
    expect(formatChildAgeMx(4)).toBe('4 meses');
    expect(formatChildAgeMx(12)).toBe('1 año');
    expect(formatChildAgeMx(14)).toBe('1 año y 2 meses');
  });

  it('resuelve modo noche automático por horario (20:00 a 07:00 por defecto)', () => {
    expect(resolveEffectiveThemeMode(DEFAULT_THEME_SCHEDULE, 'day', 20)).toBe(
      'night_3am',
    );
    expect(resolveEffectiveThemeMode(DEFAULT_THEME_SCHEDULE, 'day', 3)).toBe(
      'night_3am',
    );
    expect(resolveEffectiveThemeMode(DEFAULT_THEME_SCHEDULE, 'day', 7)).toBe(
      'day',
    );
    expect(resolveEffectiveThemeMode(DEFAULT_THEME_SCHEDULE, 'day', 14)).toBe(
      'day',
    );
    expect(
      resolveEffectiveThemeMode(
        { mode: 'manual', nightStartHour: 20, nightEndHour: 7 },
        'day',
        23,
      ),
    ).toBe('day');
  });

  it('calcula edad en meses y etapa automáticamente desde la fecha de nacimiento', () => {
    const refNow = new Date(2026, 10, 24); // 2026-11-24
    expect(calculateAgeMonthsFromBirthDate('2026-09-24', refNow)).toBe(2);
    expect(calculateAgeMonthsFromBirthDate('2025-11-24', refNow)).toBe(12);
    expect(() =>
      calculateAgeMonthsFromBirthDate('2027-01-01', refNow),
    ).toThrow(RangeError);

    const live = resolveLiveChildProfile(
      {
        id: 'bebe-2',
        nicknameMx: 'Sofía',
        ageMonths: 2,
        stageId: '0-3m',
        birthDateIso: '2026-06-24',
        createdAtIso: '2026-06-24T00:00:00.000Z',
        updatedAtIso: '2026-06-24T00:00:00.000Z',
      },
      refNow,
    );
    expect(live.ageMonths).toBe(5);
    expect(live.stageId).toBe('3-12m');
  });

  it('codifica y decodifica código familiar offline con acentos y fecha', async () => {
    const { decodeFamilyBabyCode, encodeFamilyBabyCode } = await import(
      '../domain/profile'
    );
    const code = encodeFamilyBabyCode({
      nicknameMx: 'Sofía',
      ageMonths: 4,
      sex: 'niña',
      birthDateIso: '2026-07-25',
    });
    expect(code.startsWith('BBMX-1-')).toBe(true);
    expect(decodeFamilyBabyCode(code)).toEqual({
      nicknameMx: 'Sofía',
      ageMonths: 4,
      sex: 'niña',
      birthDateIso: '2026-07-25',
    });
    expect(decodeFamilyBabyCode('INVALIDO')).toBeNull();
  });
});
