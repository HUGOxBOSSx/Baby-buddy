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

  it('calcula muro exterior frío (-1.5 °C) y muro exterior caliente (+1.5 °C) según outdoorTempC', () => {
    const muroFrio = recommendClothing({
      tempC: 21,
      outdoorTempC: 10,
      environment: 'cuarto',
      stageId: '0-3m',
      context: { coldWalls: true },
    });
    expect(muroFrio.wallAdjustmentC).toBe(-1.5);
    expect(muroFrio.effectiveTempC).toBe(19.5);

    const muroCaliente = recommendClothing({
      tempC: 24,
      outdoorTempC: 36,
      environment: 'cuarto',
      stageId: '0-3m',
      context: { coldWalls: true },
    });
    expect(muroCaliente.wallAdjustmentC).toBe(1.5);
    expect(muroCaliente.effectiveTempC).toBe(25.5);
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

  it('genera combinación óptima por defecto con getDefaultOptimalLayers', () => {
    for (const t of [16, 21, 25]) {
      const defaults = getDefaultOptimalLayers({
        tempC: t,
        environment: 'cuarto',
        stageId: '0-3m',
      });
      const rec = recommendClothing({
        tempC: t,
        environment: 'cuarto',
        stageId: '0-3m',
        selectedLayers: defaults,
      });
      expect(rec.comfortZone).toBe('optimal');
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
