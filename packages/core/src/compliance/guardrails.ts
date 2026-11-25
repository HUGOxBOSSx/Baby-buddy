import { isImperialUnitPresent } from '../domain/metrics';

export const ETHICAL_GUARDRAILS = {
  adsOnChildScreens: false,
  paywallOnEmergencyTriage: false,
  dataSellingEnabled: false,
} as const;

export interface DiagnosticViolation {
  readonly code:
    | 'AFFIRMATIVE_DIAGNOSIS'
    | 'MEDICATION_PRESCRIPTION'
    | 'REPLACES_DOCTOR';
  readonly match: string;
  readonly message: string;
}

export interface CopyValidationResult {
  readonly valid: boolean;
  readonly violations: readonly DiagnosticViolation[];
}

export interface SpanishClinicalCopyValidationResult {
  readonly valid: boolean;
  readonly hasImperialUnits: boolean;
  readonly diagnosticViolations: readonly DiagnosticViolation[];
}

const EXPLICIT_NEGATION_REGEX =
  /\b(?:(?:no|nunca|jam[aá]s|tampoco|ni)\s+(?:(?:es|son|constituye|constituyen|realiza|realizan|hace|hacen|emite|emiten|formula|formulan|ofrece|ofrecen|brinda|brindan|pretende|pretenden|intenta|intentan|debe|deben|busca|buscan)\s+(?:(?:un|una|ning[uú]n|ninguna|el|la)\s+)?)?|sin\s+(?:(?:fines?\s+(?:de\s+)?|prop[oó]sito\s+de\s+|intenci[oó]n\s+de\s+|emitir\s+|realizar\s+|hacer\s+|constituir\s+)(?:(?:un|una)\s+)?)?)$/i;

const DOSING_NEGATION_REGEX =
  /\b(?:(?:no|nunca|jam[aá]s|tampoco|ni)\s+(?:prescribe|prescriben|receta|recetan|indica|indican)|sin\s+(?:recetar|prescribir|indicar))\s+$/i;

const DIAGNOSTIC_PATTERN =
  /\b(?:diagnostic(?:amos|ar(?:te|le|les|nos)?|o|a)|diagn[oó]stico(?:\s+(?:m[eé]dico|cl[ií]nico|definitivo))?|padece\s+de|confirma(?:mos)?\s+que\s+tiene)\b/gi;

const PRESCRIPTION_VERB_PATTERN =
  /\b(?:te\s+recetamos|recet(?:amos|ar|o|a|an)|prescrib(?:imos|ir|e|en))\b/gi;

const DOSING_INSTRUCTION_PATTERN =
  /\b(?:d(?:ale|arle|ar)|admin[ií]str(?:a|ar|ale|arle)|apl[ií]c(?:a|ar|ale|arle)|dosis\s+de)\s+\d+(?:[.,]\d+)?\s*(?:ml|mg|gotas?|cucharaditas?)\b/gi;

const REPLACES_DOCTOR_NEGATABLE_PATTERN =
  /\b(?:sustituy(?:e|en)|sustitu(?:imos|ir)|reemplaz(?:a|an|amos|ar))\s+(?:al|el|a\s+la|la|tu|su)\s+(?:pediatra|m[eé]dico|doctora?|consulta)\b/gi;

const DISCOURAGES_DOCTOR_PATTERN =
  /\b(?:no\s+necesitas\s+(?:consultar|ir|acudir)\s+(?:al|con\s+(?:el|tu))\s+(?:pediatra|m[eé]dico)|evita\s+ir\s+al\s+(?:pediatra|m[eé]dico))\b/gi;

function isInterrogativeContext(text: string, index: number): boolean {
  const before = text.slice(Math.max(0, index - 160), index);
  const lastBoundaryBefore = Math.max(
    before.lastIndexOf('.'),
    before.lastIndexOf('!'),
    before.lastIndexOf('?'),
    before.lastIndexOf('\n'),
  );
  const currentSentenceBefore = before.slice(lastBoundaryBefore + 1);
  if (currentSentenceBefore.includes('¿')) {
    return true;
  }

  const after = text.slice(index, Math.min(text.length, index + 160));
  const nextBoundaryMatch = /[.!?\n]/.exec(after);
  return nextBoundaryMatch !== null && nextBoundaryMatch[0] === '?';
}

function isNegatedBeforeIndex(
  text: string,
  index: number,
  negationRegex: RegExp = EXPLICIT_NEGATION_REGEX,
): boolean {
  if (isInterrogativeContext(text, index)) {
    return false;
  }
  const windowStart = Math.max(0, index - 80);
  const prefix = text.slice(windowStart, index);
  return negationRegex.test(prefix);
}

function collectMatches(
  text: string,
  regex: RegExp,
  code: DiagnosticViolation['code'],
  message: string,
  allowNegationPrefix: boolean,
  out: DiagnosticViolation[],
  negationRegex: RegExp = EXPLICIT_NEGATION_REGEX,
): void {
  regex.lastIndex = 0;
  let match: RegExpExecArray | null = regex.exec(text);
  while (match !== null) {
    const matchedText = match[0];
    const matchIndex = match.index;
    if (
      !allowNegationPrefix ||
      !isNegatedBeforeIndex(text, matchIndex, negationRegex)
    ) {
      out.push({
        code,
        match: matchedText,
        message,
      });
    }
    match = regex.exec(text);
  }
}

export function validateNonDiagnosticCopy(text: string): CopyValidationResult {
  const violations: DiagnosticViolation[] = [];

  collectMatches(
    text,
    DIAGNOSTIC_PATTERN,
    'AFFIRMATIVE_DIAGNOSIS',
    'El texto contiene lenguaje diagnóstico afirmativo prohibido por Apple 1.4.1.',
    true,
    violations,
  );

  collectMatches(
    text,
    PRESCRIPTION_VERB_PATTERN,
    'MEDICATION_PRESCRIPTION',
    'El texto contiene indicaciones de prescripción o dosificación médica prohibidas.',
    true,
    violations,
  );

  collectMatches(
    text,
    DOSING_INSTRUCTION_PATTERN,
    'MEDICATION_PRESCRIPTION',
    'El texto contiene indicaciones de prescripción o dosificación médica prohibidas.',
    true,
    violations,
    DOSING_NEGATION_REGEX,
  );

  collectMatches(
    text,
    REPLACES_DOCTOR_NEGATABLE_PATTERN,
    'REPLACES_DOCTOR',
    'El texto sugiere sustituir la valoración del pediatra.',
    true,
    violations,
  );

  collectMatches(
    text,
    DISCOURAGES_DOCTOR_PATTERN,
    'REPLACES_DOCTOR',
    'El texto desalienta consultar al pediatra o profesional de salud.',
    false,
    violations,
  );

  return {
    valid: violations.length === 0,
    violations,
  };
}

export function validateSpanishClinicalCopy(
  text: string,
): SpanishClinicalCopyValidationResult {
  const hasImperialUnits = isImperialUnitPresent(text);
  const diagnosticCheck = validateNonDiagnosticCopy(text);

  return {
    valid: !hasImperialUnits && diagnosticCheck.valid,
    hasImperialUnits,
    diagnosticViolations: diagnosticCheck.violations,
  };
}

export function assertEthicalComplianceConfig(
  config: typeof ETHICAL_GUARDRAILS,
): void {
  if (
    config.adsOnChildScreens !== false ||
    config.paywallOnEmergencyTriage !== false ||
    config.dataSellingEnabled !== false
  ) {
    throw new Error(
      'Incumplimiento de guardrails éticos: anuncios en pantallas infantiles, paywall en urgencias o venta de datos deben permanecer desactivados.',
    );
  }
}
