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
export type BabyHealthStatus = 'termino_sano' | 'prematuro' | 'fiebre';
export type WallEffectMode = 'auto' | 'frio' | 'caliente';
export type OutdoorWeatherCondition = 'soleado' | 'nublado' | 'lluvia';
export type IndoorLocation = 'cuna' | 'cama_colecho' | 'despierto_casa' | 'ninguno';
export type OutdoorTransport = 'ninguno' | 'portabebe' | 'carriola' | 'silla_auto';

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

export type AccessoryId = 'gorro' | 'guantes' | 'calcetines';

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
  | 'loose_blanket'
  | 'hat'
  | 'mittens'
  | 'socks';

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

export const ACCESSORY_OPTIONS: readonly LayerOption<AccessoryId>[] = [
  { id: 'gorro', labelMx: 'Gorro', tog: 0.3, visualKind: 'hat' },
  {
    id: 'guantes',
    labelMx: 'Guantes / manoplas',
    tog: 0.15,
    visualKind: 'mittens',
  },
  {
    id: 'calcetines',
    labelMx: 'Calcetines / botitas',
    tog: 0.15,
    visualKind: 'socks',
  },
] as const;

export interface SelectedLayersInput {
  readonly base: readonly BaseLayerId[];
  readonly mid: readonly MidLayerId[];
  readonly outer: readonly OuterLayerId[];
  readonly accessories?: readonly AccessoryId[];
}

export interface ClothingContextFlags {
  readonly babyHealthStatus: BabyHealthStatus;
  readonly prematureOrLowWeight: boolean;
  readonly hasFever: boolean;
  readonly hasAcOrFan: boolean;
  readonly inCarrierOrStroller: boolean;
  readonly inCarSeat: boolean;
  readonly canRollOver: boolean;
  readonly coldWalls: boolean;
  readonly wallEffectMode: WallEffectMode;
  readonly weatherCondition: OutdoorWeatherCondition;
  readonly isWindy: boolean;
  readonly indoorLocation: IndoorLocation;
  readonly outdoorTransport: OutdoorTransport;
}

export const DEFAULT_CLOTHING_CONTEXT: ClothingContextFlags = {
  babyHealthStatus: 'termino_sano',
  prematureOrLowWeight: false,
  hasFever: false,
  hasAcOrFan: false,
  inCarrierOrStroller: false,
  inCarSeat: false,
  canRollOver: false,
  coldWalls: false,
  wallEffectMode: 'auto',
  weatherCondition: 'soleado',
  isWindy: false,
  indoorLocation: 'cuna',
  outdoorTransport: 'ninguno',
};

export interface ClothingRecommendationInput {
  readonly tempC: number;
  readonly outdoorTempC?: number;
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
  readonly wallAdjustmentC: number;
  readonly wallEffectLabelMx: string;
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

function resolveWallAdjustment(
  tempC: number,
  outdoorTempC: number | undefined,
  environment: ClothingEnvironment,
  ctx: ClothingContextFlags,
): { readonly wallAdjustmentC: number; readonly wallEffectLabelMx: string } {
  if (environment !== 'cuarto' || !ctx.coldWalls) {
    return {
      wallAdjustmentC: 0,
      wallEffectLabelMx: 'Sin ajuste por pared exterior',
    };
  }
  if (outdoorTempC !== undefined) {
    const delta = outdoorTempC - tempC;
    if (Math.abs(delta) < 3) {
      return {
        wallAdjustmentC: 0,
        wallEffectLabelMx: `0 °C (exterior ${outdoorTempC} °C similar al cuarto)`,
      };
    }
    const raw = delta * 0.15;
    let rounded = Math.round(raw * 2) / 2;
    if (rounded === 0) {
      rounded = delta > 0 ? 0.5 : -0.5;
    }
    const clamped = Math.max(-3.0, Math.min(3.0, rounded));
    const signStr = clamped > 0 ? `+${clamped}` : `−${Math.abs(clamped)}`;
    const kind = clamped > 0 ? 'caliente' : 'fría';
    return {
      wallAdjustmentC: clamped,
      wallEffectLabelMx: `${signStr} °C por pared exterior ${kind} (${outdoorTempC} °C afuera)`,
    };
  }
  if (ctx.wallEffectMode === 'caliente') {
    return {
      wallAdjustmentC: 1.5,
      wallEffectLabelMx: '+1.5 °C por pared exterior caliente',
    };
  }
  return {
    wallAdjustmentC: -1.5,
    wallEffectLabelMx: '−1.5 °C por pared exterior fría',
  };
}

const INDOOR_TOG_CURVE: readonly (readonly [number, number, number])[] = [
  [10, 3.8, 4.9],
  [14, 3.2, 4.2],
  [16, 2.7, 3.6],
  [18, 2.1, 3.0],
  [20, 1.5, 2.3],
  [22, 1.0, 1.7],
  [24, 0.5, 1.1],
  [26, 0.2, 0.7],
  [28, 0.0, 0.2],
];

const OUTDOOR_TOG_CURVE: readonly (readonly [number, number, number])[] = [
  [0, 2.7, 3.8],
  [6, 2.15, 3.2],
  [10, 1.65, 2.6],
  [14, 1.15, 2.0],
  [18, 0.7, 1.4],
  [22, 0.3, 0.85],
  [26, 0.1, 0.45],
  [30, 0.0, 0.2],
];

function roundToStep05(value: number): number {
  return Number((Math.round(value * 20) / 20).toFixed(2));
}

function interpolateTogRange(
  tempC: number,
  curve: readonly (readonly [number, number, number])[],
): TogRange {
  const first = curve[0]!;
  if (tempC <= first[0]) {
    return { min: first[1], max: first[2] };
  }
  const last = curve[curve.length - 1]!;
  if (tempC >= last[0]) {
    return { min: last[1], max: last[2] };
  }
  for (let i = 0; i < curve.length - 1; i += 1) {
    const [t0, min0, max0] = curve[i]!;
    const [t1, min1, max1] = curve[i + 1]!;
    if (tempC >= t0 && tempC <= t1) {
      const ratio = (tempC - t0) / (t1 - t0);
      return {
        min: min0 + (min1 - min0) * ratio,
        max: max0 + (max1 - max0) * ratio,
      };
    }
  }
  return { min: last[1], max: last[2] };
}

function getRecommendedTogRange(
  effectiveTempC: number,
  environment: ClothingEnvironment,
  isPremature: boolean,
  hasFever: boolean,
  ctx: ClothingContextFlags,
): TogRange {
  const base = interpolateTogRange(
    effectiveTempC,
    environment === 'cuarto' ? INDOOR_TOG_CURVE : OUTDOOR_TOG_CURVE,
  );
  let min = base.min;
  let max = base.max;

  if (environment === 'exterior') {
    if (ctx.isWindy) {
      min += 0.35;
      max += 0.35;
    }
    if (ctx.weatherCondition === 'lluvia') {
      min += 0.25;
      max += 0.25;
    }
    if (ctx.weatherCondition === 'soleado' && effectiveTempC > 18) {
      const sunFactor = Math.min(1, (effectiveTempC - 18) / 4);
      const sunDelta = 0.15 * sunFactor;
      min = Math.max(0, min - sunDelta);
      max = Math.max(0.2, max - sunDelta);
    }
  }

  if (hasFever) {
    min = Math.max(0, min - 0.4);
    max = Math.max(0.2, max - 0.4);
  }
  if (isPremature) {
    min += 0.3;
    max += 0.3;
  }
  if (
    ctx.inCarrierOrStroller ||
    (environment === 'exterior' && ctx.outdoorTransport === 'portabebe')
  ) {
    min = Math.max(0, min - 0.35);
    max = Math.max(0.2, max - 0.35);
  }
  if (environment === 'cuarto' && ctx.indoorLocation === 'cama_colecho') {
    min = Math.max(0, min - 0.35);
    max = Math.max(0.2, max - 0.35);
  }
  const roundedMin = Math.max(0, roundToStep05(min));
  const roundedMax = Math.max(roundToStep05(roundedMin + 0.2), roundToStep05(max));
  return {
    min: roundedMin,
    max: roundedMax,
  };
}

function computeCurrentTog(
  layers: SelectedLayersInput | undefined,
  isUnder12m: boolean,
  environment: ClothingEnvironment,
): number | null {
  if (!layers) {
    return null;
  }
  if (
    environment === 'cuarto' &&
    isUnder12m &&
    (layers.outer.includes('cobija_suelta') ||
      layers.outer.includes('cobija_polar'))
  ) {
    return null;
  }
  const sum = <T extends string>(
    ids: readonly T[],
    opts: readonly LayerOption<T>[],
  ) =>
    ids.reduce(
      (acc, id) => acc + (opts.find((o) => o.id === id)?.tog ?? 0),
      0,
    );

  const total =
    sum(layers.base, BASE_LAYER_OPTIONS) +
    sum(layers.mid, MID_LAYER_OPTIONS) +
    sum(layers.outer, OUTER_LAYER_OPTIONS) +
    sum(layers.accessories ?? [], ACCESSORY_OPTIONS);
  return Number(total.toFixed(2));
}

const INDOOR_PRESETS: readonly SelectedLayersInput[] = [
  { base: ['ninguna'], mid: [], outer: [], accessories: [] }, // 0
  { base: ['panalero_sin_mangas'], mid: [], outer: [], accessories: [] }, // 0.1
  { base: ['panalero_corta'], mid: [], outer: [], accessories: [] }, // 0.2
  { base: ['panalero_larga'], mid: [], outer: [], accessories: [] }, // 0.35
  { base: ['panalero_corta'], mid: [], outer: ['saco_05'], accessories: [] }, // 0.7
  { base: ['panalero_larga'], mid: ['mameluco_algodon'], outer: [], accessories: [] }, // 0.85
  { base: ['panalero_corta'], mid: ['pijama_ligera'], outer: ['saco_05'], accessories: [] }, // 1.1
  { base: ['panalero_larga'], mid: ['mameluco_algodon'], outer: ['saco_05'], accessories: [] }, // 1.35
  { base: ['panalero_larga'], mid: ['mameluco_algodon'], outer: ['saco_10'], accessories: [] }, // 1.85
  { base: ['panalero_larga'], mid: ['mameluco_afelpado'], outer: ['saco_10'], accessories: ['calcetines'] }, // 2.3
  { base: ['panalero_corta'], mid: [], outer: ['saco_25'], accessories: [] }, // 2.7
  { base: ['panalero_larga'], mid: ['mameluco_algodon'], outer: ['saco_25'], accessories: [] }, // 3.35
  { base: ['panalero_larga'], mid: ['mameluco_afelpado'], outer: ['saco_25'], accessories: ['calcetines'] }, // 3.8
  { base: ['termica_interior'], mid: ['mameluco_termico'], outer: ['saco_25'], accessories: ['calcetines'] }, // 4.45
];

const OUTDOOR_PRESETS: readonly SelectedLayersInput[] = [
  { base: ['ninguna'], mid: [], outer: [], accessories: [] }, // 0
  { base: ['panalero_sin_mangas'], mid: [], outer: [], accessories: [] }, // 0.1
  { base: ['panalero_corta'], mid: [], outer: [], accessories: [] }, // 0.2
  { base: ['panalero_larga'], mid: [], outer: [], accessories: [] }, // 0.35
  { base: ['panalero_corta'], mid: ['pijama_ligera'], outer: [], accessories: [] }, // 0.6
  { base: ['panalero_larga'], mid: ['mameluco_algodon'], outer: [], accessories: [] }, // 0.85
  { base: ['panalero_larga'], mid: ['mameluco_afelpado'], outer: [], accessories: ['calcetines'] }, // 1.3
  { base: ['panalero_larga'], mid: ['mameluco_algodon', 'sueter_chamarra'], outer: [], accessories: ['calcetines'] }, // 2.0
  { base: ['termica_interior'], mid: ['mameluco_afelpado', 'sueter_chamarra'], outer: [], accessories: ['gorro', 'calcetines'] }, // 2.85
  { base: ['termica_interior'], mid: ['mameluco_termico', 'sueter_chamarra'], outer: [], accessories: ['gorro', 'guantes', 'calcetines'] }, // 3.4
];

export function getDefaultOptimalLayers(
  input: Omit<ClothingRecommendationInput, 'selectedLayers'>,
): SelectedLayersInput {
  const ctx: ClothingContextFlags = {
    ...DEFAULT_CLOTHING_CONTEXT,
    ...input.context,
  };
  const isPremature =
    ctx.prematureOrLowWeight || ctx.babyHealthStatus === 'prematuro';
  const hasFever = ctx.hasFever || ctx.babyHealthStatus === 'fiebre';

  const { wallAdjustmentC } = resolveWallAdjustment(
    input.tempC,
    input.outdoorTempC,
    input.environment,
    ctx,
  );
  const eff = Math.min(
    CLOTHING_MAX_TEMP_C,
    Math.max(
      CLOTHING_MIN_TEMP_C,
      Number((input.tempC + wallAdjustmentC).toFixed(1)),
    ),
  );
  const range = getRecommendedTogRange(
    eff,
    input.environment,
    isPremature,
    hasFever,
    ctx,
  );
  const targetMid = (range.min + range.max) / 2;
  const presets =
    input.environment === 'cuarto' ? INDOOR_PRESETS : OUTDOOR_PRESETS;

  let best = presets[0]!;
  let bestDist = Number.POSITIVE_INFINITY;
  for (const preset of presets) {
    const tog =
      computeCurrentTog(preset, true, input.environment) ?? 0;
    const inRange = tog >= range.min && tog <= range.max;
    const dist = Math.abs(tog - targetMid) + (inRange ? 0 : 10);
    if (dist < bestDist) {
      bestDist = dist;
      best = preset;
    }
  }
  return best;
}

export function recommendClothing(
  input: ClothingRecommendationInput,
): ClothingRecommendation {
  const { tempC, outdoorTempC, environment, stageId } = input;
  if (
    !Number.isFinite(tempC) ||
    tempC < CLOTHING_MIN_TEMP_C ||
    tempC > CLOTHING_MAX_TEMP_C
  ) {
    throw new RangeError(
      `La temperatura debe estar entre ${CLOTHING_MIN_TEMP_C} °C y ${CLOTHING_MAX_TEMP_C} °C.`,
    );
  }
  if (
    outdoorTempC !== undefined &&
    (!Number.isFinite(outdoorTempC) ||
      outdoorTempC < CLOTHING_MIN_TEMP_C ||
      outdoorTempC > CLOTHING_MAX_TEMP_C)
  ) {
    throw new RangeError(
      `La temperatura exterior debe estar entre ${CLOTHING_MIN_TEMP_C} °C y ${CLOTHING_MAX_TEMP_C} °C.`,
    );
  }

  const ctx: ClothingContextFlags = {
    ...DEFAULT_CLOTHING_CONTEXT,
    ...input.context,
  };
  const isPremature =
    ctx.prematureOrLowWeight || ctx.babyHealthStatus === 'prematuro';
  const hasFever = ctx.hasFever || ctx.babyHealthStatus === 'fiebre';

  const { wallAdjustmentC, wallEffectLabelMx } = resolveWallAdjustment(
    tempC,
    outdoorTempC,
    environment,
    ctx,
  );
  const effectiveTempC = Math.min(
    CLOTHING_MAX_TEMP_C,
    Math.max(
      CLOTHING_MIN_TEMP_C,
      Number((tempC + wallAdjustmentC).toFixed(1)),
    ),
  );

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
      layersMx.push(
        'Camiseta térmica/algodón + mameluco térmico grueso + calcetines',
      );
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
  if (isPremature) {
    actionsMx.push(
      'Prematuro o bajo peso: agrega 1 capa ligera adicional y vigila con tu pediatra.',
    );
  }
  if (hasFever) {
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
  if (ctx.inCarrierOrStroller || (environment === 'exterior' && ctx.outdoorTransport === 'portabebe')) {
    actionsMx.push(
      'En portabebé o fular: quita 1 capa (−1 capa) por el calor corporal que retiene.',
    );
  }
  if (environment === 'exterior' && ctx.outdoorTransport === 'carriola') {
    doNotDoMx.push(
      'En carriola: nunca la cubras con mantas o pañales porque elevan rápidamente la temperatura interior.',
    );
  }
  if (ctx.inCarSeat || (environment === 'exterior' && ctx.outdoorTransport === 'silla_auto')) {
    actionsMx.push(
      'En silla del auto: quita la chamarra gruesa o inflada antes de abrochar el arnés.',
    );
  }
  if (environment === 'cuarto' && ctx.indoorLocation === 'cama_colecho') {
    actionsMx.push(
      'En cama/colecho: el calor corporal del adulto suma abrigo (−0.35 TOG). Evita edredones pesados y almohadas cerca del bebé; en <12m la recomendación más segura es superficie firme separada en la misma habitación.',
    );
  }
  if (environment === 'exterior') {
    if (ctx.isWindy) {
      actionsMx.push(
        'Con viento: agrega capa cortavientos o chamarra ligera y protege oídos.',
      );
    }
    if (ctx.weatherCondition === 'lluvia') {
      actionsMx.push(
        'Con lluvia: usa impermeable o protector de lluvia para carriola dejando ventilación lateral.',
      );
    }
    if (ctx.weatherCondition === 'soleado' && effectiveTempC >= 20) {
      actionsMx.push(
        stageId === '0-3m'
          ? 'Con sol: prioriza sombra total y evita protector solar en menores de 6 meses.'
          : 'Con sol: prioriza sombra, sombrero de ala ancha y protector solar mineral desde los 6 meses.',
      );
    }
  }

  const outerSelected = input.selectedLayers?.outer ?? [];
  const accessoriesSelected = input.selectedLayers?.accessories ?? [];

  const isSwaddleSelected =
    outerSelected.includes('manta_delgada_envuelta') ||
    outerSelected.includes('cobija_algodon_envuelta');

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

  const sackCount = outerSelected.filter((id) => id.startsWith('saco_')).length;
  if (sackCount >= 2) {
    doNotDoMx.push(
      'Nunca uses dos sacos de dormir uno encima del otro: atrapan calor y restringen el flujo de aire.',
    );
    if (severity === 'normal') {
      severity = 'caution';
    }
  }

  if (accessoriesSelected.includes('gorro')) {
    if (environment === 'cuarto') {
      doNotDoMx.push(
        'Quita el gorro para dormir bajo techo: los bebés liberan calor por la cabeza y puede deslizarse sobre la cara.',
      );
      if (severity === 'normal') {
        severity = 'caution';
      }
    } else if (effectiveTempC <= 17) {
      actionsMx.push('Gorro en exterior fresco/frío: protege bien la cabeza (+0.3 TOG).');
    }
  }

  if (accessoriesSelected.includes('guantes') && environment === 'cuarto') {
    actionsMx.push(
      'Bajo techo los guantes no suelen ser necesarios para abrigo; manos frescas son normales y conviene evaluar en nuca o pecho.',
    );
  }

  const recommendedTogRange = getRecommendedTogRange(
    effectiveTempC,
    environment,
    isPremature,
    hasFever,
    ctx,
  );
  const currentTog = computeCurrentTog(
    input.selectedLayers,
    isUnder12m,
    environment,
  );
  const looseBlanketAlert =
    environment === 'cuarto' &&
    isUnder12m &&
    (outerSelected.includes('cobija_suelta') ||
      outerSelected.includes('cobija_polar'));

  let comfortZone: ComfortZone = 'optimal';
  let togDeltaMx = 'Abrigo óptimo para esta temperatura y contexto.';

  if (looseBlanketAlert) {
    comfortZone = 'unsafe_sleep';
    severity = 'urgent_red';
    togDeltaMx = outerSelected.includes('cobija_polar')
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

  const baseSelected = input.selectedLayers?.base ?? [];
  const midSelected = (input.selectedLayers?.mid ?? []).filter((x) => x !== 'ninguna');
  const outerActive = outerSelected.filter((x) => x !== 'ninguna');

  if (comfortZone === 'cold') {
    if (midSelected.length === 0) {
      actionsMx.unshift(
        'Falta abrigo: agrega un mameluco de algodón (+0.5 TOG) o afelpado (+0.8 TOG).',
      );
    }
    if (environment === 'cuarto' && outerActive.length === 0) {
      actionsMx.unshift(
        'Agrega un saco de dormir o sube a mameluco térmico para llegar al abrigo óptimo.',
      );
    }
    if (
      environment === 'exterior' &&
      effectiveTempC <= 17 &&
      !accessoriesSelected.includes('gorro')
    ) {
      actionsMx.unshift(
        'En exterior fresco/frío, agrega un gorro (+0.3 TOG) o suéter/chamarra (+1.0 TOG).',
      );
    }
  } else if (comfortZone === 'overheat') {
    if (environment === 'cuarto' && accessoriesSelected.includes('gorro')) {
      actionsMx.unshift('Quita el gorro de inmediato para evitar sobrecalentamiento.');
    }
    if (outerActive.length > 0) {
      actionsMx.unshift(
        'Sobra abrigo: retira la capa exterior o cambia a una opción más ligera.',
      );
    } else if (midSelected.length > 0) {
      actionsMx.unshift(
        'Sobra abrigo: quita la capa media y deja solo pañalero ligero o pañal.',
      );
    } else if (baseSelected.some((x) => x !== 'ninguna')) {
      actionsMx.unshift('Sobra abrigo: deja solo pañal si el ambiente está muy caluroso.');
    }
  } else if (comfortZone === 'unsafe_sleep') {
    actionsMx.unshift(
      'Retira la cobija suelta o polar de la cuna y usa en su lugar un mameluco afelpado/térmico o un saco de dormir seguro.',
    );
  }

  return {
    tempC,
    effectiveTempC,
    wallAdjustmentC,
    wallEffectLabelMx,
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
