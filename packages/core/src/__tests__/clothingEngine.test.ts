import { describe, expect, it } from 'vitest';
import {
  CLOTHING_MAX_TEMP_C,
  CLOTHING_MIN_TEMP_C,
  getDefaultOptimalLayers,
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
});
