import { describe, expect, it } from 'vitest';
import {
  CLOTHING_MAX_TEMP_C,
  CLOTHING_MIN_TEMP_C,
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

  it('activa alerta roja 911 y protocolo de golpe de calor entre 35 °C y 50 °C', () => {
    const cuarto = recommendClothing({
      tempC: 42,
      environment: 'cuarto',
      stageId: '0-3m',
    });
    expect(cuarto.band).toBe('calor_extremo');
    expect(cuarto.severity).toBe('urgent_red');
    expect(cuarto.emergency911Visible).toBe(true);
    expect(cuarto.tog).toBe('sin_saco');
    expect(cuarto.actionsMx.join(' ')).toContain('aire acondicionado');
    expect(cuarto.doNotDoMx.join(' ')).toContain('agua helada');

    const exterior = recommendClothing({
      tempC: 45,
      environment: 'exterior',
      stageId: '1-3a',
    });
    expect(exterior.doNotDoMx.join(' ')).toContain('asiento trasero');
  });

  it('aplica protocolo de frío extremo (-5 °C a 13 °C) con reglas de seguridad', () => {
    const cuartoFrio = recommendClothing({
      tempC: 8,
      environment: 'cuarto',
      stageId: '0-3m',
    });
    expect(cuartoFrio.band).toBe('frio_extremo');
    expect(cuartoFrio.severity).toBe('urgent_red');
    expect(cuartoFrio.emergency911Visible).toBe(true);
    expect(cuartoFrio.doNotDoMx.join(' ')).toContain('monóxido de carbono');

    const exteriorBajoCero = recommendClothing({
      tempC: -3,
      environment: 'exterior',
      stageId: '0-3m',
    });
    expect(exteriorBajoCero.severity).toBe('urgent_red');
    expect(exteriorBajoCero.layersMx.join(' ')).toContain('3 capas');
  });

  it('aplica chips de contexto (fiebre, silla de auto, voltearse, prematuro)', () => {
    const rec = recommendClothing({
      tempC: 21,
      environment: 'cuarto',
      stageId: '0-3m',
      context: {
        hasFever: true,
        inCarSeat: true,
        canRollOver: true,
        prematureOrLowWeight: true,
      },
    });
    expect(rec.severity).toBe('urgent_red');
    expect(rec.emergency911Visible).toBe(true);
    expect(rec.actionsMx.join(' ')).toContain('−1 capa');
    expect(rec.actionsMx.join(' ')).toContain('swaddle');
    expect(rec.actionsMx.join(' ')).toContain('silla del auto');
    expect(rec.actionsMx.join(' ')).toContain('Prematuro');
  });

  it('ajusta -1.5 °C por muros fríos y evalúa simulador de 3 capas y cobija suelta', () => {
    const withColdWalls = recommendClothing({
      tempC: 21,
      environment: 'cuarto',
      stageId: '0-3m',
      context: { coldWalls: true },
      selectedLayers: {
        base: 'panalero_corta',
        mid: 'ninguna',
        outer: 'saco_05',
      },
    });
    expect(withColdWalls.effectiveTempC).toBe(19.5);
    expect(withColdWalls.currentTog).toBe(0.7);
    expect(withColdWalls.comfortZone).toBe('cold');
    expect(withColdWalls.togDeltaMx).toContain('Falta abrigo');

    const unsafe = recommendClothing({
      tempC: 20,
      environment: 'cuarto',
      stageId: '0-3m',
      selectedLayers: {
        base: 'panalero_larga',
        mid: 'mameluco_algodon',
        outer: 'cobija_suelta',
      },
    });
    expect(unsafe.looseBlanketAlert).toBe(true);
    expect(unsafe.comfortZone).toBe('unsafe_sleep');
    expect(unsafe.severity).toBe('urgent_red');
  });

  it('soporta opciones cotidianas (manta delgada, mameluco afelpado, cobija polar en <12m vs >=12m)', () => {
    const swaddleNewborn = recommendClothing({
      tempC: 24,
      environment: 'cuarto',
      stageId: '0-3m',
      selectedLayers: {
        base: 'panalero_corta',
        mid: 'ninguna',
        outer: 'manta_delgada_envuelta',
      },
    });
    expect(swaddleNewborn.looseBlanketAlert).toBe(false);
    expect(swaddleNewborn.currentTog).toBe(0.7);
    expect(swaddleNewborn.actionsMx.join(' ')).toContain('caderas holgadas');

    const polarUnder12m = recommendClothing({
      tempC: 16,
      environment: 'cuarto',
      stageId: '3-12m',
      selectedLayers: {
        base: 'panalero_larga',
        mid: 'mameluco_afelpado',
        outer: 'cobija_polar',
      },
    });
    expect(polarUnder12m.looseBlanketAlert).toBe(true);
    expect(polarUnder12m.comfortZone).toBe('unsafe_sleep');

    const polarToddler = recommendClothing({
      tempC: 16,
      environment: 'cuarto',
      stageId: '1-3a',
      selectedLayers: {
        base: 'panalero_larga',
        mid: 'mameluco_afelpado',
        outer: 'cobija_polar',
      },
    });
    expect(polarToddler.looseBlanketAlert).toBe(false);
    expect(polarToddler.currentTog).toBe(3.15);
    expect(polarToddler.comfortZone).toBe('optimal');
  });
});
