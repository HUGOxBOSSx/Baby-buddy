import type { StatusSeverity } from '../theme/status';
import type { StageId } from './stages';

export const CLOTHING_MIN_TEMP_C = -5;
export const CLOTHING_MAX_TEMP_C = 50;

export type ClothingEnvironment = 'cuarto' | 'exterior';
export type TogRating = 'sin_saco' | '0.2' | '0.5' | '1.0' | '2.5' | '3.5';
export type ThermalBand =
  | 'frio_extremo'
  | 'frio'
  | 'ideal'
  | 'calido'
  | 'calor_alto'
  | 'calor_extremo';

export type ComfortZone = 'cold' | 'optimal' | 'overheat' | 'unsafe_sleep';

export type BaseLayerId =
  | 'ninguna'
  | 'panalero_sin_mangas'
  | 'panalero_corta'
  | 'panalero_larga'
  | 'termica_interior';

export type MidLayerId =
  | 'ninguna'
  | 'pijama_ligera'
  | 'mameluco_algodon'
  | 'mameluco_afelpado'
  | 'mameluco_termico'
  | 'sueter_chamarra';

export type OuterLayerId =
  | 'ninguna'
  | 'manta_delgada_envuelta'
  | 'cobija_algodon_envuelta'
  | 'cobija_polar'
  | 'saco_05'
  | 'saco_10'
  | 'saco_25'
  | 'saco_35'
  | 'cobija_suelta';

export type GarmentVisualKind =
  | 'none'
  | 'sleeveless_bodysuit'
  | 'short_bodysuit'
  | 'long_bodysuit'
  | 'thermal_base'
  | 'light_pajama'
  | 'cotton_sleeper'
  | 'fleece_sleeper'
  | 'thermal_sleeper'
  | 'sweater'
  | 'swaddle_thin'
  | 'swaddle_cotton'
  | 'fleece_blanket'
  | 'sleep_sack'
  | 'loose_blanket';

export interface LayerOption<T extends string> {
  readonly id: T;
  readonly labelMx: string;
  readonly tog: number | null;
  readonly visualKind: GarmentVisualKind;
}

export const BASE_LAYER_OPTIONS: readonly LayerOption<BaseLayerId>[] = [
  { id: 'ninguna', labelMx: 'Solo pañal', tog: 0, visualKind: 'none' },
  {
    id: 'panalero_sin_mangas',
    labelMx: 'Pañalero sin mangas',
    tog: 0.1,
    visualKind: 'sleeveless_bodysuit',
  },
  {
    id: 'panalero_corta',
    labelMx: 'Pañalero manga corta',
    tog: 0.2,
    visualKind: 'short_bodysuit',
  },
  {
    id: 'panalero_larga',
    labelMx: 'Pañalero manga larga',
    tog: 0.35,
    visualKind: 'long_bodysuit',
  },
  {
    id: 'termica_interior',
    labelMx: 'Camiseta térmica',
    tog: 0.6,
    visualKind: 'thermal_base',
  },
] as const;

export const MID_LAYER_OPTIONS: readonly LayerOption<MidLayerId>[] = [
  { id: 'ninguna', labelMx: 'Sin capa media', tog: 0, visualKind: 'none' },
  {
    id: 'pijama_ligera',
    labelMx: 'Pijama ligera',
    tog: 0.4,
    visualKind: 'light_pajama',
  },
  {
    id: 'mameluco_algodon',
    labelMx: 'Mameluco de algodón',
    tog: 0.5,
    visualKind: 'cotton_sleeper',
  },
  {
    id: 'mameluco_afelpado',
    labelMx: 'Mameluco afelpado',
    tog: 0.8,
    visualKind: 'fleece_sleeper',
  },
  {
    id: 'mameluco_termico',
    labelMx: 'Mameluco térmico',
    tog: 1.2,
    visualKind: 'thermal_sleeper',
  },
  {
    id: 'sueter_chamarra',
    labelMx: 'Suéter / chamarra',
    tog: 1.0,
    visualKind: 'sweater',
  },
] as const;

export const OUTER_LAYER_OPTIONS: readonly LayerOption<OuterLayerId>[] = [
  { id: 'ninguna', labelMx: 'Sin cobija ni saco', tog: 0, visualKind: 'none' },
  {
    id: 'manta_delgada_envuelta',
    labelMx: 'Manta delgada envuelta (taquito)',
    tog: 0.5,
    visualKind: 'swaddle_thin',
  },
  {
    id: 'cobija_algodon_envuelta',
    labelMx: 'Cobija de algodón envuelta',
    tog: 1.0,
    visualKind: 'swaddle_cotton',
  },
  {
    id: 'cobija_polar',
    labelMx: 'Cobija polar',
    tog: 2.0,
    visualKind: 'fleece_blanket',
  },
  {
    id: 'saco_05',
    labelMx: 'Saco 0.5 TOG',
    tog: 0.5,
    visualKind: 'sleep_sack',
  },
  {
    id: 'saco_10',
    labelMx: 'Saco 1.0 TOG',
    tog: 1.0,
    visualKind: 'sleep_sack',
  },
  {
    id: 'saco_25',
    labelMx: 'Saco 2.5 TOG',
    tog: 2.5,
    visualKind: 'sleep_sack',
  },
  {
    id: 'saco_35',
    labelMx: 'Saco 3.5 TOG',
    tog: 3.5,
    visualKind: 'sleep_sack',
  },
  {
    id: 'cobija_suelta',
    labelMx: 'Cobija suelta',
    tog: 1.5,
    visualKind: 'loose_blanket',
  },
] as const;

export interface SelectedLayersInput {
  readonly base: BaseLayerId;
  readonly mid: MidLayerId;
  readonly outer: OuterLayerId;
}

export interface ClothingContextFlags {
  readonly prematureOrLowWeight: boolean;
  readonly hasFever: boolean;
  readonly hasAcOrFan: boolean;
  readonly inCarrierOrStroller: boolean;
  readonly inCarSeat: boolean;
  readonly canRollOver: boolean;
  readonly coldWalls: boolean;
}

export const DEFAULT_CLOTHING_CONTEXT: ClothingContextFlags = {
  prematureOrLowWeight: false,
  hasFever: false,
  hasAcOrFan: false,
  inCarrierOrStroller: false,
  inCarSeat: false,
  canRollOver: false,
  coldWalls: false,
};

export interface ClothingRecommendationInput {
  readonly tempC: number;
  readonly environment: ClothingEnvironment;
  readonly stageId: StageId;
  readonly context?: Partial<ClothingContextFlags>;
  readonly selectedLayers?: SelectedLayersInput;
}

export interface TogRange {
  readonly min: number;
  readonly max: number;
}

export interface ClothingRecommendation {
  readonly tempC: number;
  readonly effectiveTempC: number;
  readonly environment: ClothingEnvironment;
  readonly stageId: StageId;
  readonly band: ThermalBand;
  readonly severity: StatusSeverity;
  readonly emergency911Visible: boolean;
  readonly tog: TogRating;
  readonly recommendedTogRange: TogRange;
  readonly currentTog: number | null;
  readonly comfortZone: ComfortZone;
  readonly looseBlanketAlert: boolean;
  readonly togDeltaMx: string;
  readonly headlineMx: string;
  readonly layersMx: readonly string[];
  readonly actionsMx: readonly string[];
  readonly doNotDoMx: readonly string[];
  readonly touchCheckMx: string;
}

function getRecommendedTogRange(
  effectiveTempC: number,
  ctx: ClothingContextFlags,
): TogRange {
  let min = 1.0;
  let max = 1.9;
  if (effectiveTempC >= 28) {
    min = 0;
    max = 0.2;
  } else if (effectiveTempC >= 24) {
    min = 0.2;
    max = 0.7;
  } else if (effectiveTempC >= 20) {
    min = 1.0;
    max = 1.9;
  } else if (effectiveTempC >= 18) {
    min = 1.8;
    max = 2.8;
  } else if (effectiveTempC >= 14) {
    min = 2.5;
    max = 3.8;
  } else {
    min = 3.5;
    max = 4.5;
  }

  if (ctx.hasFever) {
    min = Math.max(0, Number((min - 0.5).toFixed(2)));
    max = Math.max(0.2, Number((max - 0.5).toFixed(2)));
  }
  if (ctx.prematureOrLowWeight) {
    min = Number((min + 0.3).toFixed(2));
    max = Number((max + 0.3).toFixed(2));
  }
  return { min, max };
}

function computeCurrentTog(
  layers: SelectedLayersInput | undefined,
  isUnder12m: boolean,
): number | null {
  if (!layers) {
    return null;
  }
  if (isUnder12m && (layers.outer === 'cobija_suelta' || layers.outer === 'cobija_polar')) {
    return null;
  }
  const baseTog =
    BASE_LAYER_OPTIONS.find((o) => o.id === layers.base)?.tog ?? 0;
  const midTog = MID_LAYER_OPTIONS.find((o) => o.id === layers.mid)?.tog ?? 0;
  const outerTog =
    OUTER_LAYER_OPTIONS.find((o) => o.id === layers.outer)?.tog ?? 0;
  return Number((baseTog + midTog + outerTog).toFixed(2));
}

export function recommendClothing(
  input: ClothingRecommendationInput,
): ClothingRecommendation {
  const { tempC, environment, stageId } = input;
  if (
    !Number.isFinite(tempC) ||
    tempC < CLOTHING_MIN_TEMP_C ||
    tempC > CLOTHING_MAX_TEMP_C
  ) {
    throw new RangeError(
      `La temperatura debe estar entre ${CLOTHING_MIN_TEMP_C} °C y ${CLOTHING_MAX_TEMP_C} °C.`,
    );
  }

  const ctx: ClothingContextFlags = {
    ...DEFAULT_CLOTHING_CONTEXT,
    ...input.context,
  };

  const effectiveTempC =
    environment === 'cuarto' && ctx.coldWalls
      ? Math.max(CLOTHING_MIN_TEMP_C, Number((tempC - 1.5).toFixed(1)))
      : tempC;

  const isUnder12m = stageId === '0-3m' || stageId === '3-12m';

  let band: ThermalBand;
  let severity: StatusSeverity = 'normal';
  let emergency911Visible = false;
  let tog: TogRating = 'sin_saco';
  let headlineMx = '';
  const layersMx: string[] = [];
  const actionsMx: string[] = [];
  const doNotDoMx: string[] = [];

  if (effectiveTempC >= 35) {
    band = 'calor_extremo';
    severity = 'urgent_red';
    emergency911Visible = true;
    tog = 'sin_saco';
    headlineMx =
      'Alerta de calor extremo: prioridad bajar la temperatura del entorno';
    if (environment === 'cuarto') {
      layersMx.push('Solo pañal (o sin ropa bajo supervisión directa)');
      actionsMx.push(
        'Enciende el clima o aire acondicionado (22 °C a 24 °C sin chorro directo) o usa ventilador indirecto.',
        'Refresca con paños frescos o tibios en frente, cuello e ingles.',
        stageId === '0-3m'
          ? 'Ofrece pecho o mamila con mayor frecuencia a libre demanda.'
          : 'Ofrece pecho o mamila a libre demanda (y agua natural en ml a partir de los 6 meses).',
      );
      doNotDoMx.push(
        'Nunca uses agua helada, hielo directo ni alcohol sobre la piel.',
        'Nunca dejes al bebé en un cuarto cerrado sin ventilación.',
      );
    } else {
      layersMx.push('Solo pañal o prenda ultrafina de algodón muy holgada');
      actionsMx.push(
        'Evita salir, especialmente entre las 11:00 y las 16:00 horas.',
        'Mantén sombra total y ofrece hidratación frecuente.',
      );
      doNotDoMx.push(
        'Nunca cubras la carriola con mantas o pañales (genera efecto horno).',
        'Nunca dejes al bebé dentro del auto ni un minuto: revisa siempre el asiento trasero.',
      );
    }
  } else if (effectiveTempC >= 28) {
    band = 'calor_alto';
    severity = 'caution';
    tog = ctx.hasAcOrFan && environment === 'cuarto' ? '0.2' : 'sin_saco';
    headlineMx = 'Calor alto: vigila signos de sobrecalentamiento';
    if (environment === 'cuarto') {
      layersMx.push('Solo pañal o pañalero sin mangas de algodón ligero');
      actionsMx.push(
        'Ventila la habitación o usa clima/ventilador sin flujo directo.',
      );
      doNotDoMx.push('No uses saco grueso, cobija polar ni gorro para dormir.');
    } else {
      layersMx.push(
        'Pañalero o playera ligera de algodón + sombrero de ala ancha',
      );
      actionsMx.push(
        'Permanece en sombra.',
        stageId === '0-3m'
          ? 'En menores de 6 meses evita el sol directo y no apliques protector solar.'
          : 'A partir de los 6 meses puedes complementar con protector solar mineral.',
      );
    }
  } else if (effectiveTempC >= 24) {
    band = 'calido';
    severity = 'normal';
    tog =
      environment === 'cuarto'
        ? effectiveTempC >= 26
          ? '0.2'
          : '0.5'
        : 'sin_saco';
    headlineMx = 'Ambiente cálido: una capa ligera es suficiente';
    if (environment === 'cuarto') {
      layersMx.push('Pañalero manga corta de algodón');
      layersMx.push(
        `Saco ligero ${tog} TOG (o sin saco: pijama ligera; en 0–3m que no voltea, manta delgada envuelta)`,
      );
    } else {
      layersMx.push('Pañalero manga corta o playera ligera de algodón');
    }
  } else if (effectiveTempC >= 18) {
    band = 'ideal';
    severity = 'normal';
    headlineMx = 'Temperatura confortable';
    if (environment === 'cuarto') {
      if (effectiveTempC >= 20) {
        tog = '1.0';
        layersMx.push('Pañalero manga larga + mameluco ligero de algodón');
        layersMx.push(
          'Saco 1.0 TOG (o sin saco: mameluco afelpado; en 0–3m que no voltea, cobija de algodón bien envuelta)',
        );
      } else {
        tog = '2.5';
        layersMx.push(
          'Pañalero manga larga + mameluco de algodón + calcetines',
        );
        layersMx.push(
          'Saco 2.5 TOG (o sin saco: mameluco afelpado/térmico + calcetines; en ≥12m cobija ligera bien ajustada)',
        );
      }
    } else {
      tog = 'sin_saco';
      layersMx.push(
        'Capa base de algodón + prenda ligera o suéter delgado según viento',
      );
    }
  } else if (effectiveTempC >= 14) {
    band = 'frio';
    severity =
      environment === 'cuarto' && effectiveTempC < 16 ? 'caution' : 'normal';
    headlineMx =
      environment === 'cuarto' && effectiveTempC < 16
        ? 'Habitación fresca: considera templar el cuarto de forma segura'
        : 'Ambiente fresco: viste por capas';
    if (environment === 'cuarto') {
      tog = effectiveTempC >= 16 ? '2.5' : '3.5';
      layersMx.push('Pañalero manga larga + mameluco afelpado o térmico');
      layersMx.push(
        `Saco ${tog} TOG (o sin saco: camiseta térmica + mameluco térmico + calcetines; en ≥12m cobija polar)`,
      );
      if (effectiveTempC < 16) {
        actionsMx.push(
          'Templa la habitación de forma segura (objetivo 18 °C a 22 °C).',
        );
      }
    } else {
      tog = 'sin_saco';
      layersMx.push(
        'Pañalero manga larga + pantalón/mameluco + suéter o chamarra + gorro ligero',
      );
    }
  } else {
    band = 'frio_extremo';
    const isCriticalCold =
      effectiveTempC < 0 || (environment === 'cuarto' && effectiveTempC < 12);
    severity = isCriticalCold ? 'urgent_red' : 'caution';
    emergency911Visible = isCriticalCold;
    tog = environment === 'cuarto' ? '3.5' : 'sin_saco';
    headlineMx = 'Frío extremo: protege sin caer en prácticas inseguras';
    if (environment === 'cuarto') {
      layersMx.push('Camiseta térmica/algodón + mameluco térmico grueso + calcetines');
      layersMx.push(
        isUnder12m
          ? 'Saco 3.5 TOG (sin cobijas sueltas ni cobija polar suelta en menores de 12 meses)'
          : 'Saco 3.5 TOG o cobija polar segura (en ≥12m)',
      );
      actionsMx.push('Templa la habitación de forma segura lejos de la cuna.');
      doNotDoMx.push(
        'Nunca uses anafres ni calentadores de gas sin ventilación (riesgo grave de monóxido de carbono).',
        'Nunca pongas gorro para dormir bajo techo ni cobijas sueltas en menores de 12 meses.',
      );
    } else {
      layersMx.push(
        'Sistema de 3 capas térmicas: base de algodón + capa intermedia + abrigo térmico',
      );
      layersMx.push('Gorro, manoplas y botitas abrigadoras');
      if (effectiveTempC < 0 && stageId === '0-3m') {
        actionsMx.push(
          'Con recién nacidos, evita salidas innecesarias por debajo de 0 °C.',
        );
      }
    }
  }

  if (stageId === '0-3m' && band !== 'calor_extremo' && band !== 'calor_alto') {
    actionsMx.push(
      'Regla general en 0–3m: una capa ligera más que un adulto en el mismo espacio.',
    );
  }
  if (ctx.canRollOver && environment === 'cuarto') {
    actionsMx.push(
      'Si ya intenta voltearse, suspende la envoltura (taquito/swaddle) y deja los brazos libres.',
    );
  }
  if (ctx.prematureOrLowWeight) {
    actionsMx.push(
      'Prematuro o bajo peso: agrega 1 capa ligera adicional y vigila con tu pediatra.',
    );
  }
  if (ctx.hasFever) {
    actionsMx.push(
      'Con fiebre: quita 1 capa (−1 capa) y nunca lo abrigues para "sudar la fiebre".',
    );
    doNotDoMx.push('Con fiebre, no uses alcohol ni agua helada.');
    if (stageId === '0-3m') {
      severity = 'urgent_red';
      emergency911Visible = true;
      actionsMx.push(
        'En menores de 3 meses, temperatura >= 38.0 °C es urgencia médica inmediata (911).',
      );
    }
  }
  if (ctx.hasAcOrFan) {
    actionsMx.push(
      'Con clima o ventilador: evita que el aire pegue directo al bebé.',
    );
  }
  if (ctx.inCarrierOrStroller) {
    actionsMx.push(
      'En portabebé o carriola: quita 1 capa (−1 capa) por el calor que retiene.',
    );
  }
  if (ctx.inCarSeat) {
    actionsMx.push(
      'En silla del auto: quita la chamarra gruesa o inflada antes de abrochar el arnés.',
    );
  }

  const outerSelected = input.selectedLayers?.outer;
  const isSwaddleSelected =
    outerSelected === 'manta_delgada_envuelta' ||
    outerSelected === 'cobija_algodon_envuelta';

  if (isSwaddleSelected && environment === 'cuarto') {
    if (stageId === '0-3m' && !ctx.canRollOver) {
      actionsMx.push(
        'Envoltura (taquito): asegúrate de dejar las caderas holgadas y nunca cubrir cara ni cuello.',
      );
    } else if (isUnder12m) {
      actionsMx.push(
        'A partir de que voltea o en 3–12m, evita envolver los brazos; usa mameluco afelpado o saco sin envoltura.',
      );
    }
  }

  const recommendedTogRange = getRecommendedTogRange(effectiveTempC, ctx);
  const currentTog = computeCurrentTog(input.selectedLayers, isUnder12m);
  const looseBlanketAlert =
    environment === 'cuarto' &&
    isUnder12m &&
    (outerSelected === 'cobija_suelta' || outerSelected === 'cobija_polar');

  let comfortZone: ComfortZone = 'optimal';
  let togDeltaMx =
    'Combinación adecuada para la temperatura actual. Verifica nuca y pecho tibios y sin sudor.';

  if (looseBlanketAlert) {
    comfortZone = 'unsafe_sleep';
    severity = 'urgent_red';
    togDeltaMx =
      outerSelected === 'cobija_polar'
        ? 'Sueño inseguro: en menores de 12 meses, la cobija polar suelta o muy gruesa aumenta el riesgo de asfixia y sobrecalentamiento. Cámbiala por mameluco afelpado/térmico o saco.'
        : 'Sueño inseguro: en menores de 12 meses, las cobijas sueltas aumentan el riesgo de asfixia. Cámbiala por mameluco afelpado o saco de dormir.';
    doNotDoMx.unshift(
      'Nunca uses cobijas sueltas, cobija polar suelta ni almohadas en la cuna de menores de 12 meses.',
    );
  } else if (currentTog !== null) {
    if (currentTog < recommendedTogRange.min) {
      comfortZone = 'cold';
      const diff = Number((recommendedTogRange.min - currentTog).toFixed(2));
      togDeltaMx = `Falta abrigo (faltan al menos ${diff} TOG). Añade un mameluco afelpado/algodón o sube el abrigo exterior.`;
    } else if (currentTog > recommendedTogRange.max) {
      comfortZone = 'overheat';
      const diff = Number((currentTog - recommendedTogRange.max).toFixed(2));
      togDeltaMx = `Riesgo de sobrecalentamiento (sobran ${diff} TOG). Quita una capa o usa una prenda más ligera.`;
    }
  } else if (band === 'calor_extremo' || band === 'calor_alto') {
    comfortZone = 'overheat';
  } else if (band === 'frio_extremo' || band === 'frio') {
    comfortZone = 'cold';
  }

  return {
    tempC,
    effectiveTempC,
    environment,
    stageId,
    band,
    severity,
    emergency911Visible,
    tog,
    recommendedTogRange,
    currentTog,
    comfortZone,
    looseBlanketAlert,
    togDeltaMx,
    headlineMx,
    layersMx,
    actionsMx,
    doNotDoMx,
    touchCheckMx:
      'Toca su nuca o pecho (no manos ni pies): tibio y seco está bien; si suda o tiene el cabello húmedo, quita una capa.',
  };
}
