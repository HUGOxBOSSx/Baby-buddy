import { createClinicalMetadata, M1_CLINICAL_SOURCES } from '../disclaimers';
import type { PoopColorEntry } from '../schema';

const meta = () =>
  createClinicalMetadata({
    sources: [M1_CLINICAL_SOURCES.nom031, M1_CLINICAL_SOURCES.whoChildCare],
  });

export const POOP_COLOR_CHART: readonly PoopColorEntry[] = [
  {
    id: 'popo-meconio',
    colorNameMx: 'Negro verdoso pegajoso (meconio)',
    swatchToken: 'meconium',
    typicalAgeMx: 'Primeros 1 a 3 días de vida',
    meaningMx: 'Es completamente normal: son las primeras evacuaciones del recién nacido.',
    triageLevel: 'green_home',
    actionMx: 'Limpia suavemente con agua tibia; irá aclarando conforme tome leche.',
    metadata: meta(),
  },
  {
    id: 'popo-mostaza',
    colorNameMx: 'Amarillo mostaza con "semillas"',
    swatchToken: 'mustard',
    typicalAgeMx: 'Recién nacido y lactante',
    meaningMx: 'Evacuación típica y saludable en bebés alimentados con leche materna.',
    triageLevel: 'green_home',
    actionMx: 'Esperado y normal. Vigila que siga mojando al menos 6 pañales al día.',
    metadata: meta(),
  },
  {
    id: 'popo-cafe-ocre',
    colorNameMx: 'Café claro, ocre o pasta suave',
    swatchToken: 'brown',
    typicalAgeMx: 'Fórmula o inicio de sólidos (6m+)',
    meaningMx: 'Normal en bebés que toman fórmula o ya comenzaron alimentación complementaria.',
    triageLevel: 'green_home',
    actionMx: 'Normal. Si cambia a bolitas muy duras, ofrece más agua en ml si es mayor de 6m.',
    metadata: meta(),
  },
  {
    id: 'popo-verde',
    colorNameMx: 'Verde pasajero',
    swatchToken: 'green',
    typicalAgeMx: '0 a 12 meses',
    meaningMx: 'Suele ser normal por tránsito rápido, suplemento de hierro o leche inicial.',
    triageLevel: 'yellow_pediatrician',
    actionMx: 'Si el bebé está tranquilo y sube de peso, observa. Si es muy líquida y frecuente, consulta al pediatra.',
    metadata: meta(),
  },
  {
    id: 'popo-roja',
    colorNameMx: 'Rojo o con hilos de sangre',
    swatchToken: 'red',
    typicalAgeMx: 'Cualquier edad',
    meaningMx: 'Puede deberse a fisura anal, alergia alimentaria o infección que requiere valoración.',
    triageLevel: 'orange_urgent',
    actionMx: 'Toma foto del pañal y acude a valoración médica hoy mismo.',
    metadata: meta(),
  },
  {
    id: 'popo-blanca-gris',
    colorNameMx: 'Blanco, beige pálido o gris arcilla',
    swatchToken: 'white_clay',
    typicalAgeMx: 'Cualquier edad (crítico en <3m)',
    meaningMx: 'Señal de alerta importante: puede indicar problema en la bilis o el hígado.',
    triageLevel: 'orange_urgent',
    actionMx: 'Acude a valoración médica el mismo día y lleva foto del pañal.',
    metadata: meta(),
  },
  {
    id: 'popo-negra-tardia',
    colorNameMx: 'Negro después de la primera semana',
    swatchToken: 'black_late',
    typicalAgeMx: 'Mayor de 7 días (sin tomar hierro)',
    meaningMx: 'Si no toma suplemento de hierro, requiere descartar sangrado digestivo.',
    triageLevel: 'orange_urgent',
    actionMx: 'Acude a urgencias o con tu pediatra hoy mismo.',
    metadata: meta(),
  },
] as const;
