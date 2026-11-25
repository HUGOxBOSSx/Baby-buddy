import type { StatusIconName, StatusSeverity } from '../theme/status';
import { getStageForAgeMonths } from './stages';

export type TriageLevel =
  | 'red_911'
  | 'orange_urgent'
  | 'yellow_pediatrician'
  | 'green_home';

export interface TriageLevelSpec {
  readonly level: TriageLevel;
  readonly severity: StatusSeverity;
  readonly iconName: StatusIconName;
  readonly labelMx: string;
  readonly timeframeMx: string;
  readonly actionSummaryMx: string;
  readonly paywallProtected: false;
}

export const TRIAGE_LEVEL_SPECS: Record<TriageLevel, TriageLevelSpec> = {
  red_911: {
    level: 'red_911',
    severity: 'urgent_red',
    iconName: 'alert-octagon',
    labelMx: 'Rojo — Atención inmediata (911)',
    timeframeMx: 'Ahora mismo',
    actionSummaryMx: 'Llama al 911 o acude de inmediato a urgencias.',
    paywallProtected: false,
  },
  orange_urgent: {
    level: 'orange_urgent',
    severity: 'urgent_red',
    iconName: 'alert-triangle',
    labelMx: 'Naranja — Urgencias hoy',
    timeframeMx: 'Hoy mismo',
    actionSummaryMx: 'Acude a valoración médica de urgencias el mismo día.',
    paywallProtected: false,
  },
  yellow_pediatrician: {
    level: 'yellow_pediatrician',
    severity: 'caution',
    iconName: 'alert-triangle',
    labelMx: 'Amarillo — Pediatra en 24–48 h',
    timeframeMx: '24 a 48 horas',
    actionSummaryMx:
      'Agenda consulta con tu pediatra y anota evolución y dudas.',
    paywallProtected: false,
  },
  green_home: {
    level: 'green_home',
    severity: 'normal',
    iconName: 'check-circle',
    labelMx: 'Verde — Cuidados en casa',
    timeframeMx: 'Observación tranquila',
    actionSummaryMx:
      'Puedes acompañarlo en casa y reevaluar si aparecen señales de alarma.',
    paywallProtected: false,
  },
};

export function normalizeSearchText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export interface TriageHardGateInput {
  readonly ageMonths: number;
  readonly tempC?: number;
  readonly severeBreathingDistress?: boolean;
  readonly blueLips?: boolean;
  readonly breathingPausesOver10s?: boolean;
  readonly seizure?: boolean;
  readonly unresponsive?: boolean;
  readonly noWetDiapers8h?: boolean;
}

export interface TriageEvaluationResult {
  readonly level: TriageLevel;
  readonly call911Immediately: boolean;
  readonly triggeredRulesMx: readonly string[];
  readonly nextStepMx: string;
}

export function evaluateTriageHardGates(
  input: TriageHardGateInput,
): TriageEvaluationResult {
  getStageForAgeMonths(input.ageMonths);

  const redRules: string[] = [];
  if (
    input.ageMonths < 3 &&
    input.tempC !== undefined &&
    input.tempC >= 38.0
  ) {
    redRules.push(
      'Temperatura >= 38.0 °C en menor de 3 meses: urgencia médica inmediata (911).',
    );
  }
  if (input.severeBreathingDistress) {
    redRules.push(
      'Dificultad respiratoria grave (hundimiento de costillas, aleteo nasal o quejido): llama al 911.',
    );
  }
  if (input.blueLips) {
    redRules.push(
      'Coloración azulada o morada en labios o cara: llama al 911 de inmediato.',
    );
  }
  if (input.breathingPausesOver10s) {
    redRules.push(
      'Pausas respiratorias mayores a 10 segundos: llama al 911.',
    );
  }
  if (input.seizure) {
    redRules.push(
      'Convulsión o movimientos anormales sostenidos: llama al 911.',
    );
  }
  if (input.unresponsive) {
    redRules.push(
      'Dificultad para despertar o falta de respuesta: llama al 911.',
    );
  }

  if (redRules.length > 0) {
    return {
      level: 'red_911',
      call911Immediately: true,
      triggeredRulesMx: redRules,
      nextStepMx: TRIAGE_LEVEL_SPECS.red_911.actionSummaryMx,
    };
  }

  const orangeRules: string[] = [];
  if (input.noWetDiapers8h) {
    orangeRules.push(
      'Más de 8 horas sin mojar pañal: acude a urgencias hoy para descartar deshidratación.',
    );
  }
  if (
    input.ageMonths >= 3 &&
    input.tempC !== undefined &&
    input.tempC >= 40.0
  ) {
    orangeRules.push(
      'Temperatura >= 40.0 °C: acude a valoración médica de urgencias hoy.',
    );
  }
  if (orangeRules.length > 0) {
    return {
      level: 'orange_urgent',
      call911Immediately: false,
      triggeredRulesMx: orangeRules,
      nextStepMx: TRIAGE_LEVEL_SPECS.orange_urgent.actionSummaryMx,
    };
  }

  if (
    input.ageMonths >= 3 &&
    input.tempC !== undefined &&
    input.tempC >= 38.0
  ) {
    return {
      level: 'yellow_pediatrician',
      call911Immediately: false,
      triggeredRulesMx: [
        'Fiebre >= 38.0 °C en mayores de 3 meses: vigila estado general y consulta con tu pediatra en 24–48 h (o antes si hay decaimiento).',
      ],
      nextStepMx: TRIAGE_LEVEL_SPECS.yellow_pediatrician.actionSummaryMx,
    };
  }

  return {
    level: 'green_home',
    call911Immediately: false,
    triggeredRulesMx: [],
    nextStepMx: TRIAGE_LEVEL_SPECS.green_home.actionSummaryMx,
  };
}
