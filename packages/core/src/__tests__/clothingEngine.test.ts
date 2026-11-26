import { describe, expect, it } from 'vitest';
import {
  BASE_LAYER_OPTIONS,
  CLOTHING_MAX_TEMP_C,
  CLOTHING_MIN_TEMP_C,
  GARMENT_TOG_GUIDES,
  MID_LAYER_OPTIONS,
  OUTER_LAYER_OPTIONS,
  getDefaultOptimalLayers,
  getGarmentTogGuide,
  recommendClothing,
} from '../domain/clothingEngine';

describe('recommendClothing (-5 °C a 50 °C)', () => {
  it('cubre todo el rango -5 °C a 50 °C sin errores y lanza RangeError fuera de rango', () => {
    for (let t = CLOTHING_MIN_TEMP_C; t <= CLOTHING_MAX_TEMP_C; t += 5) {
      const rec = recommendClothing({
        tempC: t,
        environment: 'cuarto',
        stageId: '0-3m',
      });
      expect(rec.layersMx.length).toBeGreaterThan(0);
      expect(rec.touchCheckMx).toContain('nuca o pecho');
    }

    expect(() =>
      recommendClothing({ tempC: -6, environment: 'cuarto', stageId: '0-3m' }),
    ).toThrow(RangeError);
    expect(() =>
      recommendClothing({ tempC: 51, environment: 'exterior', stageId: '1-3a' }),
    ).toThrow(RangeError);
  });

  it('calcula ajuste proporcional de pared exterior según diferencia de temperatura (ΔT)', () => {
    const similar = recommendClothing({
      tempC: 21,
      outdoorTempC: 19,
      environment: 'cuarto',
      stageId: '0-3m',
      context: { coldWalls: true },
    });
    expect(similar.wallAdjustmentC).toBe(0);

    const fresco = recommendClothing({
      tempC: 21,
      outdoorTempC: 14,
      environment: 'cuarto',
      stageId: '0-3m',
      context: { coldWalls: true },
    });
    expect(fresco.wallAdjustmentC).toBe(-1.0);
    expect(fresco.effectiveTempC).toBe(20);

    const muyFrio = recommendClothing({
      tempC: 21,
      outdoorTempC: 5,
      environment: 'cuarto',
      stageId: '0-3m',
      context: { coldWalls: true },
    });
    expect(muyFrio.wallAdjustmentC).toBe(-2.5);

    const muyCaliente = recommendClothing({
      tempC: 24,
      outdoorTempC: 44,
      environment: 'cuarto',
      stageId: '0-3m',
      context: { coldWalls: true },
    });
    expect(muyCaliente.wallAdjustmentC).toBe(3.0);

    const colecho = recommendClothing({
      tempC: 21,
      environment: 'cuarto',
      stageId: '0-3m',
      context: { indoorLocation: 'cama_colecho' },
    });
    expect(colecho.actionsMx.join(' ')).toContain('cama/colecho');
  });

  it('permite multi-selección por capa, accesorios y detecta gorro bajo techo o doble saco', () => {
    const multi = recommendClothing({
      tempC: 10,
      environment: 'exterior',
      stageId: '1-3a',
      selectedLayers: {
        base: ['termica_interior'],
        mid: ['mameluco_algodon', 'sueter_chamarra'],
        outer: [],
        accessories: ['gorro', 'guantes', 'calcetines'],
      },
    });
    expect(multi.currentTog).toBe(2.7);

    const gorroEnCuarto = recommendClothing({
      tempC: 20,
      environment: 'cuarto',
      stageId: '0-3m',
      selectedLayers: {
        base: ['panalero_larga'],
        mid: ['mameluco_algodon'],
        outer: ['saco_10'],
        accessories: ['gorro'],
      },
    });
    expect(gorroEnCuarto.doNotDoMx.join(' ')).toContain('Quita el gorro');
    expect(gorroEnCuarto.severity).toBe('caution');
  });

  it('genera combinación óptima por defecto con getDefaultOptimalLayers en cuarto y exterior', () => {
    for (const environment of ['cuarto', 'exterior'] as const) {
      for (const tempC of [-2, 8, 16, 21, 26, 32]) {
        const ctx = {
          inCarrierOrStroller: tempC === 21,
          isWindy: environment === 'exterior' && tempC === 16,
          weatherCondition:
            environment === 'exterior' && tempC === 8
              ? ('lluvia' as const)
              : ('soleado' as const),
        };
        const defaults = getDefaultOptimalLayers({
          tempC,
          environment,
          stageId: '0-3m',
          context: ctx,
        });
        const rec = recommendClothing({
          tempC,
          environment,
          stageId: '0-3m',
          context: ctx,
          selectedLayers: defaults,
        });
        expect(
          rec.comfortZone,
          `Falló óptimo en ${environment} a ${tempC}°C (TOG ${rec.currentTog} vs ${rec.recommendedTogRange.min}-${rec.recommendedTogRange.max})`,
        ).toBe('optimal');
      }
    }
  });

  it('detecta sueño inseguro con cobija suelta o polar en <12m y la permite en >=12m', () => {
    const polarUnder12m = recommendClothing({
      tempC: 16,
      environment: 'cuarto',
      stageId: '3-12m',
      selectedLayers: {
        base: ['panalero_larga'],
        mid: ['mameluco_afelpado'],
        outer: ['cobija_polar'],
      },
    });
    expect(polarUnder12m.looseBlanketAlert).toBe(true);
    expect(polarUnder12m.comfortZone).toBe('unsafe_sleep');

    const polarToddler = recommendClothing({
      tempC: 16,
      environment: 'cuarto',
      stageId: '1-3a',
      selectedLayers: {
        base: ['panalero_larga'],
        mid: ['mameluco_afelpado'],
        outer: ['cobija_polar'],
      },
    });
    expect(polarToddler.looseBlanketAlert).toBe(false);
    expect(polarToddler.currentTog).toBe(3.15);
    expect(polarToddler.comfortZone).toBe('optimal');
  });

  it('genera acciones dinámicas según comfortZone (qué sumar en frío y qué quitar en calor)', () => {
    const frio = recommendClothing({
      tempC: 16,
      environment: 'cuarto',
      stageId: '3-12m',
      selectedLayers: {
        base: ['panalero_corta'],
        mid: [],
        outer: [],
      },
    });
    expect(frio.comfortZone).toBe('cold');
    expect(frio.actionsMx.join(' ')).toContain('Falta abrigo');

    const calor = recommendClothing({
      tempC: 27,
      environment: 'cuarto',
      stageId: '3-12m',
      selectedLayers: {
        base: ['panalero_larga'],
        mid: ['mameluco_afelpado'],
        outer: ['saco_10'],
      },
    });
    expect(calor.comfortZone).toBe('overheat');
    expect(calor.actionsMx.join(' ')).toContain('Sobra abrigo');
  });

  it('mantiene continuidad y monotonicidad en pasos de 0.5 °C sin saltos bruscos (ej. 19.5 °C vs 20 °C)', () => {
    for (const environment of ['cuarto', 'exterior'] as const) {
      let prev = recommendClothing({
        tempC: CLOTHING_MIN_TEMP_C,
        environment,
        stageId: '0-3m',
      }).recommendedTogRange;
      expect(prev.min).toBeLessThan(prev.max);

      for (let t = CLOTHING_MIN_TEMP_C + 0.5; t <= CLOTHING_MAX_TEMP_C; t += 0.5) {
        const curr = recommendClothing({
          tempC: t,
          environment,
          stageId: '0-3m',
        }).recommendedTogRange;
        expect(curr.min).toBeLessThan(curr.max);
        expect(curr.min).toBeLessThanOrEqual(prev.min);
        expect(curr.max).toBeLessThanOrEqual(prev.max);
        expect(Math.abs(curr.min - prev.min)).toBeLessThanOrEqual(0.25);
        expect(Math.abs(curr.max - prev.max)).toBeLessThanOrEqual(0.25);
        prev = curr;
      }
    }

    const at195 = recommendClothing({
      tempC: 19.5,
      environment: 'cuarto',
      stageId: '0-3m',
    }).recommendedTogRange;
    const at200 = recommendClothing({
      tempC: 20,
      environment: 'cuarto',
      stageId: '0-3m',
    }).recommendedTogRange;
    expect(Math.abs(at195.min - at200.min)).toBeLessThanOrEqual(0.25);
    expect(Math.abs(at195.max - at200.max)).toBeLessThanOrEqual(0.25);

    for (const environment of ['cuarto', 'exterior'] as const) {
      for (const tempC of [-2, 4, 8, 12, 16, 19.5, 20, 21, 23.5, 26, 32]) {
        const defaults = getDefaultOptimalLayers({
          tempC,
          environment,
          stageId: '0-3m',
        });
        const rec = recommendClothing({
          tempC,
          environment,
          stageId: '0-3m',
          selectedLayers: defaults,
        });
        expect(
          rec.comfortZone,
          `Falló óptimo en ${environment} a ${tempC}°C (TOG ${rec.currentTog} vs ${rec.recommendedTogRange.min}-${rec.recommendedTogRange.max})`,
        ).toBe('optimal');
      }
    }
  });

  it('mantiene guías TOG sincronizadas con las opciones de prendas', () => {
    const allOptions = [
      ...BASE_LAYER_OPTIONS,
      ...MID_LAYER_OPTIONS,
      ...OUTER_LAYER_OPTIONS,
    ];
    for (const guide of Object.values(GARMENT_TOG_GUIDES)) {
      if (!guide) continue;
      const opt = allOptions.find((o) => o.id === guide.id);
      expect(opt).toBeDefined();
      expect(guide.togValue).toBe(opt?.tog);
      expect(guide.titleMx.length).toBeGreaterThan(0);
      expect(guide.labelCluesMx.length).toBeGreaterThan(0);
      expect(guide.touchAndLookMx.length).toBeGreaterThan(0);
      expect(getGarmentTogGuide(guide.id)).toEqual(guide);
    }
  });
});
