import {
  normalizeSearchText,
  type StageId,
  type TriageLevel,
} from '@baby-buddy/core';
import type {
  ClinicalGuideEntry,
  ClinicalGuideLink,
  ClinicalGuideLinkTone,
  GuideKind,
} from '../schema';
import { IS_NORMAL_GUIDES } from './isNormal';
import { PROBLEM_SOLUTIONS_GUIDES } from './problems';

export type NormalityFilter =
  | 'all'
  | 'es_normal'
  | 'no_es_normal'
  | 'urgencia'
  | 'primeros_auxilios';

export const ALL_CLINICAL_GUIDES: readonly ClinicalGuideEntry[] = [
  ...IS_NORMAL_GUIDES,
  ...PROBLEM_SOLUTIONS_GUIDES,
] as const;

export const GUIDE_CATEGORIES_MX: readonly string[] = Array.from(
  new Set(ALL_CLINICAL_GUIDES.map((g) => g.categoryMx)),
).sort((a, b) => a.localeCompare(b, 'es-MX'));

export function isGuideNormal(guide: ClinicalGuideEntry): boolean {
  return guide.triageLevel === 'green_home';
}

export function getClinicalGuideBySlug(
  slug: string,
): ClinicalGuideEntry | undefined {
  return ALL_CLINICAL_GUIDES.find((g) => g.slug === slug);
}

export interface GuideSearchOptions {
  readonly query?: string;
  readonly stageId?: StageId | 'all';
  readonly kind?: GuideKind | 'all';
  readonly normality?: NormalityFilter;
  readonly triageLevel?: TriageLevel | 'all';
  readonly categoryMx?: string | 'all';
}

export function searchClinicalGuides(
  options: GuideSearchOptions = {},
): readonly ClinicalGuideEntry[] {
  const {
    query = '',
    stageId = 'all',
    kind = 'all',
    normality = 'all',
    triageLevel = 'all',
    categoryMx = 'all',
  } = options;
  const normalizedQuery = normalizeSearchText(query);

  return ALL_CLINICAL_GUIDES.filter((guide) => {
    if (stageId !== 'all' && !guide.stages.includes(stageId)) {
      return false;
    }
    if (kind !== 'all' && guide.kind !== kind) {
      return false;
    }
    if (normality === 'es_normal') {
      if (guide.triageLevel !== 'green_home') {
        return false;
      }
    } else if (normality === 'no_es_normal') {
      if (guide.triageLevel !== 'yellow_pediatrician') {
        return false;
      }
    } else if (normality === 'urgencia') {
      if (
        guide.triageLevel !== 'red_911' &&
        guide.triageLevel !== 'orange_urgent'
      ) {
        return false;
      }
    } else if (normality === 'primeros_auxilios') {
      if (guide.kind !== 'primeros_auxilios') {
        return false;
      }
    }
    if (triageLevel !== 'all' && guide.triageLevel !== triageLevel) {
      return false;
    }
    if (categoryMx !== 'all' && guide.categoryMx !== categoryMx) {
      return false;
    }
    if (!normalizedQuery) {
      return true;
    }
    const haystack = normalizeSearchText(
      [
        guide.titleMx,
        guide.quickAnswerMx,
        guide.summaryMx,
        guide.categoryMx,
        ...guide.keywords,
      ].join(' '),
    );
    return normalizedQuery
      .split(/\s+/)
      .filter(Boolean)
      .every((term) => haystack.includes(term));
  });
}

export const RELATED_GUIDE_SLUGS: Readonly<Record<string, readonly string[]>> = {
  'regurgitacion-y-reflujo': ['vomito-en-proyectil-o-reflujo-con-alerta'],
  'vomito-en-proyectil-o-reflujo-con-alerta': ['regurgitacion-y-reflujo'],
  'ictericia-leve': ['ictericia-intensa-o-prolongada'],
  'ictericia-intensa-o-prolongada': ['ictericia-leve'],
  'cordon-umbilical': ['infeccion-cordon-umbilical'],
  'infeccion-cordon-umbilical': ['cordon-umbilical'],
  'perdida-peso-inicial': ['baja-ganancia-peso-rechazo-tomas'],
  'alimentacion-en-racimo': ['baja-ganancia-peso-rechazo-tomas', 'dolor-agarre-lactancia'],
  'baja-ganancia-peso-rechazo-tomas': ['perdida-peso-inicial', 'sin-mojar-panal-deshidratacion'],
  'dolor-agarre-lactancia': ['alimentacion-en-racimo'],
  'mastitis-seno-rojo-fiebre': ['alimentacion-en-racimo'],
  'respiracion-periodica': ['pausas-respiratorias-apnea', 'dificultad-respiratoria-grave-reposo'],
  'pausas-respiratorias-apnea': ['respiracion-periodica'],
  'pujidos-ruidos-al-dormir': ['dificultad-respiratoria-grave-reposo', 'estrenimiento-bebe-nino'],
  'estrenimiento-bebe-nino': ['pujidos-ruidos-al-dormir'],
  'estornudos-recien-nacido': ['dificultad-respiratoria-grave-reposo'],
  'congestion-nasal-lavado': ['resfriado-y-tos', 'dificultad-respiratoria-grave-reposo'],
  'resfriado-y-tos': ['congestion-nasal-lavado', 'dificultad-respiratoria-grave-reposo'],
  'dificultad-respiratoria-grave-reposo': ['respiracion-periodica', 'pujidos-ruidos-al-dormir', 'congestion-nasal-lavado'],
  'acne-neonatal-milia': ['dermatitis-atopica-resequedad', 'sarpullido-con-fiebre-o-manchas-no-blanquean'],
  'descamacion-piel-recien-nacido': ['dermatitis-atopica-resequedad'],
  'costra-lactea': ['dermatitis-atopica-resequedad'],
  'rozadura-de-panal': ['dermatitis-atopica-resequedad', 'sarpullido-con-fiebre-o-manchas-no-blanquean'],
  'dermatitis-atopica-resequedad': ['acne-neonatal-milia', 'rozadura-de-panal', 'sarpullido-con-fiebre-o-manchas-no-blanquean'],
  'sarpullido-con-fiebre-o-manchas-no-blanquean': ['acne-neonatal-milia', 'rozadura-de-panal'],
  'hora-bruja-llanto-vespertino': ['bebe-no-despierta-no-responde'],
  'bebe-no-despierta-no-responde': ['hora-bruja-llanto-vespertino'],
  'arcada-vs-atragantamiento-blw': ['primeros-auxilios-atragantamiento'],
  'primeros-auxilios-atragantamiento': ['arcada-vs-atragantamiento-blw'],
  'diarrea-y-deshidratacion': ['sin-mojar-panal-deshidratacion'],
  'sin-mojar-panal-deshidratacion': ['diarrea-y-deshidratacion', 'baja-ganancia-peso-rechazo-tomas'],
  'fiebre-mayores-3-meses': ['primeros-auxilios-convulsion-febril'],
  'primeros-auxilios-convulsion-febril': ['fiebre-mayores-3-meses'],
};

function getLinkMeta(level: TriageLevel): {
  readonly tone: ClinicalGuideLinkTone;
  readonly prefixMx: string;
} {
  switch (level) {
    case 'green_home':
      return { tone: 'normal_green', prefixMx: '¿Cuándo SÍ es normal?' };
    case 'yellow_pediatrician':
      return { tone: 'not_normal_yellow', prefixMx: '¿Cuándo NO es normal?' };
    case 'orange_urgent':
      return { tone: 'urgent_red', prefixMx: '¿Cuándo requiere atención hoy?' };
    case 'red_911':
      return { tone: 'urgent_red', prefixMx: '¿Cuándo es urgencia (911)?' };
  }
}

export function getRelatedGuideLinks(
  slug: string,
  stageId?: StageId | 'all',
): readonly ClinicalGuideLink[] {
  const source = getClinicalGuideBySlug(slug);
  const targets = RELATED_GUIDE_SLUGS[slug] ?? [];
  const links: ClinicalGuideLink[] = [];
  for (const targetSlug of targets) {
    const target = getClinicalGuideBySlug(targetSlug);
    if (!target || target.slug === slug) continue;
    if (source && target.triageLevel === source.triageLevel) continue;
    if (stageId && stageId !== 'all' && !target.stages.includes(stageId)) {
      continue;
    }
    const { tone, prefixMx } = getLinkMeta(target.triageLevel);
    links.push({
      slug: target.slug,
      prefixMx,
      titleMx: target.titleMx,
      tone,
    });
  }
  return links;
}
