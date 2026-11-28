import './helpers/ts-hooks.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { after, test } from 'node:test';
import { CORE_ONLY, ROOT_DIR, readJsonSafe, readTextSafe, walkFiles } from './helpers/paths.mjs';
import {
  killProcessTree,
  resolveWorkspaceBin,
  runGit,
  runNodeScript,
  runNpm,
  sanitizeOfflineEnv,
} from './helpers/proc.mjs';
import { findDiagnosticViolations, findEthicalViolations, findImperialUnits } from './helpers/scanners.mjs';
import { importContent, importCore } from './helpers/ts-hooks.mjs';
import { assertContrastAtLeast, calcContrast } from './helpers/wcag.mjs';
import { startWebServer } from './helpers/web-server.mjs';

const SKIP_APP_REASON = CORE_ONLY
  ? 'Deferred under E2E_CORE_ONLY=1 while M2 (apps/web) and M3 (apps/mobile) are in-flight'
  : false;

function parseEnvLines(text) {
  const map = new Map();
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eqIdx = line.indexOf('=');
    if (eqIdx === -1) continue;
    map.set(line.slice(0, eqIdx).trim(), line.slice(eqIdx + 1).trim());
  }
  return map;
}

// =============================================================================
// F01: Monorepo Root & Git Reconciliation (T1-F01-01 .. T1-F01-05)
// =============================================================================

test('T1-F01-01: Workspace directory layout & root config files exist', () => {
  const requiredDirs = [
    'apps/mobile',
    'apps/web',
    'packages/core',
    'packages/content',
    '.github/workflows',
  ];
  for (const rel of requiredDirs) {
    const full = path.join(ROOT_DIR, rel);
    assert.ok(fs.existsSync(full) && fs.statSync(full).isDirectory(), `Missing directory: ${rel}`);
  }

  const requiredFiles = [
    'package.json',
    'tsconfig.base.json',
    'eslint.config.mjs',
    'vitest.config.ts',
    '.gitignore',
    '.env.example',
  ];
  for (const rel of requiredFiles) {
    const full = path.join(ROOT_DIR, rel);
    assert.ok(fs.existsSync(full) && fs.statSync(full).isFile(), `Missing root file: ${rel}`);
  }
});

test('T1-F01-02: Root package.json configures npm workspaces and React 19 overrides', () => {
  const pkg = readJsonSafe(path.join(ROOT_DIR, 'package.json'));
  assert.ok(Array.isArray(pkg.workspaces), 'package.json workspaces must be an array');
  assert.ok(pkg.workspaces.includes('apps/*'), 'workspaces must include apps/*');
  assert.ok(pkg.workspaces.includes('packages/*'), 'workspaces must include packages/*');

  assert.match(String(pkg.overrides?.react ?? ''), /^19\./, 'overrides.react must pin React 19.x');
  assert.match(String(pkg.overrides?.['react-dom'] ?? ''), /^19\./, 'overrides.react-dom must pin React 19.x');

  if (!CORE_ONLY) {
    const res = runNpm(['ls', '--depth=0']);
    assert.equal(res.status, 0, `npm ls --depth=0 failed:\n${res.stdout}\n${res.stderr}`);
  }
});

test('T1-F01-03: .env.example enforces offline local defaults and blank secrets', () => {
  const envPath = path.join(ROOT_DIR, '.env.example');
  assert.ok(fs.existsSync(envPath), '.env.example must exist');
  const vars = parseEnvLines(readTextSafe(envPath));

  assert.equal(vars.get('APP_ENV'), 'local');
  assert.equal(vars.get('NEXT_PUBLIC_APP_MODE'), 'offline');
  assert.equal(vars.get('EXPO_PUBLIC_APP_MODE'), 'offline');
  assert.equal(vars.get('BABY_BUDDY_AI_ENABLED'), 'false');

  for (const secretKey of [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'EXPO_PUBLIC_SUPABASE_URL',
    'EXPO_PUBLIC_SUPABASE_ANON_KEY',
    'GEMINI_API_KEY',
  ]) {
    assert.equal(vars.get(secretKey), '', `${secretKey} must be blank in .env.example`);
  }
});

test('T1-F01-04: .gitignore excludes build artifacts and .env secrets while keeping .env.example', () => {
  const gitignore = readTextSafe(path.join(ROOT_DIR, '.gitignore'));
  for (const token of [
    'node_modules',
    '.next',
    '.expo',
    'dist',
    'coverage',
    '.env',
    '.env.local',
    '.env.*.local',
    '!.env.example',
  ]) {
    assert.ok(gitignore.includes(token), `.gitignore missing required entry "${token}"`);
  }
});

test('T1-F01-05: Git remote origin points to HUGOxBOSSx/Baby-buddy and preserves ancestor 9c1d585', () => {
  const remoteRes = runGit(['remote', 'get-url', 'origin']);
  assert.equal(remoteRes.status, 0, `git remote get-url origin failed: ${remoteRes.stderr}`);
  const originUrl = remoteRes.stdout.trim();
  assert.match(
    originUrl,
    /^https:\/\/github\.com\/HUGOxBOSSx\/Baby-buddy(?:\.git)?$/,
    `Unexpected origin URL: ${originUrl}`,
  );

  const revListRes = runGit(['rev-list', '--all']);
  assert.equal(revListRes.status, 0, `git rev-list --all failed: ${revListRes.stderr}`);
  assert.ok(
    revListRes.stdout.includes('9c1d585ad76cc5bf8d06353f20d557155b1af921'),
    'Initial remote commit 9c1d585ad76cc5bf8d06353f20d557155b1af921 must be preserved in Git history',
  );
});

// =============================================================================
// F02: Free GitHub Actions CI & $0 Tooling (T1-F02-01 .. T1-F02-05)
// =============================================================================

test('T1-F02-01: .github/workflows/ci.yml uses free ubuntu-latest, Node 24, and npm ci', () => {
  const ciPath = path.join(ROOT_DIR, '.github', 'workflows', 'ci.yml');
  assert.ok(fs.existsSync(ciPath), '.github/workflows/ci.yml must exist');
  const yml = readTextSafe(ciPath);
  assert.match(yml, /\bpush:/);
  assert.match(yml, /\bpull_request:/);
  assert.match(yml, /\bmain\b/);
  assert.match(yml, /runs-on:\s*ubuntu-latest/);
  assert.match(yml, /actions\/checkout@v4/);
  assert.match(yml, /actions\/setup-node@v4/);
  assert.match(yml, /node-version:\s*["']?24["']?/);
  assert.match(yml, /\bnpm ci\b/);
});

test('T1-F02-02: CI workflow runs typecheck, lint, and Vitest test gates', () => {
  const yml = readTextSafe(path.join(ROOT_DIR, '.github', 'workflows', 'ci.yml'));
  const pkg = readJsonSafe(path.join(ROOT_DIR, 'package.json'));

  assert.match(yml, /npm run typecheck/);
  assert.match(yml, /npm run lint/);
  assert.match(yml, /npm run test/);
  assert.ok(pkg.scripts?.typecheck, 'root package.json missing typecheck script');
  assert.ok(pkg.scripts?.lint, 'root package.json missing lint script');
  assert.match(String(pkg.scripts?.test ?? ''), /vitest/, 'root test script must invoke vitest');
});

test('T1-F02-03: CI workflow defines web build and offline Expo export without EAS cloud login', () => {
  const yml = readTextSafe(path.join(ROOT_DIR, '.github', 'workflows', 'ci.yml'));
  const pkg = readJsonSafe(path.join(ROOT_DIR, 'package.json'));

  assert.match(yml, /npm run build:web/);
  assert.match(yml, /npm run export:mobile/);
  assert.match(yml, /EXPO_NO_TELEMETRY:\s*["']?1["']?/);
  assert.ok(!/\beas\s+build\b/i.test(yml), 'CI must NOT invoke paid/cloud EAS builds');
  assert.match(String(pkg.scripts?.['build:web'] ?? ''), /@baby-buddy\/web/);
  assert.match(String(pkg.scripts?.['export:mobile'] ?? ''), /@baby-buddy\/mobile/);
});

test('T1-F02-04: Local typecheck and lint pass cleanly', () => {
  const argsTypecheck = CORE_ONLY
    ? ['run', 'typecheck', '--workspace=@baby-buddy/core', '--workspace=@baby-buddy/content']
    : ['run', 'typecheck'];
  const argsLint = CORE_ONLY
    ? ['run', 'lint', '--workspace=@baby-buddy/core', '--workspace=@baby-buddy/content']
    : ['run', 'lint'];

  const tc = runNpm(argsTypecheck);
  assert.equal(tc.status, 0, `typecheck failed:\n${tc.stdout}\n${tc.stderr}`);

  const lint = runNpm(argsLint);
  assert.equal(lint.status, 0, `lint failed:\n${lint.stdout}\n${lint.stderr}`);
});

test('T1-F02-05: Local Vitest unit test suite passes cleanly', () => {
  const res = runNpm(['run', 'test']);
  assert.equal(res.status, 0, `Vitest failed:\n${res.stdout}\n${res.stderr}`);
  const cleanStdout = res.stdout.replace(/\x1B\[[0-9;]*m/g, '');
  assert.match(cleanStdout, /Test Files\s+\d+\s+passed/i);
  assert.doesNotMatch(cleanStdout, /\b[1-9]\d*\s+failed\b/i);
});

// =============================================================================
// F03: @baby-buddy/core Domain Stages & Metric Units (T1-F03-01 .. T1-F03-05)
// =============================================================================

test('T1-F03-01: STAGE_ORDER and STAGE_SPECS cover 0-3m, 3-12m, 1-3a, 3-6a in MX Spanish', async () => {
  const core = await importCore();
  assert.deepEqual(core.STAGE_ORDER, ['0-3m', '3-12m', '1-3a', '3-6a']);

  for (const id of core.STAGE_ORDER) {
    const spec = core.STAGE_SPECS[id];
    assert.ok(spec, `Missing STAGE_SPECS entry for ${id}`);
    assert.equal(spec.id, id);
    assert.ok(typeof spec.label === 'string' && spec.label.length > 0);
    assert.ok(typeof spec.shortLabel === 'string' && spec.shortLabel.length > 0);
    assert.equal(typeof spec.minMonths, 'number');
    assert.equal(typeof spec.maxMonthsExclusive, 'number');
    assert.ok(spec.maxMonthsExclusive > spec.minMonths);
    assert.ok(typeof spec.focusSummaryMx === 'string' && spec.focusSummaryMx.length > 10);
  }
});

test('T1-F03-02: getStageForAgeMonths maps representative ages 0, 6, 18, 48 accurately', async () => {
  const core = await importCore();
  assert.equal(core.getStageForAgeMonths(0), '0-3m');
  assert.equal(core.getStageForAgeMonths(6), '3-12m');
  assert.equal(core.getStageForAgeMonths(18), '1-3a');
  assert.equal(core.getStageForAgeMonths(48), '3-6a');
});

test('T1-F03-03: formatMetric and formatMeasurement format °C, kg, cm, ml cleanly', async () => {
  const core = await importCore();
  assert.equal(core.formatMetric(36.8, '°C'), '36.8 °C');
  assert.equal(core.formatMetric(7.4, 'kg'), '7.4 kg');
  assert.equal(core.formatMetric(68, 'cm'), '68 cm');
  assert.equal(core.formatMetric(120, 'ml'), '120 ml');
  assert.equal(core.formatMeasurement({ value: 37.5, unit: '°C' }), '37.5 °C');
});

test('T1-F03-04: isImperialUnitPresent returns false on clean Mexican Spanish metric copy', async () => {
  const core = await importCore();
  const sample = 'Temperatura normal 36.7 °C, toma 120 ml de mamila, peso 5.2 kg, talla 58 cm';
  assert.equal(core.isImperialUnitPresent(sample), false);
});

test('T1-F03-05: Child profile & AppPreferences domain contracts build valid es-MX metric summaries', async () => {
  const core = await importCore();
  assert.equal(core.DEFAULT_APP_PREFERENCES.themeMode, 'day');
  assert.equal(core.DEFAULT_APP_PREFERENCES.activeStageId, '0-3m');
  assert.equal(core.DEFAULT_APP_PREFERENCES.locale, 'es-MX');
  assert.equal(core.DEFAULT_APP_PREFERENCES.onboardingAcceptedAtIso, null);

  const profile = core.createChildProfileSummary({
    id: 'bebe-1',
    nicknameMx: 'Mateo',
    ageMonths: 8,
    nowIso: '2026-11-24T12:00:00Z',
  });
  assert.equal(profile.id, 'bebe-1');
  assert.equal(profile.nicknameMx, 'Mateo');
  assert.equal(profile.ageMonths, 8);
  assert.equal(profile.stageId, '3-12m');
  assert.equal(profile.createdAtIso, '2026-11-24T12:00:00Z');
  assert.equal(core.formatMeasurement({ value: 8.3, unit: 'kg' }), '8.3 kg');
});

// =============================================================================
// F04: @baby-buddy/core WCAG 2.2 AA Theme & Status (T1-F04-01 .. T1-F04-05)
// =============================================================================

test('T1-F04-01: Day Mode (Calma) exports mandated hex palette and AA text pairings', async () => {
  const core = await importCore();
  const day = core.getThemePalette('day');
  assert.equal(day.mode, 'day');
  assert.equal(day.bgPrimary, '#FAF8F5');
  assert.equal(day.bgCard, '#FFFFFF');
  assert.equal(day.brandPrimary, '#4A7C6F');
  assert.equal(day.accentWarm, '#E08A6B');
  assert.equal(day.alertRed, '#D64545');
  assert.equal(day.brandText, '#386055');
  assert.equal(day.accentWarmText, '#9E4728');
  assert.equal(day.alertRedText, '#B42D2D');
  assert.equal(day.textPrimary, '#1F2421');
});

test('T1-F04-02: 3:00 AM Mode (night_3am) exports mandated charcoal, cream, amber, peach, red tokens', async () => {
  const core = await importCore();
  const night = core.getThemePalette('night_3am');
  assert.equal(night.mode, 'night_3am');
  assert.equal(night.bgPrimary, '#121110');
  assert.equal(night.textPrimary, '#F3EDE2');
  assert.equal(night.accentWarm, '#E8A864');
  assert.equal(night.accentSecondary, '#E59876');
  assert.equal(night.brandPrimary, '#7EB3A3');
  assert.equal(night.alertRed, '#F07575');
  assert.equal(night.focusRing, '#F2B872');
});

test('T1-F04-03: contrastRatio matches independent sRGB WCAG math on Day and 3:00 AM primaries', async () => {
  const core = await importCore();
  const dayRatio = core.contrastRatio('#1F2421', '#FAF8F5');
  const nightRatio = core.contrastRatio('#F3EDE2', '#121110');

  const indDay = calcContrast('#1F2421', '#FAF8F5');
  const indNight = calcContrast('#F3EDE2', '#121110');

  assert.ok(Math.abs(dayRatio - indDay) < 0.001, `Day ratio mismatch: ${dayRatio} vs ${indDay}`);
  assert.ok(Math.abs(nightRatio - indNight) < 0.001, `Night ratio mismatch: ${nightRatio} vs ${indNight}`);
  assert.ok(dayRatio >= 14.8, `Expected Day primary contrast >= 14.8, got ${dayRatio}`);
  assert.ok(nightRatio >= 16.1, `Expected 3:00 AM primary contrast >= 16.1, got ${nightRatio}`);
});

test('T1-F04-04: assertWcagAaPalette passes both palettes and independent WCAG math confirms >=4.5 / >=3.0', async () => {
  const core = await importCore();
  assert.doesNotThrow(() => core.assertWcagAaPalette(core.DAY_PALETTE));
  assert.doesNotThrow(() => core.assertWcagAaPalette(core.NIGHT_3AM_PALETTE));

  for (const palette of [core.DAY_PALETTE, core.NIGHT_3AM_PALETTE]) {
    assertContrastAtLeast(palette.textPrimary, palette.bgPrimary, 4.5, `${palette.mode} textPrimary/bgPrimary`);
    assertContrastAtLeast(palette.textSecondary, palette.bgCard, 4.5, `${palette.mode} textSecondary/bgCard`);
    assertContrastAtLeast(palette.brandText, palette.bgPrimary, 4.5, `${palette.mode} brandText/bgPrimary`);
    assertContrastAtLeast(palette.accentWarmText, palette.bgPrimary, 4.5, `${palette.mode} accentWarmText/bgPrimary`);
    assertContrastAtLeast(palette.alertRedText, palette.bgPrimary, 4.5, `${palette.mode} alertRedText/bgPrimary`);
    assertContrastAtLeast(palette.focusRing, palette.bgPrimary, 3.0, `${palette.mode} focusRing/bgPrimary`);
    assertContrastAtLeast(palette.borderInteractive, palette.bgPrimary, 3.0, `${palette.mode} borderInteractive/bgPrimary`);
  }
});

test('T1-F04-05: STATUS_SPECS always pairs non-empty iconName + Mexican Spanish labelMx + paywallProtected:false', async () => {
  const core = await importCore();
  for (const severity of ['normal', 'caution', 'urgent_red']) {
    const spec = core.getStatusIndicator(severity);
    assert.equal(spec.severity, severity);
    assert.ok(typeof spec.iconName === 'string' && spec.iconName.length > 0);
    assert.ok(typeof spec.labelMx === 'string' && spec.labelMx.length > 0);
    assert.equal(spec.paywallProtected, false);
  }
  assert.match(core.STATUS_SPECS.urgent_red.labelMx, /911/);
});

// =============================================================================
// F05: @baby-buddy/core Compliance, Guardrails & Adapters (T1-F05-01 .. T1-F05-05)
// =============================================================================

test('T1-F05-01: DISCLAIMERS_MX implements all 3 Apple 1.4.1 disclaimer levels with 911 copy', async () => {
  const core = await importCore();
  const levels = ['onboarding_gate', 'guide_header', 'triage_banner'];
  for (const level of levels) {
    const item = core.DISCLAIMERS_MX[level];
    assert.ok(item, `Missing DISCLAIMERS_MX.${level}`);
    assert.equal(item.level, level);
    assert.ok(item.titleMx.length > 5);
    assert.ok(item.bodyMx.length > 20);
    assert.equal(item.emergencyNumber, '911');
    assert.match(item.emergencyActionLabelMx, /911/);
  }
  assert.equal(core.DISCLAIMERS_MX.onboarding_gate.requiresExplicitAck, true);
  assert.ok(core.DISCLAIMERS_MX.onboarding_gate.ackButtonLabelMx.length > 5);
  assert.equal(core.DISCLAIMERS_MX.guide_header.requiresExplicitAck, false);
  assert.equal(core.DISCLAIMERS_MX.triage_banner.requiresExplicitAck, false);
});

test('T1-F05-02: ETHICAL_GUARDRAILS strictly disables ads, emergency paywalls, and data selling', async () => {
  const core = await importCore();
  assert.deepEqual(core.ETHICAL_GUARDRAILS, {
    adsOnChildScreens: false,
    paywallOnEmergencyTriage: false,
    dataSellingEnabled: false,
  });
  assert.doesNotThrow(() => core.assertEthicalComplianceConfig(core.ETHICAL_GUARDRAILS));
});

test('T1-F05-03: validateNonDiagnosticCopy and validateSpanishClinicalCopy accept all 3 DISCLAIMERS_MX bodies', async () => {
  const core = await importCore();
  for (const item of Object.values(core.DISCLAIMERS_MX)) {
    const res1 = core.validateNonDiagnosticCopy(item.bodyMx);
    assert.equal(res1.valid, true, `Diagnostic violation in ${item.level}: ${JSON.stringify(res1.violations)}`);
    const res2 = core.validateSpanishClinicalCopy(item.bodyMx);
    assert.equal(res2.valid, true, `Spanish clinical violation in ${item.level}`);
  }
});

test('T1-F05-04: LocalAccountLifecycleAdapter completes seed -> snapshot -> deleteAccountAndData -> wipe lifecycle', async () => {
  const core = await importCore();
  const storage = new core.MemoryStorageAdapter();
  const adapter = new core.LocalAccountLifecycleAdapter(storage);

  await adapter.acceptOnboardingDisclaimer('2026-11-24T12:00:00Z');
  await adapter.seedDemoLocalData();
  const before = await adapter.getStoredSnapshotSummary();
  assert.equal(before.hasActiveProfile, true);
  assert.ok(before.itemCount > 0);
  assert.equal(await adapter.hasAcceptedOnboardingDisclaimer(), true);

  const deletion = await adapter.deleteAccountAndData({
    confirmedAtIso: '2026-11-24T12:05:00Z',
    reason: 'user_requested',
  });
  assert.equal(deletion.status, 'deleted_local');
  assert.ok(deletion.deletedKeysCount > 0);
  assert.equal(deletion.remoteSyncPending, false);
  assert.equal(deletion.deletedAtIso, '2026-11-24T12:05:00Z');

  const afterDel = await adapter.getStoredSnapshotSummary();
  assert.equal(afterDel.hasActiveProfile, false);
  assert.equal(afterDel.itemCount, 0);
  assert.equal(await adapter.hasAcceptedOnboardingDisclaimer(), false);
});

test('T1-F05-05: loadOfflineEnvConfig and offline Supabase/Gemini/Deployment stubs operate locally', async () => {
  const core = await importCore();
  const cfg = core.loadOfflineEnvConfig({});
  assert.deepEqual(cfg, {
    mode: 'offline_local',
    supabaseUrl: null,
    supabaseAnonKeyConfigured: false,
    geminiApiKeyConfigured: false,
    vercelEnv: 'local',
    hasLiveCredentials: false,
  });

  const supa = new core.OfflineSupabasePortStub(cfg);
  const gemini = new core.OfflineGeminiAssistantStub(cfg);
  const deploy = new core.OfflineDeploymentInfoStub(cfg);

  assert.equal(supa.getStatus().mode, 'offline_stub');
  assert.equal((await supa.pingLocal()).ok, true);
  assert.equal(gemini.getStatus().mode, 'offline_stub');
  const reply = await gemini.askOfflineOrientation('Fiebre en bebé de 2 meses');
  assert.equal(reply.isLiveAi, false);
  assert.equal(reply.disclaimerLevel, 'triage_banner');
  assert.match(reply.replyMx, /pediatra|911/i);
  assert.equal(deploy.getStatus().mode, 'offline_stub');
});

// =============================================================================
// F06: @baby-buddy/content Clinical Corpus Scaffold (T1-F06-01 .. T1-F06-05)
// =============================================================================

test('T1-F06-01: STAGE_OVERVIEWS covers all 4 stages in Mexican Spanish with metric examples', async () => {
  const core = await importCore();
  const content = await importContent();

  for (const stageId of core.STAGE_ORDER) {
    const ov = content.STAGE_OVERVIEWS[stageId];
    assert.ok(ov, `Missing STAGE_OVERVIEWS[${stageId}]`);
    assert.equal(ov.stage, stageId);
    assert.ok(ov.headlineMx.length > 5);
    assert.ok(Array.isArray(ov.orientationPointsMx) && ov.orientationPointsMx.length >= 1);
    const joinedPoints = ov.orientationPointsMx.join(' ');
    assert.ok(joinedPoints.length > 15);
    const formattedSample = core.formatMeasurement(ov.sampleMetric);
    assert.match(formattedSample, /(?:°C|kg|cm|ml)/);
    assert.equal(core.isImperialUnitPresent(`${ov.headlineMx} ${joinedPoints} ${formattedSample}`), false);
    assert.doesNotThrow(() => content.assertValidClinicalMetadata(ov.metadata));
  }
});

test('T1-F06-02: M1_GUIDE_SCAFFOLDS carry valid Apple 1.4.1 ClinicalMetadata and StatusSeverity', async () => {
  const content = await importContent();
  assert.ok(content.M1_GUIDE_SCAFFOLDS.length >= 2);
  for (const guide of content.M1_GUIDE_SCAFFOLDS) {
    assert.doesNotThrow(() => content.assertValidClinicalMetadata(guide.metadata));
    assert.match(guide.metadata.version, /\S+/);
    assert.ok(guide.metadata.sources.length >= 1);
    for (const src of guide.metadata.sources) {
      assert.ok(src.title.length > 0);
      assert.ok(src.organization.length > 0);
      assert.ok(Number.isInteger(src.year) && src.year >= 1990);
    }
    assert.match(guide.metadata.reviewed_at, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(guide.metadata.reviewed_by.trim().length > 0);
    assert.ok(['normal', 'caution', 'urgent_red'].includes(guide.severity));
  }
});

test('T1-F06-03: M1_CLOTHING_SCAFFOLDS use pañalero/mameluco and Celsius (°C)', async () => {
  const core = await importCore();
  const content = await importContent();
  assert.ok(content.M1_CLOTHING_SCAFFOLDS.length >= 1);
  const allClothingText = content.M1_CLOTHING_SCAFFOLDS.map(
    (c) => `${c.ambientTempRangeC} ${c.garmentsMx.join(' ')} ${c.guidanceMx}`,
  ).join(' ');
  assert.match(allClothingText, /pañalero/i);
  assert.match(allClothingText, /mameluco/i);
  assert.match(allClothingText, /°C/);
  assert.equal(core.isImperialUnitPresent(allClothingText), false);
});

test('T1-F06-04: Combined core + content corpus exhibits natural Mexican Spanish lexicon and zero imperial units', async () => {
  const core = await importCore();
  const content = await importContent();

  const corpusParts = [
    ...Object.values(core.DISCLAIMERS_MX).map((d) => `${d.titleMx} ${d.bodyMx} ${d.emergencyActionLabelMx}`),
    ...Object.values(core.STATUS_SPECS).map((s) => s.labelMx),
    ...Object.values(content.STAGE_OVERVIEWS).map(
      (o) => `${o.headlineMx} ${o.orientationPointsMx.join(' ')} ${core.formatMeasurement(o.sampleMetric)}`,
    ),
    ...content.M1_GUIDE_SCAFFOLDS.map((g) => `${g.titleMx} ${g.summaryMx} ${g.redFlagsMx.join(' ')}`),
    ...content.M1_CLOTHING_SCAFFOLDS.map(
      (c) => `${c.ambientTempRangeC} ${c.garmentsMx.join(' ')} ${c.guidanceMx}`,
    ),
  ];
  const combined = corpusParts.join('\n');

  assert.match(combined, /pañalero/i);
  assert.match(combined, /mameluco/i);
  assert.match(combined, /(?:mamila|biberón)/i);
  assert.match(combined, /rozadura/i);
  assert.match(combined, /pediatra/i);
  assert.match(combined, /911/);
  assert.equal(core.isImperialUnitPresent(combined), false);
  assert.deepEqual(findImperialUnits(combined), []);
});

test('T1-F06-05: All packages/content scaffolds pass non-diagnostic copy validation', async () => {
  const core = await importCore();
  const content = await importContent();

  for (const guide of content.M1_GUIDE_SCAFFOLDS) {
    const guideText = `${guide.titleMx}. ${guide.summaryMx}`;
    const res = core.validateSpanishClinicalCopy(guideText);
    assert.equal(res.valid, true, `Guide ${guide.id} failed clinical validation`);
    assert.deepEqual(findDiagnosticViolations(guideText), []);
  }
  for (const ov of Object.values(content.STAGE_OVERVIEWS)) {
    const ovText = `${ov.headlineMx}. ${ov.orientationPointsMx.join(' ')}`;
    assert.equal(core.validateNonDiagnosticCopy(ovText).valid, true);
    assert.deepEqual(findDiagnosticViolations(ovText), []);
  }
});

// =============================================================================
// F07: apps/web Design System & 4-Section Shell (T1-F07-01 .. T1-F07-05)
// =============================================================================

let sharedWebServer = null;

async function ensureWebServer() {
  if (!sharedWebServer) {
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

function readWebFiles() {
  const webSrc = path.join(ROOT_DIR, 'apps', 'web', 'src');
  return walkFiles(webSrc).map((f) => ({ ...f, content: readTextSafe(f.absPath) }));
}

test('T1-F07-01: apps/web completes clean production build (next build) offline', { skip: SKIP_APP_REASON }, () => {
  const res = runNpm(['run', 'build:web']);
  assert.equal(res.status, 0, `build:web failed:\n${res.stdout}\n${res.stderr}`);
  const buildIdPath = path.join(ROOT_DIR, 'apps', 'web', '.next', 'BUILD_ID');
  assert.ok(fs.existsSync(buildIdPath), 'apps/web/.next/BUILD_ID must be generated');
});

test('T1-F07-02: apps/web serves HTTP 200 on all 4 routes with es-MX, nav landmarks, and main', { skip: SKIP_APP_REASON }, async () => {
  const srv = await ensureWebServer();
  for (const route of ['/', '/guias', '/ropa-y-clima', '/salud', '/configuracion']) {
    const page = await srv.getPage(route);
    assert.equal(page.status, 200, `Expected HTTP 200 for ${route}, got ${page.status}`);
    assert.match(page.html, /<html[^>]*\blang="es-MX"/i, `${route} missing lang="es-MX"`);
  }

  const webFiles = readWebFiles();
  const combinedWeb = webFiles.map((f) => f.content).join('\n');
  assert.match(combinedWeb, /<nav\b/i);
  assert.match(combinedWeb, /id="contenido-principal"/);
  assert.match(combinedWeb, /aria-current/);
  for (const navLabel of ['Hoy', 'Guías', 'Ropa y Clima', 'Salud']) {
    assert.ok(combinedWeb.includes(navLabel), `Web shell missing nav label "${navLabel}"`);
  }
});

test('T1-F07-03: apps/web renders stage-adaptive Hoy across 0-3m, 3-12m, 1-3a, 3-6a with metric units', { skip: SKIP_APP_REASON }, () => {
  const webFiles = readWebFiles();
  const combinedWeb = webFiles.map((f) => f.content).join('\n');
  assert.match(combinedWeb, /STAGE_OVERVIEWS/);
  assert.match(combinedWeb, /StageSelector/);
  assert.match(combinedWeb, /STAGE_ORDER/);
});

test('T1-F07-04: apps/web supports Day (Calma) <-> 3:00 AM (night-3am) switching and CSS palette tokens', { skip: SKIP_APP_REASON }, async () => {
  const srv = await ensureWebServer();
  const page = await srv.getPage('/');
  const globalsCss = readTextSafe(path.join(ROOT_DIR, 'apps', 'web', 'src', 'app', 'globals.css'));
  const combinedStyles = `${page.cssBundleText}\n${globalsCss}`;

  assert.match(combinedStyles, /night-3am/);
  assert.match(combinedStyles, /#FAF8F5/i);
  assert.match(combinedStyles, /#121110/i);
  const webFiles = readWebFiles();
  const combinedWeb = webFiles.map((f) => f.content).join('\n');
  assert.match(combinedWeb, /data-theme/);
  assert.match(combinedWeb, /Modo 3:00 AM|night_3am/i);
});

test('T1-F07-05: apps/web enforces >=48px touch targets and Icon + Text StatusBadge', { skip: SKIP_APP_REASON }, () => {
  const webFiles = readWebFiles();
  const combinedWeb = webFiles.map((f) => f.content).join('\n');
  assert.match(combinedWeb, /min-h-12|min-h-\[48px\]/);
  assert.match(combinedWeb, /StatusBadge/);
  assert.match(combinedWeb, /STATUS_SPECS/);
  assert.match(combinedWeb, /aria-hidden="true"/);
});

// =============================================================================
// F08: apps/web Apple 1.4.1 & 5.1.1(v) + Guardrails (T1-F08-01 .. T1-F08-05)
// =============================================================================

test('T1-F08-01: apps/web renders Level 1 OnboardingGate blocking entry until explicit ack', { skip: SKIP_APP_REASON }, () => {
  const gatePath = path.join(ROOT_DIR, 'apps', 'web', 'src', 'components', 'OnboardingGate.tsx');
  assert.ok(fs.existsSync(gatePath), 'OnboardingGate.tsx must exist');
  const gateSrc = readTextSafe(gatePath);
  assert.match(gateSrc, /DISCLAIMERS_MX\.onboarding_gate|onboarding_gate/);
  assert.match(gateSrc, /acceptOnboardingDisclaimer/);
  assert.match(gateSrc, /min-h-12|min-h-\[48px\]/);
});

test('T1-F08-02: apps/web /guias renders Level 2 GuideDisclaimerHeader with clinical metadata', { skip: SKIP_APP_REASON }, async () => {
  const srv = await ensureWebServer();
  const page = await srv.getPage('/guias');
  assert.equal(page.status, 200);
  const guiasSrc = readTextSafe(path.join(ROOT_DIR, 'apps', 'web', 'src', 'app', 'guias', 'page.tsx'));
  const headerSrc = readTextSafe(path.join(ROOT_DIR, 'apps', 'web', 'src', 'components', 'GuideDisclaimerHeader.tsx'));
  assert.match(headerSrc, /guide_header/);
  assert.match(guiasSrc, /GuideDisclaimerHeader/);
  assert.match(guiasSrc, /reviewed_at/);
  assert.match(guiasSrc, /reviewed_by/);
  assert.match(guiasSrc, /sources/);
});

test('T1-F08-03: apps/web /guias renders Level 3 TriageDisclaimerBanner and non-paywalled 911 alert', { skip: SKIP_APP_REASON }, async () => {
  const srv = await ensureWebServer();
  const page = await srv.getPage('/guias');
  assert.equal(page.status, 200);
  const guiasSrc = readTextSafe(path.join(ROOT_DIR, 'apps', 'web', 'src', 'components', 'GuiasView.tsx'));
  const bannerSrc = readTextSafe(path.join(ROOT_DIR, 'apps', 'web', 'src', 'components', 'TriageDisclaimerBanner.tsx'));
  assert.match(bannerSrc, /triage_banner/);
  assert.match(guiasSrc, /TriageDisclaimerBanner/);
  assert.match(guiasSrc, /911/);
  assert.match(`${guiasSrc}\n${bannerSrc}`, /role="alert"/);
});

test('T1-F08-04: apps/web uses native <dialog> AccountDeletionDialog wired to LocalAccountLifecycleAdapter', { skip: SKIP_APP_REASON }, () => {
  const dialogPath = path.join(ROOT_DIR, 'apps', 'web', 'src', 'components', 'AccountDeletionDialog.tsx');
  assert.ok(fs.existsSync(dialogPath), 'AccountDeletionDialog.tsx must exist');
  const dialogSrc = readTextSafe(dialogPath);
  const adapterSrc = readTextSafe(path.join(ROOT_DIR, 'apps', 'web', 'src', 'lib', 'localAdapter.ts'));
  assert.match(dialogSrc, /<dialog\b/);
  assert.match(dialogSrc, /showModal\(/);
  assert.match(dialogSrc, /deleteAccountAndData/);
  assert.match(adapterSrc, /LocalAccountLifecycleAdapter/);
});

test('T1-F08-05: apps/web contains zero ads, zero paywalls on 911, and zero trackers', { skip: SKIP_APP_REASON }, async () => {
  const srv = await ensureWebServer();
  const webPkg = readTextSafe(path.join(ROOT_DIR, 'apps', 'web', 'package.json'));
  assert.deepEqual(findEthicalViolations(webPkg), []);
  for (const f of readWebFiles()) {
    assert.deepEqual(findEthicalViolations(f.content), [], `Ethical guardrail violation in ${f.relPath}`);
  }
  for (const route of ['/', '/guias', '/ropa-y-clima', '/salud', '/configuracion']) {
    const page = await srv.getPage(route);
    assert.deepEqual(findEthicalViolations(page.html), [], `HTML ethical violation on ${route}`);
  }
});

// =============================================================================
// F09: apps/mobile Design System & 4-Tab Shell (T1-F09-01 .. T1-F09-05)
// =============================================================================

function readMobileFiles() {
  const mobileDir = path.join(ROOT_DIR, 'apps', 'mobile');
  return walkFiles(mobileDir, {
    extensions: new Set(['.ts', '.tsx', '.js', '.json', '.css']),
  }).map((f) => ({ ...f, content: readTextSafe(f.absPath) }));
}

test('T1-F09-01: apps/mobile passes tsc --noEmit cleanly', { skip: SKIP_APP_REASON }, () => {
  const res = runNpm(['run', 'typecheck', '--workspace=@baby-buddy/mobile']);
  assert.equal(res.status, 0, `mobile typecheck failed:\n${res.stdout}\n${res.stderr}`);
});

test('T1-F09-02: apps/mobile runs local expo export --platform web --clear cleanly at $0', { skip: SKIP_APP_REASON }, () => {
  const mobileDir = path.join(ROOT_DIR, 'apps', 'mobile');
  const expoBin = resolveWorkspaceBin(mobileDir, 'expo', 'bin/cli');
  const res = runNodeScript(expoBin, ['export', '--platform', 'web', '--clear'], {
    cwd: mobileDir,
    env: sanitizeOfflineEnv(),
  });
  assert.equal(res.status, 0, `expo export failed:\n${res.stdout}\n${res.stderr}`);
  assert.ok(fs.existsSync(path.join(mobileDir, 'dist', 'index.html')), 'apps/mobile/dist/index.html missing');
});

test('T1-F09-03: apps/mobile defines 5-tab shell (Registro, Ropa y Clima, Salud, ¿Es normal?, Config.) with >=48px targets', { skip: SKIP_APP_REASON }, () => {
  const tabsDir = path.join(ROOT_DIR, 'apps', 'mobile', 'app', '(tabs)');
  for (const tabFile of ['_layout.tsx', 'index.tsx', 'guias.tsx', 'ropa-y-clima.tsx', 'salud.tsx', 'configuracion.tsx']) {
    assert.ok(fs.existsSync(path.join(tabsDir, tabFile)), `Missing mobile tab file: ${tabFile}`);
  }
  const tabsLayout = readTextSafe(path.join(tabsDir, '_layout.tsx'));
  for (const title of ['Registro', '¿Es normal?', 'Ropa y Clima', 'Salud', 'Config.']) {
    assert.ok(tabsLayout.includes(title), `Mobile tabs layout missing "${title}"`);
  }
  assert.match(tabsLayout, /minHeight:\s*48|min-h-12|height:\s*(?:4[89]|[5-9]\d)/);
});

test('T1-F09-04: apps/mobile supports stage-adaptive Hoy and Day/3:00 AM theme switching', { skip: SKIP_APP_REASON }, () => {
  const files = readMobileFiles();
  const combined = files.map((f) => f.content).join('\n');
  assert.match(combined, /StageSelector/);
  assert.match(combined, /STAGE_OVERVIEWS/);
  assert.match(combined, /ThemeProvider/);
  assert.match(combined, /night_3am/);
  assert.match(combined, /getThemePalette/);
});

test('T1-F09-05: apps/mobile enforces Icon + Text StatusBadge and MX Spanish + °C copy', { skip: SKIP_APP_REASON }, () => {
  const files = readMobileFiles();
  const combined = files.map((f) => f.content).join('\n');
  assert.match(combined, /StatusBadge/);
  assert.match(combined, /STATUS_SPECS/);
  assert.match(combined, /recommendClothing|M1_CLOTHING_SCAFFOLDS|pañalero/i);
  assert.match(combined, /°C|ambientTempRangeC/);
});

// =============================================================================
// F10: apps/mobile Apple 1.4.1 & 5.1.1(v) + Guardrails (T1-F10-01 .. T1-F10-05)
// =============================================================================

test('T1-F10-01: apps/mobile implements Level 1 OnboardingGate before tabs', { skip: SKIP_APP_REASON }, () => {
  const rootLayout = readTextSafe(path.join(ROOT_DIR, 'apps', 'mobile', 'app', '_layout.tsx'));
  const gateSrc = readTextSafe(path.join(ROOT_DIR, 'apps', 'mobile', 'components', 'OnboardingGate.tsx'));
  assert.match(rootLayout, /OnboardingGate/);
  assert.match(gateSrc, /onboarding_gate/);
  assert.match(gateSrc, /acceptOnboardingDisclaimer/);
});

test('T1-F10-02: apps/mobile Guías tab renders Level 2 GuideDisclaimerHeader and clinical metadata', { skip: SKIP_APP_REASON }, () => {
  const guiasSrc = readTextSafe(path.join(ROOT_DIR, 'apps', 'mobile', 'app', '(tabs)', 'guias.tsx'));
  const headerSrc = readTextSafe(path.join(ROOT_DIR, 'apps', 'mobile', 'components', 'GuideDisclaimerHeader.tsx'));
  assert.match(guiasSrc, /GuideDisclaimerHeader/);
  assert.match(guiasSrc, /metadata/);
  assert.match(headerSrc, /guide_header/);
  assert.match(headerSrc, /reviewed_at/);
  assert.match(headerSrc, /reviewed_by/);
  assert.match(headerSrc, /sources/);
});

test('T1-F10-03: apps/mobile ¿Es normal? tab renders Level 3 TriageDisclaimerBanner and non-paywalled 911 card', { skip: SKIP_APP_REASON }, () => {
  const guiasSrc = readTextSafe(path.join(ROOT_DIR, 'apps', 'mobile', 'app', '(tabs)', 'guias.tsx'));
  const bannerSrc = readTextSafe(path.join(ROOT_DIR, 'apps', 'mobile', 'components', 'TriageDisclaimerBanner.tsx'));
  assert.match(guiasSrc, /TriageDisclaimerBanner/);
  assert.match(bannerSrc, /triage_banner/);
  assert.match(guiasSrc, /911/);
});

test('T1-F10-04: apps/mobile AccountDeletionSheet wires to LocalAccountLifecycleAdapter and resets onboarding', { skip: SKIP_APP_REASON }, () => {
  const sheetSrc = readTextSafe(path.join(ROOT_DIR, 'apps', 'mobile', 'components', 'AccountDeletionSheet.tsx'));
  const adapterSrc = readTextSafe(path.join(ROOT_DIR, 'apps', 'mobile', 'lib', 'localAdapter.ts'));
  assert.match(sheetSrc, /deleteAccountAndData/);
  assert.match(adapterSrc, /LocalAccountLifecycleAdapter/);
});

test('T1-F10-05: apps/mobile contains zero ad SDKs, zero paywalls on 911, and zero trackers', { skip: SKIP_APP_REASON }, () => {
  for (const f of readMobileFiles()) {
    assert.deepEqual(findEthicalViolations(f.content), [], `Mobile ethical violation in ${f.relPath}`);
  }
});
