import { describe, expect, it } from 'vitest';
import {
  DEFAULT_THEME_SCHEDULE,
  createChildProfileSummary,
  formatChildAgeMx,
  resolveEffectiveThemeMode,
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
});
