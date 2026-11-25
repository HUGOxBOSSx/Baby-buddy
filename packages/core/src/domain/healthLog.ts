import type { DailyLogSummary } from './dailyLog';
import type { ChildProfileSummary } from './profile';

export interface TemperatureLogEntry {
  readonly id: string;
  readonly timestampIso: string;
  readonly tempC: number;
  readonly noteMx?: string;
}

export interface MedicationLogEntry {
  readonly id: string;
  readonly timestampIso: string;
  readonly nameMx: string;
  readonly doseNoteMx: string;
}

export interface GrowthLogEntry {
  readonly id: string;
  readonly timestampIso: string;
  readonly weightKg?: number;
  readonly heightCm?: number;
}

export interface VaccineChecklistItem {
  readonly id: string;
  readonly nameMx: string;
  readonly ageLabelMx: string;
}

export interface HealthLogState {
  readonly temperatures: readonly TemperatureLogEntry[];
  readonly medications: readonly MedicationLogEntry[];
  readonly growth: readonly GrowthLogEntry[];
  readonly completedVaccineIds: readonly string[];
}

export const EMPTY_HEALTH_LOG_STATE: HealthLogState = {
  temperatures: [],
  medications: [],
  growth: [],
  completedVaccineIds: [],
};

export const MX_VACCINE_CHECKLIST: readonly VaccineChecklistItem[] = [
  { id: 'bcg-0m', nameMx: 'BCG (tuberculosis)', ageLabelMx: 'Al nacer' },
  { id: 'hepb-0m', nameMx: 'Hepatitis B (1.ª dosis)', ageLabelMx: 'Al nacer' },
  { id: 'hexa-2m', nameMx: 'Hexavalente (1.ª dosis)', ageLabelMx: '2 meses' },
  { id: 'rota-2m', nameMx: 'Rotavirus (1.ª dosis)', ageLabelMx: '2 meses' },
  { id: 'neumo-2m', nameMx: 'Neumocócica (1.ª dosis)', ageLabelMx: '2 meses' },
  { id: 'hexa-4m', nameMx: 'Hexavalente (2.ª dosis)', ageLabelMx: '4 meses' },
  { id: 'rota-4m', nameMx: 'Rotavirus (2.ª dosis)', ageLabelMx: '4 meses' },
  { id: 'neumo-4m', nameMx: 'Neumocócica (2.ª dosis)', ageLabelMx: '4 meses' },
  { id: 'hexa-6m', nameMx: 'Hexavalente (3.ª dosis)', ageLabelMx: '6 meses' },
  { id: 'srp-12m', nameMx: 'SRP Triple viral (1.ª dosis)', ageLabelMx: '12 meses' },
  { id: 'neumo-12m', nameMx: 'Neumocócica (refuerzo)', ageLabelMx: '12 meses' },
  { id: 'hexa-18m', nameMx: 'Hexavalente (4.ª dosis)', ageLabelMx: '18 meses' },
  { id: 'dpt-4a', nameMx: 'DPT (refuerzo)', ageLabelMx: '4 años' },
  { id: 'srp-6a', nameMx: 'SRP Triple viral (2.ª dosis)', ageLabelMx: '6 años' },
] as const;

export function evaluateTemperatureAlertMx(
  tempC: number,
  ageMonths: number,
): {
  readonly level: 'normal' | 'caution' | 'urgent_911';
  readonly messageMx: string;
} {
  if (tempC >= 38.0 && ageMonths < 3) {
    return {
      level: 'urgent_911',
      messageMx:
        'Temperatura >= 38.0 °C en menor de 3 meses: requiere valoración médica urgente inmediata (911 o urgencias).',
    };
  }
  if (tempC >= 38.0) {
    return {
      level: 'caution',
      messageMx:
        'Fiebre (>= 38.0 °C): observa su estado general, mantén hidratación y consulta a tu pediatra (o antes si hay señales de alerta).',
    };
  }
  return {
    level: 'normal',
    messageMx: 'Temperatura registrada en rango habitual (< 38.0 °C).',
  };
}

export function parseHealthLogState(raw: string | null): HealthLogState {
  if (!raw || raw.trim().length === 0) return EMPTY_HEALTH_LOG_STATE;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) {
      return EMPTY_HEALTH_LOG_STATE;
    }
    const obj = parsed as Record<string, unknown>;
    return {
      temperatures: Array.isArray(obj.temperatures)
        ? (obj.temperatures as TemperatureLogEntry[])
        : [],
      medications: Array.isArray(obj.medications)
        ? (obj.medications as MedicationLogEntry[])
        : [],
      growth: Array.isArray(obj.growth) ? (obj.growth as GrowthLogEntry[]) : [],
      completedVaccineIds: Array.isArray(obj.completedVaccineIds)
        ? obj.completedVaccineIds.filter(
            (id): id is string => typeof id === 'string',
          )
        : [],
    };
  } catch {
    return EMPTY_HEALTH_LOG_STATE;
  }
}

export function buildPediatricianReportText(input: {
  readonly profile: ChildProfileSummary | null;
  readonly dailySummary3d: DailyLogSummary;
  readonly health: HealthLogState;
  readonly generatedAtIso: string;
}): string {
  const { profile, dailySummary3d, health, generatedAtIso } = input;
  const lines: string[] = [
    '=== REPORTE PARA PEDIATRA — BABY BUDDY MX ===',
    `Fecha de corte: ${generatedAtIso.slice(0, 10)}`,
    profile
      ? `Bebé: ${profile.nicknameMx} · Edad: ${profile.ageMonths} meses (${profile.stageId})`
      : 'Bebé: Sin perfil guardado',
    '',
    '--- Últimos 3 días (Registro diario) ---',
    `Tomas totales: ${dailySummary3d.totalFeeds} (promedio ${dailySummary3d.avgFeedsPerDay}/día)`,
    `Pecho: ${dailySummary3d.totalBreastMin} min · Biberón: ${dailySummary3d.totalBottleMl} ml`,
    `Pañales mojados (pipí): ${dailySummary3d.wetDiapers} (promedio ${dailySummary3d.avgWetDiapersPerDay}/día)`,
    `Evacuaciones (popó): ${dailySummary3d.dirtyDiapers} (promedio ${dailySummary3d.avgDirtyDiapersPerDay}/día)`,
    '',
    '--- Temperaturas recientes (°C) ---',
    ...(health.temperatures.length > 0
      ? health.temperatures
          .slice(0, 5)
          .map(
            (t) =>
              `• ${t.timestampIso.slice(0, 16).replace('T', ' ')}: ${t.tempC.toFixed(1)} °C${t.noteMx ? ` (${t.noteMx})` : ''}`,
          )
      : ['• Sin registros de temperatura']),
    '',
    '--- Medicamentos registrados (según indicación médica) ---',
    ...(health.medications.length > 0
      ? health.medications
          .slice(0, 5)
          .map(
            (m) =>
              `• ${m.timestampIso.slice(0, 16).replace('T', ' ')}: ${m.nameMx} — ${m.doseNoteMx}`,
          )
      : ['• Sin medicamentos registrados']),
    '',
    '--- Crecimiento reciente (kg / cm) ---',
    ...(health.growth.length > 0
      ? health.growth
          .slice(0, 5)
          .map(
            (g) =>
              `• ${g.timestampIso.slice(0, 10)}: ${g.weightKg !== undefined ? `${g.weightKg} kg` : '—'} · ${g.heightCm !== undefined ? `${g.heightCm} cm` : '—'}`,
          )
      : ['• Sin registros de peso/talla']),
    '',
    `Vacunas Cartilla MX marcadas: ${health.completedVaccineIds.length} de ${MX_VACCINE_CHECKLIST.length}`,
    '',
    'Nota: Registro informativo llevado por cuidadores; no sustituye valoración médica.',
  ];
  return lines.join('\n');
}
