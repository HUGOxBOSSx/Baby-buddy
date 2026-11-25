const IMPERIAL_PATTERNS = [
  /°\s*F\b/g,
  /\bfahrenheit\b/gi,
  /\bgrados?\s+fahrenheit\b/gi,
  /\bfl\.?\s*oz\b/gi,
  /\b\d+(?:[.,]\d+)?\s*(?:oz|onzas?|lbs?|libras?|pounds?|inch(?:es)?|pulgadas?|ft|feet|pies)\b/gi,
  /\b\d+(?:[.,]\d+)?\s*in\b/gi,
];

const DIAGNOSTIC_PATTERNS = [
  { label: 'diagnostic_claim', re: /diagn[oó]stico\s+(?:m[eé]dico|confirmado|definitivo|cl[ií]nico)/gi },
  { label: 'we_diagnose', re: /(?:te\s+)?diagnosticamos|podemos\s+diagnosticar/gi },
  { label: 'is_a_diagnosis', re: /es\s+un\s+diagn[oó]stico\b/gi },
  { label: 'confirmed_diagnosis', re: /\bconfirmed\s+diagnosis\b/gi },
  { label: 'prescribe_claim', re: /\b(?:prescribimos|recetamos|te\s+recetamos|dosis\s+exacta\s+recomendada)\b/gi },
  { label: 'definitive_treatment', re: /\btratamiento\s+definitivo\b/gi },
  { label: 'replaces_pediatrician', re: /\b(?:sustituye|reemplaza)\s+(?:al|la\s+consulta\s+con\s+(?:tu|el))\s+(?:pediatra|m[eé]dico)\b/gi },
];

const NEGATION_PREFIX_RE =
  /(?:\bno\b|\bnunca\b|\bsin\b|\bno\s+es\b|\bno\s+constituye\b|\bno\s+ofrece\b|\bno\s+realiza\b)\s*$/i;

const AD_AND_TRACKER_PATTERNS = [
  { category: 'ad_sdk', re: /\b(?:admob|adsense|googlesyndication|doubleclick|unity-ads|react-native-google-mobile-ads|expo-ads|adsbygoogle|data-ad-slot)\b/gi },
  { category: 'tracker_sdk', re: /(?:@segment\/|mixpanel|@amplitude\/|google-analytics|@vercel\/analytics|\bfbq\s*\(|\bgtag\s*\(|analytics\.track\s*\()/gi },
  { category: 'paywall_gating', re: /(?:\b(?:subscribe\s+to\s+unlock|suscripci[oó]n\s+requerida|desbloquea\s+con\s+pro|solo\s+para\s+suscriptores|paywallModal|requireSubscription)\b|paywallProtected\s*:\s*true|paywallOnEmergencyTriage\s*:\s*true)/gi },
];

const M2_TO_M7_LEAK_PATTERNS = [
  {
    milestone: 'M4_supabase_sql_rls',
    re: /\b(?:CREATE\s+TABLE|ALTER\s+TABLE\s+[\w."]+\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY|CREATE\s+POLICY)\b/gi,
  },
  {
    milestone: 'M5_cartilla_who_lms',
    re: /\b(?:Cartilla\s+Nacional\s+de\s+Vacunaci[oó]n|esquema\s+nacional\s+de\s+vacunaci[oó]n|pentavalente\s+acelular|hexavalente|whoLms|zScoreWeightForAge|calcWhoPercentile)\b/gi,
  },
  {
    milestone: 'M6_live_gemini_rag',
    re: /(?:generativelanguage\.googleapis\.com|@google\/generative-ai|@google\/genai|\bpgvector\b|\bmatch_documents\b|\bembedding_vector\b)/gi,
  },
];

const SECRET_PATTERNS = [
  { type: 'google_gemini_api_key', re: /AIza[0-9A-Za-z_-]{35}/g },
  { type: 'sk_api_key', re: /\bsk-(?:proj-|live-|test-)?[A-Za-z0-9]{20,}\b/g },
  { type: 'github_pat', re: /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{30,}\b/g },
  { type: 'github_fine_pat', re: /\bgithub_pat_[A-Za-z0-9_]{20,}\b/g },
  { type: 'aws_access_key', re: /\bAKIA[0-9A-Z]{16}\b/g },
  { type: 'jwt_token', re: /\beyJ[A-Za-z0-9_-]{8,}\.eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/g },
  { type: 'live_supabase_url', re: /https:\/\/[a-z0-9]{15,}\.supabase\.co\b/gi },
  { type: 'private_key_pem', re: /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/g },
];

export function findImperialUnits(text) {
  const matches = [];
  for (const re of IMPERIAL_PATTERNS) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(text)) !== null) {
      matches.push(m[0]);
    }
  }
  return matches;
}

export function findDiagnosticViolations(text) {
  const violations = [];
  for (const { label, re } of DIAGNOSTIC_PATTERNS) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(text)) !== null) {
      const lookbackStart = Math.max(0, m.index - 28);
      const prefix = text.slice(lookbackStart, m.index);
      if (NEGATION_PREFIX_RE.test(prefix)) {
        continue;
      }
      violations.push({ label, match: m[0], index: m.index });
    }
  }
  return violations;
}

export function findEthicalViolations(text) {
  const violations = [];
  for (const { category, re } of AD_AND_TRACKER_PATTERNS) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(text)) !== null) {
      violations.push({ category, match: m[0] });
    }
  }
  return violations;
}

export function findM2ToM7Leaks(text, relPath = '') {
  const leaks = [];
  if (/^supabase\/migrations\//i.test(relPath)) {
    leaks.push({ milestone: 'M4_supabase_sql_rls', match: relPath, relPath });
  }
  if (/^eas\.json$/i.test(relPath) && /"submit"\s*:|"production"\s*:/i.test(text)) {
    leaks.push({ milestone: 'M7_production_eas', match: 'eas.json production/submit', relPath });
  }
  for (const { milestone, re } of M2_TO_M7_LEAK_PATTERNS) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(text)) !== null) {
      leaks.push({ milestone, match: m[0], relPath });
    }
  }
  return leaks;
}

export function findSecrets(text, relPath = '') {
  const hits = [];
  for (const { type, re } of SECRET_PATTERNS) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(text)) !== null) {
      hits.push({ type, relPath, snippet: `${m[0].slice(0, 8)}...` });
    }
  }
  if (/\.env(?:\.|$)/i.test(relPath) && !relPath.endsWith('.env.example')) {
    const nonEmptySecretLine =
      /^(?:GEMINI_API_KEY|SUPABASE_SERVICE_ROLE_KEY|NEXT_PUBLIC_SUPABASE_ANON_KEY|EXPO_PUBLIC_SUPABASE_ANON_KEY|VERCEL_TOKEN|EXPO_TOKEN)\s*=\s*\S+/gm;
    let m;
    while ((m = nonEmptySecretLine.exec(text)) !== null) {
      hits.push({ type: 'env_secret_value', relPath, snippet: m[0].split('=')[0] });
    }
  }
  return hits;
}
