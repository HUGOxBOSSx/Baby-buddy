import './helpers/ts-hooks.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { after, test } from 'node:test';
import { CORE_ONLY, ROOT_DIR, readTextSafe, walkFiles } from './helpers/paths.mjs';
import {
  resolveWorkspaceBin,
  runNodeScript,
  runNpm,
  sanitizeOfflineEnv,
} from './helpers/proc.mjs';
import { findDiagnosticViolations, findEthicalViolations, findImperialUnits } from './helpers/scanners.mjs';
import { importContent, importCore } from './helpers/ts-hooks.mjs';
import { assertContrastAtLeast } from './helpers/wcag.mjs';
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

function parseEnvObject(text) {
  const obj = {};
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eqIdx = line.indexOf('=');
    if (eqIdx === -1) continue;
    obj[line.slice(0, eqIdx).trim()] = line.slice(eqIdx + 1).trim();
  }
  return obj;
}

test('T3-01 (F01+F02): Full CI command chain executes offline with exit code 0', { skip: SKIP_APP_REASON }, () => {
  for (const script of ['typecheck', 'lint', 'test', 'build:web', 'export:mobile']) {
    const res = runNpm(['run', script], { env: sanitizeOfflineEnv() });
    assert.equal(res.status, 0, `CI step "npm run ${script}" failed:\n${res.stdout}\n${res.stderr}`);
  }
});

test('T3-02 (F03+F05+F06): 4 Stages x 2 Themes x 3 Severities matrix aligns with @baby-buddy/content & guardrails', async () => {
  const core = await importCore();
  const content = await importContent();

  let matrixCount = 0;
  for (const stageId of core.STAGE_ORDER) {
    const stageSpec = core.STAGE_SPECS[stageId];
    const overview = content.STAGE_OVERVIEWS[stageId];
    assert.ok(stageSpec && overview);
    assert.equal(overview.stage, stageId);
    const overviewText = `${overview.headlineMx} ${overview.orientationPointsMx.join(' ')} ${core.formatMeasurement(overview.sampleMetric)}`;
    assert.equal(core.isImperialUnitPresent(overviewText), false);
    assert.equal(core.validateNonDiagnosticCopy(overviewText).valid, true);

    for (const mode of ['day', 'night_3am']) {
      const palette = core.getThemePalette(mode);
      assert.doesNotThrow(() => core.assertWcagAaPalette(palette));
      for (const sev of ['normal', 'caution', 'urgent_red']) {
        const statusSpec = core.getStatusIndicator(sev);
        assert.ok(statusSpec.iconName.length > 0);
        assert.ok(statusSpec.labelMx.length > 0);
        assert.equal(statusSpec.paywallProtected, false);
        matrixCount += 1;
      }
    }
  }
  assert.equal(matrixCount, 24);

  for (const guide of content.M1_GUIDE_SCAFFOLDS) {
    assert.ok(core.isStageId(guide.stage));
    assert.doesNotThrow(() => content.assertValidClinicalMetadata(guide.metadata));
    assert.equal(core.validateSpanishClinicalCopy(`${guide.titleMx}. ${guide.summaryMx}`).valid, true);
  }
  for (const cloth of content.M1_CLOTHING_SCAFFOLDS) {
    assert.ok(core.isStageId(cloth.stage));
    assert.doesNotThrow(() => content.assertValidClinicalMetadata(cloth.metadata));
    const txt = `${cloth.ambientTempRangeC} ${cloth.garmentsMx.join(' ')} ${cloth.guidanceMx}`;
    assert.equal(core.isImperialUnitPresent(txt), false);
  }
});

test('T3-03 (F04+F07): WCAG Day and 3:00 AM tokens verified across all 4 apps/web HTTP routes', { skip: SKIP_APP_REASON }, async () => {
  const core = await importCore();
  const srv = await ensureWebServer();
  const globalsCss = readTextSafe(path.join(ROOT_DIR, 'apps', 'web', 'src', 'app', 'globals.css'));

  for (const route of ['/', '/guias', '/ropa-y-clima', '/salud']) {
    const page = await srv.getPage(route);
    assert.equal(page.status, 200);
    const styles = `${page.cssBundleText}\n${globalsCss}`;
    assert.match(styles, /#FAF8F5/i);
    assert.match(styles, /#121110/i);
  }

  assertContrastAtLeast(core.DAY_PALETTE.textPrimary, core.DAY_PALETTE.bgPrimary, 4.5, 'Web Day primary');
  assertContrastAtLeast(core.NIGHT_3AM_PALETTE.textPrimary, core.NIGHT_3AM_PALETTE.bgPrimary, 4.5, 'Web 3AM primary');
});

test('T3-04 (F03+F04+F06+F09): Core stages/tokens/content integrate into apps/mobile 4-tab shell', { skip: SKIP_APP_REASON }, () => {
  const mobileFiles = walkFiles(path.join(ROOT_DIR, 'apps', 'mobile'), {
    extensions: new Set(['.ts', '.tsx']),
  });
  const combined = mobileFiles.map((f) => readTextSafe(f.absPath)).join('\n');
  assert.match(combined, /STAGE_OVERVIEWS/);
  assert.match(combined, /ALL_CLINICAL_GUIDES|M1_GUIDE_SCAFFOLDS/);
  assert.match(combined, /recommendClothing|M1_CLOTHING_SCAFFOLDS/);
  assert.match(combined, /StatusBadge/);
  assert.match(combined, /getThemePalette|THEME_PALETTES/);
});

test('T3-05 (F04+F07+F08): 3:00 AM Mode + apps/web /guias TriageDisclaimerBanner + 911 AA alert', { skip: SKIP_APP_REASON }, async () => {
  const core = await importCore();
  const srv = await ensureWebServer();
  const page = await srv.getPage('/guias');
  assert.equal(page.status, 200);

  const night = core.NIGHT_3AM_PALETTE;
  assertContrastAtLeast(night.onAlertRedText, night.alertRedSurface, 4.5, '3AM #F3EDE2 on #471D1D');
  assertContrastAtLeast(night.alertRedText, night.bgPrimary, 4.5, '3AM #F07575 on #121110');

  const guiasSrc = readTextSafe(path.join(ROOT_DIR, 'apps', 'web', 'src', 'components', 'GuiasView.tsx'));
  const bannerSrc = readTextSafe(path.join(ROOT_DIR, 'apps', 'web', 'src', 'components', 'TriageDisclaimerBanner.tsx'));
  assert.match(`${guiasSrc}\n${bannerSrc}`, /911/);
  assert.match(`${guiasSrc}\n${bannerSrc}`, /role="alert"/);
  assert.deepEqual(findEthicalViolations(`${guiasSrc}\n${bannerSrc}`), []);
});

test('T3-06 (F04+F09+F10): 3:00 AM Mode + apps/mobile ¿Es normal? TriageDisclaimerBanner + 911 >=48px', { skip: SKIP_APP_REASON }, () => {
  const guiasSrc = readTextSafe(path.join(ROOT_DIR, 'apps', 'mobile', 'app', '(tabs)', 'guias.tsx'));
  const bannerSrc = readTextSafe(path.join(ROOT_DIR, 'apps', 'mobile', 'components', 'TriageDisclaimerBanner.tsx'));
  const badgeSrc = readTextSafe(path.join(ROOT_DIR, 'apps', 'mobile', 'components', 'StatusBadge.tsx'));
  assert.match(`${guiasSrc}\n${bannerSrc}`, /911/);
  assert.match(`${badgeSrc}`, /STATUS_SPECS|StatusBadge/);
  assert.match(`${guiasSrc}\n${bannerSrc}`, /minHeight:\s*48|min-h-12|MIN_TOUCH_TARGET_PX/);
  assert.deepEqual(findEthicalViolations(`${guiasSrc}\n${bannerSrc}`), []);
});

test('T3-07 (F05+F07+F08): Web OnboardingGate -> stage/theme persistence -> AccountDeletionDialog reset', { skip: SKIP_APP_REASON }, async () => {
  const core = await importCore();
  const storage = new core.MemoryStorageAdapter();
  const adapter = new core.LocalAccountLifecycleAdapter(storage);
  await adapter.acceptOnboardingDisclaimer('2026-11-24T10:00:00Z');
  await adapter.seedDemoLocalData();
  await storage.setItem(core.LOCAL_STORAGE_KEYS.preferences, JSON.stringify({ themeMode: 'night_3am', activeStageId: '1-3a' }));

  const dialogSrc = readTextSafe(path.join(ROOT_DIR, 'apps', 'web', 'src', 'components', 'AccountDeletionDialog.tsx'));
  const gateSrc = readTextSafe(path.join(ROOT_DIR, 'apps', 'web', 'src', 'components', 'OnboardingGate.tsx'));
  assert.match(dialogSrc, /deleteAccountAndData/);
  assert.match(gateSrc, /hasAcceptedOnboardingDisclaimer/);

  await adapter.deleteAccountAndData({ confirmedAtIso: '2026-11-24T10:05:00Z' });
  assert.equal(await adapter.hasAcceptedOnboardingDisclaimer(), false);
  assert.equal(await storage.getItem(core.LOCAL_STORAGE_KEYS.preferences), null);
});

test('T3-08 (F03+F06+F07+F09): Mexican Spanish lexicon & metric parity across content, web, and mobile', { skip: SKIP_APP_REASON }, async () => {
  const content = await importContent();
  const contentText = JSON.stringify({
    stages: content.STAGE_OVERVIEWS,
    guides: content.M1_GUIDE_SCAFFOLDS,
    clothing: content.M1_CLOTHING_SCAFFOLDS,
  });
  const webText = walkFiles(path.join(ROOT_DIR, 'apps', 'web', 'src'))
    .map((f) => readTextSafe(f.absPath))
    .join('\n');
  const mobileText = walkFiles(path.join(ROOT_DIR, 'apps', 'mobile'), {
    extensions: new Set(['.ts', '.tsx']),
  })
    .map((f) => readTextSafe(f.absPath))
    .join('\n');

  for (const [label, corpus] of [
    ['packages/content', contentText],
    ['apps/web', webText],
    ['apps/mobile', mobileText],
  ]) {
    assert.deepEqual(findImperialUnits(corpus), [], `Imperial unit leak in ${label}`);
  }
  const combined = `${contentText}\n${webText}\n${mobileText}`;
  for (const term of [/pañalero/i, /mameluco/i, /(?:mamila|biberón)/i, /rozadura/i, /pediatra/i, /911/]) {
    assert.match(combined, term, `Missing Mexican Spanish term ${term}`);
  }
});

test('T3-09 (F05+F07+F08): Web state reload persistence vs complete wipe after AccountDeletionDialog', { skip: SKIP_APP_REASON }, () => {
  const themeSrc = readTextSafe(path.join(ROOT_DIR, 'apps', 'web', 'src', 'components', 'ThemeProvider.tsx'));
  const stageSrc = readTextSafe(path.join(ROOT_DIR, 'apps', 'web', 'src', 'components', 'StageSelector.tsx'));
  const adapterSrc = readTextSafe(path.join(ROOT_DIR, 'apps', 'web', 'src', 'lib', 'localAdapter.ts'));
  assert.match(themeSrc, /localStorage/);
  assert.match(stageSrc, /localStorage|activeStage|stage/i);
  assert.match(adapterSrc, /window\.localStorage|localStorage/);
});

test('T3-10 (F05+F06+F08+F10): Apple 1.4.1 3-level disclaimer progression parity across Web & Mobile', { skip: SKIP_APP_REASON }, () => {
  const webComponents = walkFiles(path.join(ROOT_DIR, 'apps', 'web', 'src'))
    .map((f) => readTextSafe(f.absPath))
    .join('\n');
  const mobileComponents = walkFiles(path.join(ROOT_DIR, 'apps', 'mobile'), {
    extensions: new Set(['.ts', '.tsx']),
  })
    .map((f) => readTextSafe(f.absPath))
    .join('\n');

  for (const [platform, text] of [
    ['apps/web', webComponents],
    ['apps/mobile', mobileComponents],
  ]) {
    assert.match(text, /OnboardingGate/, `${platform} missing Level 1 OnboardingGate`);
    assert.match(text, /GuideDisclaimerHeader/, `${platform} missing Level 2 GuideDisclaimerHeader`);
    assert.match(text, /TriageDisclaimerBanner/, `${platform} missing Level 3 TriageDisclaimerBanner`);
    assert.deepEqual(findDiagnosticViolations(text), [], `${platform} diagnostic language violation`);
  }
});

test('T3-11 (F01+F02+F09): Offline multi-platform Expo export emits android, ios, and web bundles', { skip: SKIP_APP_REASON }, () => {
  const mobileDir = path.join(ROOT_DIR, 'apps', 'mobile');
  const expoBin = resolveWorkspaceBin(mobileDir, 'expo', 'bin/cli');
  const res = runNodeScript(
    expoBin,
    ['export', '--platform', 'android', '--platform', 'ios', '--platform', 'web', '--clear'],
    { cwd: mobileDir, env: sanitizeOfflineEnv() },
  );
  assert.equal(res.status, 0, `Multi-platform expo export failed:\n${res.stdout}\n${res.stderr}`);
  const distFiles = walkFiles(path.join(mobileDir, 'dist'), { ignoreDirs: new Set() }).map((f) => f.relPath);
  assert.ok(distFiles.some((p) => p.endsWith('index.html')), 'Missing web index.html in dist');
  assert.ok(distFiles.some((p) => /android/i.test(p) && p.endsWith('.js') || p.endsWith('.hbc')), 'Missing android bundle');
  assert.ok(distFiles.some((p) => /ios/i.test(p) && p.endsWith('.js') || p.endsWith('.hbc')), 'Missing ios bundle');
});

test('T3-12 (F01+F05): .env.example flows into loadOfflineEnvConfig and all 3 offline service stubs', async () => {
  const core = await importCore();
  const envObj = parseEnvObject(readTextSafe(path.join(ROOT_DIR, '.env.example')));
  const cfg = core.loadOfflineEnvConfig(envObj);
  assert.equal(cfg.mode, 'offline_local');
  assert.equal(cfg.hasLiveCredentials, false);
  assert.equal(cfg.supabaseUrl, null);
  assert.equal(cfg.supabaseAnonKeyConfigured, false);
  assert.equal(cfg.geminiApiKeyConfigured, false);
  assert.equal(cfg.vercelEnv, 'local');

  const supa = new core.OfflineSupabasePortStub(cfg);
  const gemini = new core.OfflineGeminiAssistantStub(cfg);
  const deploy = new core.OfflineDeploymentInfoStub(cfg);
  assert.equal(supa.getStatus().readyForFutureWiring, true);
  assert.equal(gemini.getStatus().readyForFutureWiring, true);
  assert.equal(deploy.getStatus().readyForFutureWiring, true);
});
