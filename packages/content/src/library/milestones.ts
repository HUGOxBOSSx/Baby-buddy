import type { StageId } from '@baby-buddy/core';
import { createClinicalMetadata, M1_CLINICAL_SOURCES } from '../disclaimers';
import type { DevelopmentMilestoneEntry, MilestoneDomain } from '../schema';

const meta = () =>
  createClinicalMetadata({
    sources: [M1_CLINICAL_SOURCES.whoChildCare, M1_CLINICAL_SOURCES.nom031],
  });

function milestone(
  id: string,
  stage: StageId,
  ageLabelMx: string,
  domain: MilestoneDomain,
  titleMx: string,
  activityMx: string,
  watchForMx: string,
): DevelopmentMilestoneEntry {
  return {
    id,
    stage,
    ageLabelMx,
    domain,
    titleMx,
    activityMx,
    watchForMx,
    metadata: meta(),
  };
}

export const MILESTONE_DOMAIN_LABELS_MX: Record<MilestoneDomain, string> = {
  motor: 'Motor',
  lenguaje: 'Lenguaje',
  socioemocional: 'Socioemocional',
  cognitivo: 'Cognitivo',
};

export const DEVELOPMENT_MILESTONES: readonly DevelopmentMilestoneEntry[] = [
  // 0-3m
  milestone(
    'm0-motor-cabeza',
    '0-3m',
    '1–3 meses',
    'motor',
    'Sostiene brevemente la cabeza boca abajo',
    'Ofrécele ratos cortos boca abajo sobre superficie firme mientras está despierto y supervisado.',
    'Comenta con tu pediatra si notas rigidez constante o flacidez marcada.',
  ),
  milestone(
    'm0-lenguaje-gorjeo',
    '0-3m',
    '2–3 meses',
    'lenguaje',
    'Emite arrullos y reacciona a tu voz',
    'Háblale despacio cara a cara y haz pausas para darle turno de responder.',
    'Comenta con tu pediatra si no reacciona a sonidos fuertes.',
  ),
  milestone(
    'm0-social-sonrisa',
    '0-3m',
    '6–10 semanas',
    'socioemocional',
    'Sonrisa social al verte',
    'Sonríe y responde con gestos suaves cuando busca tu mirada.',
    'Comenta en consulta si hacia los 3 meses aún no sigue rostros cercanos.',
  ),
  milestone(
    'm0-cognitivo-sigue',
    '0-3m',
    '2–3 meses',
    'cognitivo',
    'Sigue objetos con la mirada',
    'Mueve lentamente un juguete de contraste a unos 25 cm de sus ojos.',
    'Consulta si notas desviación ocular persistente o falta de enfoque.',
  ),

  // 3-12m
  milestone(
    'm3-motor-sienta',
    '3-12m',
    '6–8 meses',
    'motor',
    'Se voltea y comienza a sentarse con apoyo',
    'Coloca juguetes al alcance a los lados para motivar el giro y el equilibrio.',
    'Comenta con tu pediatra si a los 9 meses no logra mantenerse sentado con apoyo.',
  ),
  milestone(
    'm3-lenguaje-balbuceo',
    '3-12m',
    '6–9 meses',
    'lenguaje',
    'Balbucea sílabas ("ba", "ma", "pa")',
    'Repite sus sonidos con alegría y nombra objetos cotidianos.',
    'Comenta en consulta si deja de emitir sonidos o no responde a su nombre a los 9 meses.',
  ),
  milestone(
    'm3-social-apego',
    '3-12m',
    '7–10 meses',
    'socioemocional',
    'Distingue familiares y juega a aparecer/esconderse',
    'Jueguen al "aquí está" cubriendo tu rostro con las manos o una tela ligera.',
    'Acompaña con calma si muestra cautela ante desconocidos; es esperado.',
  ),
  milestone(
    'm3-cognitivo-pinza',
    '3-12m',
    '8–11 meses',
    'cognitivo',
    'Toma objetos pequeños con índice y pulgar',
    'Ofrécele trozos blandos y seguros bajo supervisión para practicar la pinza.',
    'Evita objetos pequeños que representen riesgo de atragantamiento.',
  ),

  // 1-3a
  milestone(
    'm1-motor-camina',
    '1-3a',
    '12–18 meses',
    'motor',
    'Camina sin apoyo y explora escalones bajos',
    'Permite que camine descalzo en casa sobre superficies seguras.',
    'Comenta con tu pediatra si a los 18 meses aún no camina de forma independiente.',
  ),
  milestone(
    'm1-lenguaje-frases',
    '1-3a',
    '18–24 meses',
    'lenguaje',
    'Usa palabras sueltas y une 2 palabras',
    'Lee cuentos ilustrados cortos todos los días y señala dibujos.',
    'Comenta en consulta si a los 2 años no usa al menos palabras sencillas para pedir.',
  ),
  milestone(
    'm1-social-imita',
    '1-3a',
    '15–24 meses',
    'socioemocional',
    'Imita tareas cotidianas y expresa emociones',
    'Invítale a guardar juguetes contigo o dar de comer a un muñeco.',
    'Acompaña los berrinches validando emociones con límites claros y tranquilos.',
  ),
  milestone(
    'm1-cognitivo-ordena',
    '1-3a',
    '18–30 meses',
    'cognitivo',
    'Clasifica por forma o color y sigue 2 pasos',
    'Pídele acciones simples ("toma la pelota y dámela") durante el juego.',
    'Comenta si pierde habilidades que ya había adquirido.',
  ),

  // 3-6a
  milestone(
    'm3a-motor-salta',
    '3-6a',
    '3–4 años',
    'motor',
    'Salta con ambos pies y pedalea triciclo',
    'Jueguen en el parque a saltar líneas o lanzar y atrapar pelota blanda.',
    'Comenta con tu pediatra si tropieza con frecuencia inusual o evita moverse.',
  ),
  milestone(
    'm3a-lenguaje-relata',
    '3-6a',
    '3–5 años',
    'lenguaje',
    'Forma oraciones completas y cuenta su día',
    'Haz preguntas abiertas sobre sus dibujos o lo que más disfrutó hoy.',
    'Comenta en consulta si personas fuera de casa no comprenden lo que dice a los 4 años.',
  ),
  milestone(
    'm3a-social-turnos',
    '3-6a',
    '3–5 años',
    'socioemocional',
    'Comparte turnos y juega en grupo',
    'Practiquen juegos de mesa sencillos o roles cooperativos en casa.',
    'Fomenta rutinas predecibles de sueño y juego sin pantallas excesivas.',
  ),
  milestone(
    'm3a-cognitivo-curioso',
    '3-6a',
    '4–6 años',
    'cognitivo',
    'Pregunta "por qué" y reconoce letras o números',
    'Responde con ejemplos sencillos y cuenten objetos cotidianos juntos.',
    'Acompaña su curiosidad respetando su ritmo propio de aprendizaje.',
  ),
] as const;

export function getMilestonesForStage(
  stage: StageId,
): readonly DevelopmentMilestoneEntry[] {
  return DEVELOPMENT_MILESTONES.filter((m) => m.stage === stage);
}
