import type { ClinicalMetadata, ClinicalSource } from './schema';

export const DEFAULT_M1_METADATA_VERSION = '1.0.0-m1-borrador';
export const DEFAULT_M1_REVIEWED_AT = '2026-11-24';
export const DEFAULT_M1_REVIEWED_BY =
  'Contenido editorial en borrador; revisión pediátrica pendiente';

export const M1_CLINICAL_SOURCES = {
  nom031: {
    title: 'NOM-031-SSA2-1999, Para la atención a la salud del niño',
    organization: 'Secretaría de Salud (México)',
    year: 1999,
  },
  whoChildCare: {
    title: 'Pocket Book of Hospital Care for Children / Cuidado infantil',
    organization: 'Organización Mundial de la Salud (OMS / WHO)',
    year: 2013,
  },
  aapSafeSleep: {
    title: 'Sleep-Related Infant Deaths: Updated Recommendations',
    organization: 'American Academy of Pediatrics (AAP)',
    year: 2022,
  },
  cenetecFever: {
    title: 'Guía de Práctica Clínica: Fiebre en pediatría (referencia)',
    organization: 'CENETEC Salud (México)',
    year: 2018,
  },
} as const satisfies Record<string, ClinicalSource>;

export function createClinicalMetadata(
  overrides: Partial<ClinicalMetadata> = {},
): ClinicalMetadata {
  return {
    version: overrides.version ?? DEFAULT_M1_METADATA_VERSION,
    sources: overrides.sources ?? [
      M1_CLINICAL_SOURCES.nom031,
      M1_CLINICAL_SOURCES.whoChildCare,
    ],
    reviewed_at: overrides.reviewed_at ?? DEFAULT_M1_REVIEWED_AT,
    reviewed_by: overrides.reviewed_by ?? DEFAULT_M1_REVIEWED_BY,
  };
}

const ISO_DATE_REGEX = /^(\d{4})-(\d{2})-(\d{2})$/;

function isValidIsoCalendarDate(value: string): boolean {
  const match = ISO_DATE_REGEX.exec(value);
  if (!match) {
    return false;
  }

  const year = Number.parseInt(match[1] ?? '', 10);
  const month = Number.parseInt(match[2] ?? '', 10);
  const day = Number.parseInt(match[3] ?? '', 10);

  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return false;
  }

  const utcCalendarCheck = new Date(Date.UTC(year, month - 1, day));
  return (
    utcCalendarCheck.getUTCFullYear() === year &&
    utcCalendarCheck.getUTCMonth() === month - 1 &&
    utcCalendarCheck.getUTCDate() === day
  );
}

export function assertValidClinicalMetadata(meta: ClinicalMetadata): void {
  if (!meta.version.trim()) {
    throw new Error('ClinicalMetadata.version no puede estar vacío.');
  }
  if (meta.sources.length === 0) {
    throw new Error(
      'ClinicalMetadata.sources debe incluir al menos una fuente.',
    );
  }
  if (!isValidIsoCalendarDate(meta.reviewed_at)) {
    throw new Error(
      `ClinicalMetadata.reviewed_at debe ser una fecha calendario válida en formato YYYY-MM-DD: ${meta.reviewed_at}`,
    );
  }
  if (!meta.reviewed_by.trim()) {
    throw new Error('ClinicalMetadata.reviewed_by no puede estar vacío.');
  }
}
