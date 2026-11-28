import {
  BABY_EVENT_OPTIONS_MX,
  type DailyLogSummary,
  type EventLogEntry,
} from './dailyLog';
import { formatChildAgeCompactMx, type ChildProfileSummary } from './profile';

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
  readonly headCircumferenceCm?: number;
  readonly ageAtEntryDays?: number;
  readonly ageLabelMx?: string;
}

export interface VaccineChecklistItem {
  readonly id: string;
  readonly nameMx: string;
  readonly ageLabelMx: string;
  readonly ageMonths: number;
}

export interface HealthLogState {
  readonly temperatures: readonly TemperatureLogEntry[];
  readonly medications: readonly MedicationLogEntry[];
  readonly growth: readonly GrowthLogEntry[];
  readonly completedVaccineIds: readonly string[];
  readonly completedMilestoneIds?: readonly string[];
}

export const EMPTY_HEALTH_LOG_STATE: HealthLogState = {
  temperatures: [],
  medications: [],
  growth: [],
  completedVaccineIds: [],
  completedMilestoneIds: [],
};

export const MX_VACCINE_CHECKLIST: readonly VaccineChecklistItem[] = [
  { id: 'bcg-0m', nameMx: 'BCG (tuberculosis)', ageLabelMx: 'Al nacer', ageMonths: 0 },
  { id: 'hepb-0m', nameMx: 'Hepatitis B (1.ª dosis)', ageLabelMx: 'Al nacer', ageMonths: 0 },
  { id: 'hexa-2m', nameMx: 'Hexavalente (1.ª dosis)', ageLabelMx: '2 meses', ageMonths: 2 },
  { id: 'rota-2m', nameMx: 'Rotavirus (1.ª dosis)', ageLabelMx: '2 meses', ageMonths: 2 },
  { id: 'neumo-2m', nameMx: 'Neumocócica (1.ª dosis)', ageLabelMx: '2 meses', ageMonths: 2 },
  { id: 'hexa-4m', nameMx: 'Hexavalente (2.ª dosis)', ageLabelMx: '4 meses', ageMonths: 4 },
  { id: 'rota-4m', nameMx: 'Rotavirus (2.ª dosis)', ageLabelMx: '4 meses', ageMonths: 4 },
  { id: 'neumo-4m', nameMx: 'Neumocócica (2.ª dosis)', ageLabelMx: '4 meses', ageMonths: 4 },
  { id: 'hexa-6m', nameMx: 'Hexavalente (3.ª dosis)', ageLabelMx: '6 meses', ageMonths: 6 },
  { id: 'srp-12m', nameMx: 'SRP Triple viral (1.ª dosis)', ageLabelMx: '12 meses', ageMonths: 12 },
  { id: 'neumo-12m', nameMx: 'Neumocócica (refuerzo)', ageLabelMx: '12 meses', ageMonths: 12 },
  { id: 'hexa-18m', nameMx: 'Hexavalente (4.ª dosis)', ageLabelMx: '18 meses', ageMonths: 18 },
  { id: 'dpt-4a', nameMx: 'DPT (refuerzo)', ageLabelMx: '4 años', ageMonths: 48 },
  { id: 'srp-6a', nameMx: 'SRP Triple viral (2.ª dosis)', ageLabelMx: '6 años', ageMonths: 72 },
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
      completedMilestoneIds: Array.isArray(obj.completedMilestoneIds)
        ? obj.completedMilestoneIds.filter(
            (id): id is string => typeof id === 'string',
          )
        : [],
    };
  } catch {
    return EMPTY_HEALTH_LOG_STATE;
  }
}

function formatMinutesReadable(totalMin: number): string {
  if (totalMin < 60) {
    return `${totalMin} min`;
  }
  const hours = Math.floor(totalMin / 60);
  const mins = totalMin % 60;
  return `${totalMin} min (${hours} h ${mins} min)`;
}

function formatSummaryBlock(title: string, summary: DailyLogSummary): readonly string[] {
  return [
    title,
    `Tomas totales: ${summary.totalFeeds} (promedio ${summary.avgFeedsPerDay}/día)`,
    `Pecho: ${summary.totalBreastMin} min (promedio ${summary.avgBreastMinPerDay} min/día) · Biberón: ${summary.totalBottleMl} ml (promedio ${summary.avgBottleMlPerDay} ml/día)`,
    ...(summary.totalPumpingMl > 0 || summary.solidsCount > 0
      ? [
          `Extracción: ${summary.totalPumpingMl} ml (promedio ${summary.avgPumpingMlPerDay} ml/día) · Sólidos: ${summary.solidsCount} (promedio ${summary.avgSolidsPerDay}/día)`,
        ]
      : []),
    `Pañales mojados (pipí): ${summary.wetDiapers} (promedio ${summary.avgWetDiapersPerDay}/día)`,
    `Evacuaciones (popó): ${summary.dirtyDiapers} (promedio ${summary.avgDirtyDiapersPerDay}/día)`,
    `Sueño: ${formatMinutesReadable(summary.totalSleepMin)} (promedio ${formatMinutesReadable(summary.avgSleepMinPerDay)}/día)`,
  ];
}

export function buildPediatricianReportText(input: {
  readonly profile: ChildProfileSummary | null;
  readonly dailySummaryToday?: DailyLogSummary;
  readonly dailySummary3d: DailyLogSummary;
  readonly dailySummary7d?: DailyLogSummary;
  readonly dailySummary30d?: DailyLogSummary;
  readonly recentEvents?: readonly EventLogEntry[];
  readonly stageMilestonesSummary?: {
    readonly done: number;
    readonly total: number;
    readonly stageLabelMx?: string;
  };
  readonly health: HealthLogState;
  readonly generatedAtIso: string;
}): string {
  const {
    profile,
    dailySummaryToday,
    dailySummary3d,
    dailySummary7d,
    dailySummary30d,
    recentEvents,
    stageMilestonesSummary,
    health,
    generatedAtIso,
  } = input;

  const activeAlerts: string[] = [];
  const hydrationAlert =
    dailySummaryToday?.hydrationAlertMx ?? dailySummary3d.hydrationAlertMx;
  const stoolAlert = dailySummaryToday?.stoolAlertMx ?? dailySummary3d.stoolAlertMx;
  if (hydrationAlert) activeAlerts.push(hydrationAlert);
  if (stoolAlert) activeAlerts.push(stoolAlert);

  const eventLabelMap = new Map<string, string>(
    BABY_EVENT_OPTIONS_MX.map((option) => [option.id, option.labelMx]),
  );
  const eventsList = recentEvents ?? [];
  const eventCounts = new Map<string, number>();
  for (const ev of eventsList) {
    const label = eventLabelMap.get(ev.eventType) ?? ev.eventType;
    eventCounts.set(label, (eventCounts.get(label) ?? 0) + 1);
  }
  const eventSummaryLine = Array.from(eventCounts.entries())
    .map(([label, count]) => `${label} (${count})`)
    .join(' · ');

  const completedMilestonesCount = (health.completedMilestoneIds ?? []).length;

  const lines: string[] = [
    '=== REPORTE PARA PEDIATRA — BABY BUDDY MX ===',
    `Fecha de corte: ${generatedAtIso.slice(0, 10)}`,
    profile
      ? `Bebé: ${profile.nicknameMx} · Edad: ${formatChildAgeCompactMx(profile)} (${profile.stageId})`
      : 'Bebé: Sin perfil guardado',
    ...(dailySummaryToday
      ? ['', ...formatSummaryBlock('--- Hoy (Registro diario) ---', dailySummaryToday)]
      : []),
    '',
    ...formatSummaryBlock(
      '--- Últimos 3 días (Registro diario) ---',
      dailySummary3d,
    ),
    ...(dailySummary7d
      ? ['', ...formatSummaryBlock('--- Promedio últimos 7 días ---', dailySummary7d)]
      : []),
    ...(dailySummary30d
      ? [
          '',
          ...formatSummaryBlock(
            '--- Promedio mensual (últimos 30 días) ---',
            dailySummary30d,
          ),
        ]
      : []),
    ...(activeAlerts.length > 0
      ? [
          '',
          '--- Alertas activas del registro diario ---',
          ...activeAlerts.map((alert) => `• ${alert}`),
        ]
      : []),
    '',
    '--- Eventos recientes (reflujo, vómito, cólico, etc.) ---',
    ...(eventsList.length > 0
      ? [
          `Resumen: ${eventSummaryLine}`,
          ...eventsList.slice(0, 10).map((ev) => {
            const label = eventLabelMap.get(ev.eventType) ?? ev.eventType;
            return `• ${ev.timestampIso.slice(0, 16).replace('T', ' ')}: ${label}${ev.noteMx ? ` (${ev.noteMx})` : ''}`;
          }),
        ]
      : ['• Sin eventos registrados']),
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
              `• ${g.timestampIso.slice(0, 10)}${g.ageLabelMx ? ` (${g.ageLabelMx})` : ''}: ${g.weightKg !== undefined ? `${g.weightKg} kg` : '—'} · ${g.heightCm !== undefined ? `${g.heightCm} cm` : '—'}${g.headCircumferenceCm !== undefined ? ` · Cabeza / PC ${g.headCircumferenceCm} cm` : ''}`,
          )
      : ['• Sin registros de peso/talla']),
    '',
    `Vacunas Cartilla MX marcadas: ${health.completedVaccineIds.length} de ${MX_VACCINE_CHECKLIST.length}`,
    stageMilestonesSummary
      ? `Hitos del desarrollo marcados: ${stageMilestonesSummary.done} de ${stageMilestonesSummary.total}${stageMilestonesSummary.stageLabelMx ? ` en etapa ${stageMilestonesSummary.stageLabelMx}` : ''} (total acumulado: ${completedMilestonesCount})`
      : `Hitos del desarrollo marcados: ${completedMilestonesCount}`,
    '',
    'Nota: Registro informativo llevado por cuidadores; no sustituye valoración médica.',
  ];
  return lines.join('\n');
}
