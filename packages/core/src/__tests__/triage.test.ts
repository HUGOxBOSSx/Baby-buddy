import { describe, expect, it } from 'vitest';
import {
  TRIAGE_LEVEL_SPECS,
  evaluateTriageHardGates,
  normalizeSearchText,
} from '../domain/triage';

describe('triage & hard-gates', () => {
  it('mantiene todos los niveles de semáforo sin paywall', () => {
    for (const spec of Object.values(TRIAGE_LEVEL_SPECS)) {
      expect(spec.paywallProtected).toBe(false);
    }
  });

  it('aplica hard-gate rojo 911 para fiebre >= 38.0 °C en menores de 3 meses', () => {
    const under3m = evaluateTriageHardGates({ ageMonths: 2.9, tempC: 38.0 });
    expect(under3m.level).toBe('red_911');
    expect(under3m.call911Immediately).toBe(true);

    const over3m = evaluateTriageHardGates({ ageMonths: 3, tempC: 38.5 });
    expect(over3m.level).toBe('yellow_pediatrician');
    expect(over3m.call911Immediately).toBe(false);
  });

  it('detecta banderas rojas críticas y urgencias naranjas', () => {
    expect(
      evaluateTriageHardGates({ ageMonths: 10, severeBreathingDistress: true })
        .level,
    ).toBe('red_911');
    expect(
      evaluateTriageHardGates({ ageMonths: 10, noWetDiapers8h: true }).level,
    ).toBe('orange_urgent');
    expect(evaluateTriageHardGates({ ageMonths: 10 }).level).toBe('green_home');
  });

  it('normaliza acentos y mayúsculas para búsqueda 3:00 AM', () => {
    expect(normalizeSearchText('  Cólicos y Fiebre °C  ')).toBe(
      'colicos y fiebre °c',
    );
  });
});
