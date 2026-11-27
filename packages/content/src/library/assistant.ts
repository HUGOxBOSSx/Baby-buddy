import {
  normalizeSearchText,
  type StageId,
  type TriageLevel,
} from '@baby-buddy/core';
import { getClinicalGuideBySlug, searchClinicalGuides } from './search';

export interface EditorialAssistantCitation {
  readonly slug: string;
  readonly titleMx: string;
  readonly reviewedAt: string;
  readonly sourcesSummaryMx: string;
}

export interface EditorialAssistantReply {
  readonly triageLevel: TriageLevel;
  readonly isEmergency911: boolean;
  readonly headlineMx: string;
  readonly answerMx: string;
  readonly actionStepsMx: readonly string[];
  readonly citations: readonly EditorialAssistantCitation[];
  readonly disclaimerMx: string;
}

const RED_FLAG_KEYWORDS = [
  'no respira',
  'dificultad para respirar',
  'le cuesta respirar',
  'labios morados',
  'morado',
  'morada',
  'convulsion',
  'convulsiones',
  'no despierta',
  'desmayo',
  'atragant',
  'ahog',
  'sangre',
  'quemadura',
] as const;

const FEVER_KEYWORDS = ['fiebre', 'calentura', '38', '39', '40'] as const;

function toCitation(guide: NonNullable<ReturnType<typeof getClinicalGuideBySlug>>): EditorialAssistantCitation {
  return {
    slug: guide.slug,
    titleMx: guide.titleMx,
    reviewedAt: guide.metadata.reviewed_at,
    sourcesSummaryMx: guide.metadata.sources
      .map((s) => `${s.organization} (${s.year})`)
      .join(', '),
  };
}

export function askEditorialAssistantMx(input: {
  readonly queryMx: string;
  readonly ageMonths: number;
  readonly stageId: StageId;
}): EditorialAssistantReply {
  const { queryMx, ageMonths, stageId } = input;
  const norm = normalizeSearchText(queryMx);

  if (!norm) {
    return {
      triageLevel: 'green_home',
      isEmergency911: false,
      headlineMx: 'Escribe tu duda para consultar el corpus editorial',
      answerMx:
        'Puedo responder únicamente con base en las guías verificadas de Baby Buddy MX (síntomas, cuidados y señales de alarma).',
      actionStepsMx: [],
      citations: [],
      disclaimerMx:
        'Orientación educativa en borrador editorial. No sustituye la valoración de tu pediatra.',
    };
  }

  const hasRedFlag = RED_FLAG_KEYWORDS.some((kw) => norm.includes(kw));
  const hasFever = FEVER_KEYWORDS.some((kw) => norm.includes(kw));

  if (hasRedFlag || (ageMonths < 3 && hasFever)) {
    const emergencySlugs = [
      'labios-morados-cianosis',
      'pausas-respiratorias-apnea',
      'fiebre-menor-3-meses-911',
    ];
    const emergencyCitations = emergencySlugs
      .map((s) => getClinicalGuideBySlug(s))
      .filter((g): g is NonNullable<typeof g> => g !== undefined)
      .map(toCitation);

    return {
      triageLevel: 'red_911',
      isEmergency911: true,
      headlineMx: 'Prioridad de urgencia: llama al 911 o acude a urgencias',
      answerMx:
        ageMonths < 3 && hasFever
          ? 'En bebés menores de 3 meses, cualquier temperatura de 38.0 °C o más requiere valoración médica urgente inmediata.'
          : 'Tu consulta menciona posibles señales de alarma. No esperes: comunícate al 911 o acude de inmediato al hospital más cercano.',
      actionStepsMx: [
        'Llama al 911 (acceso gratuito) o acude a urgencias sin demora.',
        'Ten a la mano la edad del bebé y los síntomas observados.',
      ],
      citations: emergencyCitations,
      disclaimerMx:
        'Ante señales de alarma, la atención médica urgente tiene prioridad absoluta.',
    };
  }

  let matches = searchClinicalGuides({ query: queryMx, stageId });
  if (matches.length === 0) {
    matches = searchClinicalGuides({ query: queryMx });
  }

  if (matches.length === 0) {
    return {
      triageLevel: 'yellow_pediatrician',
      isEmergency911: false,
      headlineMx: 'Sin coincidencia directa en las guías verificadas',
      answerMx:
        'No encontré una guía específica para esa consulta dentro del corpus editorial actual. Te recomiendo comentarlo directamente con tu pediatra.',
      actionStepsMx: [
        'Prueba buscar con una palabra clave corta (ej. fiebre, hipo, cólicos, popó).',
        'Si notas decaimiento marcado, dificultad para respirar o fiebre alta, llama al 911.',
      ],
      citations: [],
      disclaimerMx:
        'Este asistente no inventa respuestas fuera del corpus editorial; no sustituye la valoración de tu pediatra.',
    };
  }

  const primary = matches[0]!;
  return {
    triageLevel: primary.triageLevel,
    isEmergency911: primary.triageLevel === 'red_911',
    headlineMx: primary.titleMx,
    answerMx: `${primary.quickAnswerMx} ${primary.summaryMx}`,
    actionStepsMx: primary.doStepsMx.slice(0, 2),
    citations: matches.slice(0, 3).map(toCitation),
    disclaimerMx:
      'Basado únicamente en guías educativas de Baby Buddy MX. No sustituye la valoración de tu pediatra.',
  };
}
