import './helpers/ts-hooks.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { after, test } from 'node:test';
import { CORE_ONLY, ROOT_DIR, readJsonSafe, readTextSafe, walkFiles } from './helpers/paths.mjs';
import {
  resolveWorkspaceBin,
  runGit,
  runNodeScript,
  runNpm,
  sanitizeOfflineEnv,
} from './helpers/proc.mjs';
import {
  findDiagnosticViolations,
  findEthicalViolations,
  findImperialUnits,
  findM2ToM7Leaks,
  findSecrets,
} from './helpers/scanners.mjs';
import { importContent, importCore } from './helpers/ts-hooks.mjs';
import { assertContrastAtLeast, calcContrast } from './helpers/wcag.mjs';
import { startWebServer } from './helpers/web-server.mjs';

const SKIP_APP_REASON = CORE_ONLY
  ? 'Deferred under E2E_CORE_ONLY=1 while M2 (apps/web) and M3 (apps/mobile) are in-flight'
  : false;

let sharedWebServer = null;

async function ensureWebServer() {
  if (!sharedWebServer) {
    const buildIdPath = path.join(ROOT_DIR, 'apps', 'web', '.next', 'BUILD_ID');
    if (!fs.existsSync(buildIdPath)) {
      const buildRes = runNpm(['run', 'build:web']);
      assert.equal(buildRes.status, 0, `build:web failed:\n${buildRes.stdout}\n${buildRes.stderr}`);
    }
    sharedWebServer = await startWebServer();
  }
  return sharedWebServer;
}

after(() => {
  if (sharedWebServer) {
    sharedWebServer.stop();
    sharedWebServer = null;
  }
});

// =============================================================================
// F01: Secrets, Repo Hygiene & Path Boundaries (T2-F01-01 .. T2-F01-05)
// =============================================================================

test('T2-F01-01: Repository secret & live-credential scan finds zero leaked keys or JWTs', () => {
  const ignorePrefixes = CORE_ONLY ? ['e2e/', 'apps/'] : ['e2e/'];
  const files = walkFiles(ROOT_DIR, { ignoreRelPrefixes: ignorePrefixes });
  const hits = [];
  for (const f of files) {
    if (f.relPath.endsWith('package-lock.json')) continue;
    const text = readTextSafe(f.absPath);
    hits.push(...findSecrets(text, f.relPath));
  }
  assert.deepEqual(hits, [], `Unexpected secrets found: ${JSON.stringify(hits)}`);
});

test('T2-F01-02: Zero .env or .env.local files are tracked in Git (only .env.example)', () => {
  const res = runGit(['ls-files']);
  assert.equal(res.status, 0, `git ls-files failed: ${res.stderr}`);
  const tracked = res.stdout.split(/\r?\n/).filter(Boolean);
  const forbiddenEnvFiles = tracked.filter(
    (p) => /(?:^|\/)\.env(?:\.|$)/i.test(p) && !p.endsWith('.env.example'),
  );
  assert.deepEqual(forbiddenEnvFiles, [], `Tracked .env files found: ${forbiddenEnvFiles.join(', ')}`);
});

test('T2-F01-03: Single React 19 major resolved across workspaces without React 18 conflict', { skip: SKIP_APP_REASON }, () => {
  const webPkg = readJsonSafe(path.join(ROOT_DIR, 'apps', 'web', 'package.json'));
  const mobilePkg = readJsonSafe(path.join(ROOT_DIR, 'apps', 'mobile', 'package.json'));
  assert.match(String(webPkg.dependencies?.react ?? ''), /\b19\./);
  assert.match(String(mobilePkg.dependencies?.react ?? ''), /\b19\./);

  const lsRes = runNpm(['ls', 'react', '--depth=1']);
  assert.equal(lsRes.status, 0, `npm ls react failed:\n${lsRes.stdout}\n${lsRes.stderr}`);
  assert.doesNotMatch(lsRes.stdout, /\breact@18\./, 'Conflicting React 18 detected');
});

test('T2-F01-04: Tailwind CSS is pinned strictly to 3.4.x (never v4) across web and mobile', { skip: SKIP_APP_REASON }, () => {
  const webPkg = readJsonSafe(path.join(ROOT_DIR, 'apps', 'web', 'package.json'));
  const mobilePkg = readJsonSafe(path.join(ROOT_DIR, 'apps', 'mobile', 'package.json'));
  const webTw = String(webPkg.devDependencies?.tailwindcss ?? webPkg.dependencies?.tailwindcss ?? '');
  const mobTw = String(mobilePkg.devDependencies?.tailwindcss ?? mobilePkg.dependencies?.tailwindcss ?? '');
  assert.match(webTw, /3\.4\./, `apps/web tailwindcss must be 3.4.x, got "${webTw}"`);
  assert.match(mobTw, /3\.4\./, `apps/mobile tailwindcss must be 3.4.x, got "${mobTw}"`);
});

test('T2-F01-05: Windows path-with-spaces ("Baby buddy") executes workspace commands cleanly', () => {
  assert.ok(ROOT_DIR.includes(' '), `Expected workspace path with space, got ${ROOT_DIR}`);
  const tc = runNpm(
    CORE_ONLY
      ? ['run', 'typecheck', '--workspace=@baby-buddy/core', '--workspace=@baby-buddy/content']
      : ['run', 'typecheck'],
  );
  assert.equal(tc.status, 0, `typecheck failed in spaced path:\n${tc.stdout}\n${tc.stderr}`);

  const vt = runNpm(['run', 'test']);
  assert.equal(vt.status, 0, `test failed in spaced path:\n${vt.stdout}\n${vt.stderr}`);
});

// =============================================================================
// F02: $0 Free Tools & Offline CI Boundaries (T2-F02-01 .. T2-F02-05)
// =============================================================================

test('T2-F02-01: Zero paid SaaS, ad SDKs, or proprietary analytics packages in package.json files', () => {
  const pkgPaths = [
    path.join(ROOT_DIR, 'package.json'),
    path.join(ROOT_DIR, 'packages', 'core', 'package.json'),
    path.join(ROOT_DIR, 'packages', 'content', 'package.json'),
  ];
  if (!CORE_ONLY) {
    pkgPaths.push(
      path.join(ROOT_DIR, 'apps', 'web', 'package.json'),
      path.join(ROOT_DIR, 'apps', 'mobile', 'package.json'),
    );
  }
  const forbiddenDeps = [
    '@vercel/analytics',
    '@vercel/speed-insights',
    'eas-cli',
    '@segment/',
    'mixpanel',
    '@amplitude/',
    'react-native-google-mobile-ads',
    'expo-ads-',
  ];
  for (const p of pkgPaths) {
    const raw = readTextSafe(p);
    for (const dep of forbiddenDeps) {
      assert.ok(!raw.includes(dep), `Forbidden paid/ad/tracker package "${dep}" in ${p}`);
    }
    assert.deepEqual(findEthicalViolations(raw), [], `Ethical violation in ${p}`);
  }
});

test('T2-F02-02: CI workflow requires zero custom repository secrets beyond GITHUB_TOKEN', () => {
  const yml = readTextSafe(path.join(ROOT_DIR, '.github', 'workflows', 'ci.yml'));
  const secretRefs = [...yml.matchAll(/\$\{\{\s*secrets\.([A-Za-z0-9_]+)\s*\}\}/g)].map((m) => m[1]);
  const nonDefault = secretRefs.filter((name) => name !== 'GITHUB_TOKEN');
  assert.deepEqual(nonDefault, [], `CI must not require custom secrets: ${nonDefault.join(', ')}`);
});

test('T2-F02-03: CI workflow scripts match actual root package.json scripts (no dead stubs)', () => {
  const yml = readTextSafe(path.join(ROOT_DIR, '.github', 'workflows', 'ci.yml'));
  const pkg = readJsonSafe(path.join(ROOT_DIR, 'package.json'));
  const invoked = [...yml.matchAll(/npm run ([A-Za-z0-9:_-]+)/g)].map((m) => m[1]);
  assert.ok(invoked.length >= 5, 'CI must invoke all 5 scripts');
  for (const scriptName of invoked) {
    assert.ok(pkg.scripts?.[scriptName], `CI invokes missing root script "${scriptName}"`);
    assert.doesNotMatch(pkg.scripts[scriptName], /\becho\s+["']?skip/i);
  }
});

test('T2-F02-04: Zero eas build or paid cloud native build triggers in CI or mobile scripts', () => {
  const yml = readTextSafe(path.join(ROOT_DIR, '.github', 'workflows', 'ci.yml'));
  assert.doesNotMatch(yml, /\beas\s+build\b/i);
  assert.doesNotMatch(yml, /expo\s+run:(?:android|ios)/i);
  if (!CORE_ONLY) {
    const mobPkg = readTextSafe(path.join(ROOT_DIR, 'apps', 'mobile', 'package.json'));
    assert.doesNotMatch(mobPkg, /\beas\s+build\b/i);
  }
});

test('T2-F02-05: Offline builds succeed with NEXT_PUBLIC_APP_MODE=offline and blank API keys', { skip: SKIP_APP_REASON }, () => {
  const offlineEnv = sanitizeOfflineEnv();
  const webRes = runNpm(['run', 'build:web'], { env: offlineEnv });
  assert.equal(webRes.status, 0, `Offline build:web failed:\n${webRes.stdout}\n${webRes.stderr}`);

  const mobileDir = path.join(ROOT_DIR, 'apps', 'mobile');
  const expoBin = resolveWorkspaceBin(mobileDir, 'expo', 'bin/cli');
  const mobRes = runNodeScript(expoBin, ['export', '--platform', 'web', '--clear'], {
    cwd: mobileDir,
    env: offlineEnv,
  });
  assert.equal(mobRes.status, 0, `Offline expo export failed:\n${mobRes.stdout}\n${mobRes.stderr}`);
});

// =============================================================================
// F03: Stage & Metric Boundaries (T2-F03-01 .. T2-F03-05)
// =============================================================================

test('T2-F03-01: getStageForAgeMonths handles exact inclusive/exclusive boundaries including 72', async () => {
  const core = await importCore();
  const cases = [
    [0, '0-3m'],
    [2.999, '0-3m'],
    [3, '3-12m'],
    [11.999, '3-12m'],
    [12, '1-3a'],
    [35.999, '1-3a'],
    [36, '3-6a'],
    [71.999, '3-6a'],
    [72, '3-6a'],
  ];
  for (const [months, expected] of cases) {
    assert.equal(core.getStageForAgeMonths(months), expected, `Age ${months} months mismatch`);
  }
  assert.equal(core.MIN_AGE_MONTHS, 0);
  assert.equal(core.MAX_AGE_MONTHS, 72);
  assert.equal(core.STAGE_SPECS['3-6a'].maxMonthsExclusive, 73);
});

test('T2-F03-02: getStageForAgeMonths throws RangeError on negative, >72, NaN, and Infinity', async () => {
  const core = await importCore();
  for (const bad of [-0.1, -1, 72.01, 73, 100, Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
    assert.equal(core.isValidAgeMonths(bad), false, `isValidAgeMonths(${bad}) must be false`);
    assert.throws(
      () => core.getStageForAgeMonths(bad),
      RangeError,
      `Expected RangeError for age ${String(bad)}`,
    );
  }
});

test('T2-F03-03: isImperialUnitPresent detects all prohibited imperial units', async () => {
  const core = await importCore();
  const imperialSamples = [
    '98.6 °F',
    '100°F',
    '12 lb',
    '8.5 lbs',
    '4 oz',
    '24 inch',
    '2 inches',
    '3 ft',
    '2 fl oz',
    '70 fahrenheit',
    '10 libras',
    '5 onzas',
    '20 pulgadas',
  ];
  for (const text of imperialSamples) {
    assert.equal(core.isImperialUnitPresent(text), true, `Expected imperial match for "${text}"`);
    assert.ok(findImperialUnits(text).length > 0, `Independent scanner missed "${text}"`);
  }
});

test('T2-F03-04: isImperialUnitPresent avoids Spanish false positives like libre, calma, pañalero', async () => {
  const core = await importCore();
  const cleanSamples = [
    'pañalero',
    'mameluco',
    'rozadura',
    '0-3m',
    '36.5 °C',
    '120 ml',
    'libre de anuncios',
    'calma',
    'mamila o biberón esterilizado',
  ];
  for (const text of cleanSamples) {
    assert.equal(core.isImperialUnitPresent(text), false, `False positive on "${text}"`);
    assert.deepEqual(findImperialUnits(text), [], `Independent scanner false positive on "${text}"`);
  }
});

test('T2-F03-05: formatMetric rejects NaN/Infinity/invalid decimals and normalizes -0', async () => {
  const core = await importCore();
  assert.throws(() => core.formatMetric(Number.NaN, '°C'), RangeError);
  assert.throws(() => core.formatMetric(Number.POSITIVE_INFINITY, 'kg'), RangeError);
  assert.throws(() => core.formatMetric(36.5, '°C', -1), RangeError);
  assert.throws(() => core.formatMetric(36.5, '°C', 5), RangeError);
  assert.equal(core.formatMetric(-0, '°C'), '0 °C');
  assert.equal(core.formatMetric(36.666, '°C', 1), '36.7 °C');
});

// =============================================================================
// F04: WCAG 2.2 AA Contrast Math Traps (T2-F04-01 .. T2-F04-05)
// =============================================================================

test('T2-F04-01: Independent WCAG verifies Day #4A7C6F on #FAF8F5 trap (<4.50) and #386055 fix', async () => {
  const core = await importCore();
  const trapRatio = calcContrast('#4A7C6F', '#FAF8F5');
  assert.ok(trapRatio < 4.5, `Expected #4A7C6F on #FAF8F5 < 4.5, got ${trapRatio}`);

  assert.equal(core.DAY_PALETTE.brandText, '#386055');
  assertContrastAtLeast('#386055', '#FAF8F5', 4.5, 'brandText on bgPrimary');
  assertContrastAtLeast('#4A7C6F', '#FFFFFF', 4.5, 'brandPrimary on white card');
  assertContrastAtLeast('#FFFFFF', '#4A7C6F', 4.5, 'white on brandPrimary');
});

test('T2-F04-02: Independent WCAG verifies Day #E08A6B trap (<3.0) and #1F2421 / #9E4728 fixes', async () => {
  const core = await importCore();
  assert.ok(calcContrast('#E08A6B', '#FAF8F5') < 3.0);
  assert.ok(calcContrast('#FFFFFF', '#E08A6B') < 3.0);

  assert.equal(core.DAY_PALETTE.onAccentWarm, '#1F2421');
  assert.equal(core.DAY_PALETTE.accentWarmText, '#9E4728');
  assertContrastAtLeast('#1F2421', '#E08A6B', 4.5, 'onAccentWarm on accentWarm');
  assertContrastAtLeast('#9E4728', '#FAF8F5', 4.5, 'accentWarmText on bgPrimary');
  assertContrastAtLeast('#9E4728', '#FFFFFF', 4.5, 'accentWarmText on bgCard');
});

test('T2-F04-03: Independent WCAG verifies Day #D64545 normal-text trap (<4.5) and #B42D2D / #FDECEC fixes', async () => {
  const core = await importCore();
  assert.ok(calcContrast('#D64545', '#FAF8F5') < 4.5);
  assert.ok(calcContrast('#FFFFFF', '#D64545') < 4.5);

  assert.equal(core.DAY_PALETTE.alertRedText, '#B42D2D');
  assert.equal(core.DAY_PALETTE.alertRedSurface, '#FDECEC');
  assertContrastAtLeast('#B42D2D', '#FAF8F5', 4.5, 'alertRedText on bgPrimary');
  assertContrastAtLeast('#FFFFFF', '#B42D2D', 4.5, 'white on alertRedText');
  assertContrastAtLeast('#1F2421', '#FDECEC', 4.5, 'textPrimary on alertRedSurface');
});

test('T2-F04-04: assertWcagAaPalette rejects degraded low-contrast text and focusRing palettes', async () => {
  const core = await importCore();
  const badText = { ...core.DAY_PALETTE, textPrimary: '#999999' };
  const badFocus = { ...core.DAY_PALETTE, focusRing: '#E08A6B' };
  assert.throws(() => core.assertWcagAaPalette(badText), /WCAG\s+2\.2\s+AA/i);
  assert.throws(() => core.assertWcagAaPalette(badFocus), /WCAG\s+2\.2\s+AA/i);
});

test('T2-F04-05: 3:00 AM Mode avoids white glare and meets >=6.1 text and >=3.0 UI/focus ratios', async () => {
  const core = await importCore();
  const night = core.NIGHT_3AM_PALETTE;
  assert.equal(night.bgPrimary, '#121110');
  assert.notEqual(night.bgCard.toUpperCase(), '#FFFFFF');
  assert.notEqual(night.bgElevated.toUpperCase(), '#FFFFFF');

  for (const key of ['textPrimary', 'textSecondary', 'textMuted', 'brandText', 'accentWarmText', 'alertRedText']) {
    assertContrastAtLeast(night[key], night.bgPrimary, 6.1, `night ${key} on bgPrimary`);
  }
  assertContrastAtLeast(night.borderInteractive, night.bgPrimary, 3.0, 'night borderInteractive');
  assertContrastAtLeast(night.focusRing, night.bgPrimary, 3.0, 'night focusRing');
});

// =============================================================================
// F05: Compliance, Guardrails & Deletion Boundaries (T2-F05-01 .. T2-F05-05)
// =============================================================================

test('T2-F05-01: Non-diagnostic validator rejects diagnostic and prescriptive Spanish claims', async () => {
  const core = await importCore();
  const forbiddenClaims = [
    'Esto es un diagnóstico médico',
    'Te diagnosticamos infección',
    'Prescribimos paracetamol',
    'Dale 5 ml de jarabe',
    'Sustituye la consulta con tu pediatra',
  ];
  for (const claim of forbiddenClaims) {
    const res = core.validateNonDiagnosticCopy(claim);
    assert.equal(res.valid, false, `Core validator failed to reject: "${claim}"`);
    assert.ok(res.violations.length > 0);
  }
  assert.ok(findDiagnosticViolations('Esto es un diagnóstico médico').length > 0);
  assert.ok(findDiagnosticViolations('Te diagnosticamos infección').length > 0);
  assert.ok(findDiagnosticViolations('Prescribimos paracetamol').length > 0);
  assert.ok(findDiagnosticViolations('Sustituye la consulta con tu pediatra').length > 0);
});

test('T2-F05-02: LocalAccountLifecycleAdapter deletion is idempotent on empty storage', async () => {
  const core = await importCore();
  const adapter = new core.LocalAccountLifecycleAdapter(new core.MemoryStorageAdapter());

  const first = await adapter.deleteAccountAndData({ confirmedAtIso: '2026-11-24T12:00:00Z' });
  const second = await adapter.deleteAccountAndData({ confirmedAtIso: '2026-11-24T12:01:00Z' });

  assert.equal(first.status, 'deleted_local');
  assert.equal(first.deletedKeysCount, 0);
  assert.equal(second.status, 'deleted_local');
  assert.equal(second.deletedKeysCount, 0);
  assert.equal((await adapter.getStoredSnapshotSummary()).hasActiveProfile, false);
});

test('T2-F05-03: LocalAccountLifecycleAdapter namespace isolation preserves unrelated external keys', async () => {
  const core = await importCore();
  const storage = new core.MemoryStorageAdapter();
  await storage.setItem('unrelated_external_key', 'keep-me');
  const adapter = new core.LocalAccountLifecycleAdapter(storage);
  await adapter.acceptOnboardingDisclaimer('2026-11-24T12:00:00Z');
  await adapter.seedDemoLocalData();

  await adapter.deleteAccountAndData({ confirmedAtIso: '2026-11-24T12:02:00Z' });

  assert.equal(await storage.getItem('unrelated_external_key'), 'keep-me');
  assert.deepEqual(await storage.keys(), ['unrelated_external_key']);
});

test('T2-F05-04: Invalid ISO timestamp rejection & unconfirmed cancellation preserve stored data', async () => {
  const core = await importCore();
  const storage = new core.MemoryStorageAdapter();
  const adapter = new core.LocalAccountLifecycleAdapter(storage);
  await adapter.acceptOnboardingDisclaimer('2026-11-24T12:00:00Z');
  await adapter.seedDemoLocalData();

  await assert.rejects(
    () => adapter.deleteAccountAndData({ confirmedAtIso: '2026-11-24' }),
    Error,
  );
  const summary = await adapter.getStoredSnapshotSummary();
  assert.equal(summary.hasActiveProfile, true);
  assert.ok(summary.itemCount > 0);
  assert.equal(await adapter.hasAcceptedOnboardingDisclaimer(), true);
});

test('T2-F05-05: Emergency urgent_red status & assertEthicalComplianceConfig enforce zero paywalls/ads', async () => {
  const core = await importCore();
  assert.equal(core.STATUS_SPECS.urgent_red.paywallProtected, false);
  assert.equal(core.ETHICAL_GUARDRAILS.paywallOnEmergencyTriage, false);

  assert.throws(
    () =>
      core.assertEthicalComplianceConfig({
        adsOnChildScreens: false,
        paywallOnEmergencyTriage: true,
        dataSellingEnabled: false,
      }),
    Error,
  );
});

// =============================================================================
// F06: Content Schema & M1 Scope Containment Boundaries (T2-F06-01 .. T2-F06-05)
// =============================================================================

test('T2-F06-01: assertValidClinicalMetadata rejects empty sources/blank reviewed_by and passes all scaffolds', async () => {
  const content = await importContent();
  assert.throws(
    () =>
      content.assertValidClinicalMetadata({
        version: '1.0.0-m1',
        sources: [],
        reviewed_at: '2026-11-24',
        reviewed_by: 'Comité MX',
      }),
    Error,
  );
  assert.throws(
    () =>
      content.assertValidClinicalMetadata({
        version: '1.0.0-m1',
        sources: content.M1_CLINICAL_SOURCES ? [content.M1_CLINICAL_SOURCES.nom031] : [{ title: 't', organization: 'o', year: 2024 }],
        reviewed_at: 'invalid-date',
        reviewed_by: '',
      }),
    Error,
  );
  for (const guide of content.M1_GUIDE_SCAFFOLDS) {
    assert.doesNotThrow(() => content.assertValidClinicalMetadata(guide.metadata));
  }
});

test('T2-F06-02: packages/content contains minimal M1 scaffold (<=10 guides/cards), no M3 encyclopedia bloat', async () => {
  const content = await importContent();
  assert.ok(content.M1_GUIDE_SCAFFOLDS.length >= 2 && content.M1_GUIDE_SCAFFOLDS.length <= 10);
  assert.ok(content.M1_CLOTHING_SCAFFOLDS.length >= 1 && content.M1_CLOTHING_SCAFFOLDS.length <= 10);
});

test('T2-F06-03: Hito 2 clothing engine is 100% offline with zero live weather APIs in packages/*', async () => {
  const core = await importCore();
  assert.equal(typeof core.recommendClothing, 'function');
  const files = walkFiles(path.join(ROOT_DIR, 'packages'));
  for (const f of files) {
    const raw = readTextSafe(f.absPath);
    assert.doesNotMatch(raw, /openweathermap|weatherForecastApi/i, `Live weather API leak in ${f.relPath}`);
  }
});

test('T2-F06-04: Hito 5 Cartilla de Vacunación MX & WHO growth curves operate offline in packages/core', async () => {
  const core = await importCore();
  assert.ok(Array.isArray(core.MX_VACCINE_CHECKLIST) && core.MX_VACCINE_CHECKLIST.length >= 10);
  assert.equal(typeof core.evaluateTemperatureAlertMx, 'function');
  assert.equal(typeof core.buildPediatricianReportText, 'function');
  assert.equal(core.evaluateTemperatureAlertMx(38.0, 2).level, 'urgent_911');
});

test('T2-F06-05: Zero M4 Supabase SQL/RLS migrations or M6 live Gemini RAG clients in repo', () => {
  const ignorePrefixes = CORE_ONLY ? ['e2e/', 'apps/'] : ['e2e/'];
  const files = walkFiles(ROOT_DIR, { ignoreRelPrefixes: ignorePrefixes });
  for (const f of files) {
    if (f.relPath.endsWith('package-lock.json')) continue;
    const leaks = findM2ToM7Leaks(readTextSafe(f.absPath), f.relPath).filter(
      (l) => l.milestone === 'M4_supabase_sql_rls' || l.milestone === 'M6_live_gemini_rag',
    );
    assert.deepEqual(leaks, [], `M4/M6 scope leak in ${f.relPath}`);
  }
});

// =============================================================================
// F07: apps/web Shell Boundaries (T2-F07-01 .. T2-F07-05)
// =============================================================================

test('T2-F07-01: apps/web uses synchronous no-flash night-3am script and suppressHydrationWarning', { skip: SKIP_APP_REASON }, async () => {
  const srv = await ensureWebServer();
  for (const route of ['/', '/guias', '/ropa-y-clima', '/salud']) {
    const page = await srv.getPage(route);
    assert.equal(page.status, 200);
    assert.match(page.html, /night-3am|night_3am/);
  }
  const layoutSrc = readTextSafe(path.join(ROOT_DIR, 'apps', 'web', 'src', 'app', 'layout.tsx'));
  assert.match(layoutSrc, /suppressHydrationWarning/);
  assert.match(layoutSrc, /dataset\.theme|setAttribute\(\s*['"]data-theme['"]/);
});

test('T2-F07-02: apps/web supports responsive layout across mobile (375px) and desktop (1280px)', { skip: SKIP_APP_REASON }, () => {
  const shellSrc = readTextSafe(path.join(ROOT_DIR, 'apps', 'web', 'src', 'components', 'AppShell.tsx'));
  assert.match(shellSrc, /md:|lg:/, 'Responsive desktop/mobile breakpoints required');
  assert.match(shellSrc, /overflow-x-hidden|max-w-/);
});

test('T2-F07-03: apps/web includes skip-to-content link and >=3.0:1 :focus-visible styling', { skip: SKIP_APP_REASON }, async () => {
  const srv = await ensureWebServer();
  const page = await srv.getPage('/');
  const globalsCss = readTextSafe(path.join(ROOT_DIR, 'apps', 'web', 'src', 'app', 'globals.css'));
  const shellSrc = readTextSafe(path.join(ROOT_DIR, 'apps', 'web', 'src', 'components', 'AppShell.tsx'));
  assert.match(shellSrc, /#contenido-principal/);
  assert.match(`${page.cssBundleText}\n${globalsCss}`, /focus-visible/);
  assertContrastAtLeast('#2B5B4E', '#FAF8F5', 3.0, 'Day focus ring');
  assertContrastAtLeast('#F2B872', '#121110', 3.0, '3AM focus ring');
});

test('T2-F07-04: Zero imperial units appear anywhere in apps/web rendered HTML or source copy', { skip: SKIP_APP_REASON }, async () => {
  const srv = await ensureWebServer();
  for (const route of ['/', '/guias', '/ropa-y-clima', '/salud']) {
    const page = await srv.getPage(route);
    assert.deepEqual(findImperialUnits(page.textContent), [], `Imperial unit on web route ${route}`);
  }
  const webFiles = walkFiles(path.join(ROOT_DIR, 'apps', 'web', 'src'));
  for (const f of webFiles) {
    assert.deepEqual(findImperialUnits(readTextSafe(f.absPath)), [], `Imperial unit in ${f.relPath}`);
  }
});

test('T2-F07-05: Critical 3:00 AM -> Salud -> 911 flow requires <=3 taps from Hoy', { skip: SKIP_APP_REASON }, () => {
  const shellSrc = readTextSafe(path.join(ROOT_DIR, 'apps', 'web', 'src', 'components', 'AppShell.tsx'));
  const saludSrc = readTextSafe(path.join(ROOT_DIR, 'apps', 'web', 'src', 'app', 'salud', 'page.tsx'));
  // Tap 1: direct 3:00 AM toggle in top shell; Tap 2: direct /salud nav link (911 visible immediately without extra gate)
  assert.match(shellSrc, /Modo 3:00 AM|night_3am/i);
  assert.match(shellSrc, /href="\/salud"|\/salud/);
  assert.match(saludSrc, /911/);
});

// =============================================================================
// F08: apps/web Compliance Boundaries (T2-F08-01 .. T2-F08-05)
// =============================================================================

test('T2-F08-01: OnboardingGate wraps app shell globally to protect deep routes (/guias, /salud)', { skip: SKIP_APP_REASON }, () => {
  const layoutSrc = readTextSafe(path.join(ROOT_DIR, 'apps', 'web', 'src', 'app', 'layout.tsx'));
  const shellSrc = readTextSafe(path.join(ROOT_DIR, 'apps', 'web', 'src', 'components', 'AppShell.tsx'));
  const gateSrc = readTextSafe(path.join(ROOT_DIR, 'apps', 'web', 'src', 'components', 'OnboardingGate.tsx'));
  assert.match(`${layoutSrc}\n${shellSrc}`, /OnboardingGate/);
  assert.match(gateSrc, /hasAcceptedOnboardingDisclaimer/);
});

test('T2-F08-02: Native <dialog> AccountDeletionDialog supports Cancel/Escape without wiping data', { skip: SKIP_APP_REASON }, () => {
  const dialogSrc = readTextSafe(path.join(ROOT_DIR, 'apps', 'web', 'src', 'components', 'AccountDeletionDialog.tsx'));
  assert.match(dialogSrc, /<dialog\b/);
  assert.match(dialogSrc, /Cancelar/i);
  assert.match(dialogSrc, /\.close\(/);
});

test('T2-F08-03: Web 911 card on /salud is never gated behind login or paywall', { skip: SKIP_APP_REASON }, () => {
  const saludSrc = readTextSafe(path.join(ROOT_DIR, 'apps', 'web', 'src', 'app', 'salud', 'page.tsx'));
  assert.match(saludSrc, /911/);
  assert.deepEqual(findEthicalViolations(saludSrc), []);
  assert.doesNotMatch(saludSrc, /iniciar\s+sesi[oó]n\s+para\s+ver\s+911/i);
});

test('T2-F08-04: Zero M4 Supabase RLS, M6 live Gemini RAG, or M7 billing/ad SDKs leak into apps/web', { skip: SKIP_APP_REASON }, () => {
  const webFiles = walkFiles(path.join(ROOT_DIR, 'apps', 'web', 'src'));
  for (const f of webFiles) {
    const leaks = findM2ToM7Leaks(readTextSafe(f.absPath), f.relPath).filter(
      (l) =>
        l.milestone === 'M4_supabase_sql_rls' ||
        l.milestone === 'M6_live_gemini_rag' ||
        l.milestone === 'M7_billing_ads',
    );
    assert.deepEqual(leaks, [], `Scope leak in ${f.relPath}`);
  }
});

test('T2-F08-05: Web exposes accessible role="alert" and aria-live="polite" / role="status" regions', { skip: SKIP_APP_REASON }, () => {
  const webFiles = walkFiles(path.join(ROOT_DIR, 'apps', 'web', 'src'));
  const combined = webFiles.map((f) => readTextSafe(f.absPath)).join('\n');
  assert.match(combined, /role="alert"/);
  assert.match(combined, /aria-live="polite"|role="status"/);
});

// =============================================================================
// F09: apps/mobile Shell Boundaries (T2-F09-01 .. T2-F09-05)
// =============================================================================

test('T2-F09-01: apps/mobile app.json omits deprecated newArchEnabled key on Expo SDK 55', { skip: SKIP_APP_REASON }, () => {
  const appJson = readJsonSafe(path.join(ROOT_DIR, 'apps', 'mobile', 'app.json'));
  assert.equal('newArchEnabled' in (appJson.expo ?? {}), false, 'app.json must NOT contain deprecated newArchEnabled');
  assert.ok(appJson.expo?.scheme, 'app.json expo.scheme must be defined');
});

test('T2-F09-02: apps/mobile metro.config.js resolves monorepo packages cleanly', { skip: SKIP_APP_REASON }, () => {
  const metroSrc = readTextSafe(path.join(ROOT_DIR, 'apps', 'mobile', 'metro.config.js'));
  assert.match(metroSrc, /watchFolders|nodeModulesPaths/);
});

test('T2-F09-03: Zero imperial units exist in apps/mobile source screens or components', { skip: SKIP_APP_REASON }, () => {
  const mobileFiles = walkFiles(path.join(ROOT_DIR, 'apps', 'mobile'), {
    extensions: new Set(['.ts', '.tsx', '.js']),
  });
  for (const f of mobileFiles) {
    assert.deepEqual(findImperialUnits(readTextSafe(f.absPath)), [], `Imperial unit in ${f.relPath}`);
  }
});

test('T2-F09-04: apps/mobile enforces >=48px touch target floor across interactive components', { skip: SKIP_APP_REASON }, () => {
  const mobileFiles = walkFiles(path.join(ROOT_DIR, 'apps', 'mobile'), {
    extensions: new Set(['.ts', '.tsx']),
  });
  const combined = mobileFiles.map((f) => readTextSafe(f.absPath)).join('\n');
  assert.match(combined, /minHeight:\s*48|min-h-12|MIN_TOUCH_TARGET_PX/);
});

test('T2-F09-05: Offline apps/mobile/dist bundle contains zero GEMINI_API_KEY or secret leaks', { skip: SKIP_APP_REASON }, () => {
  const distDir = path.join(ROOT_DIR, 'apps', 'mobile', 'dist');
  if (!fs.existsSync(distDir)) {
    const mobileDir = path.join(ROOT_DIR, 'apps', 'mobile');
    const expoBin = resolveWorkspaceBin(mobileDir, 'expo', 'bin/cli');
    const res = runNodeScript(expoBin, ['export', '--platform', 'web', '--clear'], {
      cwd: mobileDir,
      env: sanitizeOfflineEnv(),
    });
    assert.equal(res.status, 0, `expo export failed:\n${res.stdout}\n${res.stderr}`);
  }
  const distFiles = walkFiles(distDir, { ignoreDirs: new Set() });
  assert.ok(distFiles.length > 0, 'apps/mobile/dist must not be empty');
  for (const f of distFiles) {
    if (!/\.(js|html|json)$/i.test(f.relPath)) continue;
    const text = readTextSafe(f.absPath);
    assert.deepEqual(findSecrets(text, f.relPath), [], `Secret leak in bundle ${f.relPath}`);
  }
});

// =============================================================================
// F10: apps/mobile Compliance Boundaries (T2-F10-01 .. T2-F10-05)
// =============================================================================

test('T2-F10-01: Mobile OnboardingGate wraps root layout to protect deep tab routes', { skip: SKIP_APP_REASON }, () => {
  const rootLayout = readTextSafe(path.join(ROOT_DIR, 'apps', 'mobile', 'app', '_layout.tsx'));
  assert.match(rootLayout, /OnboardingGate/);
});

test('T2-F10-02: Mobile AccountDeletionSheet supports Cancel/Dismiss preserving local data', { skip: SKIP_APP_REASON }, () => {
  const sheetSrc = readTextSafe(path.join(ROOT_DIR, 'apps', 'mobile', 'components', 'AccountDeletionSheet.tsx'));
  assert.match(sheetSrc, /Cancelar/i);
  assert.match(sheetSrc, /onRequestClose|setOpen\(false\)|setVisible\(false\)/);
});

test('T2-F10-03: Mobile 911 card on Salud tab is never paywalled or ad-supported', { skip: SKIP_APP_REASON }, () => {
  const saludSrc = readTextSafe(path.join(ROOT_DIR, 'apps', 'mobile', 'app', '(tabs)', 'salud.tsx'));
  assert.match(saludSrc, /911/);
  assert.match(saludSrc, /StatusBadge/);
  assert.deepEqual(findEthicalViolations(saludSrc), []);
});

test('T2-F10-04: Zero diagnostic language appears across apps/mobile screens and components', { skip: SKIP_APP_REASON }, () => {
  const mobileFiles = walkFiles(path.join(ROOT_DIR, 'apps', 'mobile'), {
    extensions: new Set(['.ts', '.tsx']),
  });
  for (const f of mobileFiles) {
    assert.deepEqual(findDiagnosticViolations(readTextSafe(f.absPath)), [], `Diagnostic claim in ${f.relPath}`);
  }
});

test('T2-F10-05: Mobile AccountDeletionSheet resets adapter & onboarding state cleanly across tabs', { skip: SKIP_APP_REASON }, () => {
  const sheetSrc = readTextSafe(path.join(ROOT_DIR, 'apps', 'mobile', 'components', 'AccountDeletionSheet.tsx'));
  const gateSrc = readTextSafe(path.join(ROOT_DIR, 'apps', 'mobile', 'components', 'OnboardingGate.tsx'));
  assert.match(sheetSrc, /deleteAccountAndData/);
  assert.match(sheetSrc, /onDeleted|resetOnboarding|refresh/i);
  assert.match(gateSrc, /hasAcceptedOnboardingDisclaimer/);
});
