import './helpers/ts-hooks.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { after, test } from 'node:test';
import { CORE_ONLY, ROOT_DIR, readTextSafe, walkFiles } from './helpers/paths.mjs';
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

test('T4-01: Scenario A — Mamá a las 3:00 AM (0-3m, fiebre °C / rozadura, 911 en <=3 taps) across Core, Web & Mobile', { skip: SKIP_APP_REASON }, async () => {
  const core = await importCore();
  const content = await importContent();
  const srv = await ensureWebServer();

  // Core domain & 3:00 AM WCAG guarantees
  assert.equal(core.getStageForAgeMonths(2), '0-3m');
  assert.equal(core.formatMetric(38.2, '°C'), '38.2 °C');
  assert.equal(core.MAX_NIGHT_FLOW_TAPS, 3);
  assert.equal(core.MIN_TOUCH_TARGET_PX, 48);
  assert.equal(core.STATUS_SPECS.urgent_red.paywallProtected, false);
  const night = core.NIGHT_3AM_PALETTE;
  assert.equal(night.bgPrimary, '#121110');
  assertContrastAtLeast(night.textPrimary, night.bgPrimary, 4.5, '3AM cream on charcoal');

  // Content guide for fever in °C
  const feverGuide = content.M1_GUIDE_SCAFFOLDS.find((g) => g.severity === 'urgent_red');
  assert.ok(feverGuide, 'Expected urgent_red fever guide scaffold');
  assert.match(`${feverGuide.titleMx} ${feverGuide.summaryMx}`, /°C|911/);

  // Web live route + Mobile Salud source
  const saludPage = await srv.getPage('/salud');
  assert.equal(saludPage.status, 200);
  const webSalud = readTextSafe(path.join(ROOT_DIR, 'apps', 'web', 'src', 'app', 'salud', 'page.tsx'));
  const mobileSalud = readTextSafe(path.join(ROOT_DIR, 'apps', 'mobile', 'app', '(tabs)', 'salud.tsx'));
  assert.match(webSalud, /911/);
  assert.match(mobileSalud, /911/);
});

test('T4-02: Scenario B — Papá revisando ropa térmica (pañalero, mameluco, °C) y guía clínica en Modo Calma', { skip: SKIP_APP_REASON }, async () => {
  const core = await importCore();
  const content = await importContent();
  const srv = await ensureWebServer();

  assert.equal(core.getStageForAgeMonths(8), '3-12m');
  assert.equal(core.DAY_PALETTE.bgPrimary, '#FAF8F5');
  assertContrastAtLeast(core.DAY_PALETTE.brandText, core.DAY_PALETTE.bgPrimary, 4.5, 'Day brandText on cream');

  const clothText = content.M1_CLOTHING_SCAFFOLDS.map(
    (c) => `${c.ambientTempRangeC} ${c.garmentsMx.join(' ')} ${c.guidanceMx}`,
  ).join(' ');
  assert.match(clothText, /pañalero/i);
  assert.match(clothText, /mameluco/i);
  assert.match(clothText, /°C/);

  const guiasPage = await srv.getPage('/guias');
  const ropaPage = await srv.getPage('/ropa-y-clima');
  assert.equal(guiasPage.status, 200);
  assert.equal(ropaPage.status, 200);
});

test('T4-03: Scenario C — Familia multi-etapa (0-3m, 3-12m, 1-3a, 3-6a) verificando métricas y límites de edad', { skip: SKIP_APP_REASON }, async () => {
  const core = await importCore();
  const content = await importContent();

  assert.equal(core.getStageForAgeMonths(11), '3-12m');
  assert.equal(core.getStageForAgeMonths(12), '1-3a');
  assert.equal(core.getStageForAgeMonths(35), '1-3a');
  assert.equal(core.getStageForAgeMonths(36), '3-6a');
  assert.equal(core.getStageForAgeMonths(72), '3-6a');

  const headlines = new Set(core.STAGE_ORDER.map((id) => content.STAGE_OVERVIEWS[id].headlineMx));
  assert.equal(headlines.size, 4, 'All 4 stages must have distinct headlines');

  const webHoy = readTextSafe(path.join(ROOT_DIR, 'apps', 'web', 'src', 'app', 'page.tsx'));
  const mobileHoy = readTextSafe(path.join(ROOT_DIR, 'apps', 'mobile', 'app', '(tabs)', 'index.tsx'));
  assert.match(webHoy, /STAGE_OVERVIEWS/);
  assert.match(mobileHoy, /STAGE_OVERVIEWS/);
});

test('T4-04: Scenario D — Privacidad Apple 5.1.1(v): cancelación preserva datos vs eliminación reinicia OnboardingGate', { skip: SKIP_APP_REASON }, async () => {
  const core = await importCore();
  const storage = new core.MemoryStorageAdapter();
  const adapter = new core.LocalAccountLifecycleAdapter(storage);

  await adapter.acceptOnboardingDisclaimer('2026-11-24T08:00:00Z');
  await adapter.seedDemoLocalData();
  // Simulate cancel: no deleteAccountAndData call -> data remains intact
  assert.equal((await adapter.getStoredSnapshotSummary()).hasActiveProfile, true);
  assert.equal(await adapter.hasAcceptedOnboardingDisclaimer(), true);

  // Confirm deletion
  const res = await adapter.deleteAccountAndData({ confirmedAtIso: '2026-11-24T08:10:00Z' });
  assert.equal(res.status, 'deleted_local');
  assert.equal((await adapter.getStoredSnapshotSummary()).hasActiveProfile, false);
  assert.equal(await adapter.hasAcceptedOnboardingDisclaimer(), false);

  const webDialog = readTextSafe(path.join(ROOT_DIR, 'apps', 'web', 'src', 'components', 'AccountDeletionDialog.tsx'));
  const mobileSheet = readTextSafe(path.join(ROOT_DIR, 'apps', 'mobile', 'components', 'AccountDeletionSheet.tsx'));
  assert.match(webDialog, /deleteAccountAndData/);
  assert.match(mobileSheet, /deleteAccountAndData/);
});

test('T4-05: Scenario E — Validación completa de CI local y empaquetado $0 USD', { skip: SKIP_APP_REASON }, () => {
  for (const script of ['typecheck', 'lint', 'test', 'build:web']) {
    const res = runNpm(['run', script], { env: sanitizeOfflineEnv() });
    assert.equal(res.status, 0, `npm run ${script} failed:\n${res.stdout}\n${res.stderr}`);
  }
  const mobileDir = path.join(ROOT_DIR, 'apps', 'mobile');
  const expoBin = resolveWorkspaceBin(mobileDir, 'expo', 'bin/cli');
  const exp = runNodeScript(
    expoBin,
    ['export', '--platform', 'android', '--platform', 'ios', '--platform', 'web', '--clear'],
    { cwd: mobileDir, env: sanitizeOfflineEnv() },
  );
  assert.equal(exp.status, 0, `expo export failed:\n${exp.stdout}\n${exp.stderr}`);
});

test('T4-06: Scenario F — Auditoría independiente de rúbrica, contención M1 (cero M2-M7), secretos e higiene Git', async () => {
  const core = await importCore();
  const content = await importContent();

  // 1. Core + Content independent rubric checks
  assert.doesNotThrow(() => core.assertWcagAaPalette(core.DAY_PALETTE));
  assert.doesNotThrow(() => core.assertWcagAaPalette(core.NIGHT_3AM_PALETTE));
  assert.doesNotThrow(() => core.assertEthicalComplianceConfig(core.ETHICAL_GUARDRAILS));
  assert.equal(Object.keys(core.DISCLAIMERS_MX).length, 3);
  for (const g of content.M1_GUIDE_SCAFFOLDS) {
    assert.doesNotThrow(() => content.assertValidClinicalMetadata(g.metadata));
  }

  // 2. Repo-wide M2-M7 scope containment, ethical guardrails & secret scan
  const ignorePrefixes = CORE_ONLY ? ['e2e/', 'apps/'] : ['e2e/'];
  const files = walkFiles(ROOT_DIR, { ignoreRelPrefixes: ignorePrefixes });
  for (const f of files) {
    if (f.relPath.endsWith('package-lock.json')) continue;
    const isUnitTestFile = /(?:^|\/)__tests__\/|\.test\.(?:ts|tsx|js|mjs)$/i.test(f.relPath);
    const text = readTextSafe(f.absPath);
    assert.deepEqual(findSecrets(text, f.relPath), [], `Secret leak in ${f.relPath}`);
    if (!isUnitTestFile) {
      assert.deepEqual(findM2ToM7Leaks(text, f.relPath), [], `M2-M7 scope leak in ${f.relPath}`);
      assert.deepEqual(findEthicalViolations(text), [], `Ethical guardrail violation in ${f.relPath}`);
    }
    if (f.relPath.startsWith('packages/content/src/') && !isUnitTestFile) {
      assert.deepEqual(findImperialUnits(text), [], `Imperial unit in ${f.relPath}`);
      assert.deepEqual(findDiagnosticViolations(text), [], `Diagnostic copy in ${f.relPath}`);
    }
  }

  // 3. Git remote & preserved commit history + no tracked .env
  const remote = runGit(['remote', 'get-url', 'origin']);
  assert.equal(remote.status, 0);
  assert.match(remote.stdout.trim(), /^https:\/\/github\.com\/HUGOxBOSSx\/Baby-buddy(?:\.git)?$/);

  const tracked = runGit(['ls-files']);
  assert.equal(tracked.status, 0);
  const envTracked = tracked.stdout
    .split(/\r?\n/)
    .filter((p) => /(?:^|\/)\.env(?:\.|$)/i.test(p) && !p.endsWith('.env.example'));
  assert.deepEqual(envTracked, [], `Tracked .env files: ${envTracked.join(', ')}`);
});
