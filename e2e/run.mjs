import path from 'node:path';
import { run } from 'node:test';
import { spec } from 'node:test/reporters';
import { CORE_ONLY, E2E_DIR, ROOT_DIR } from './helpers/paths.mjs';
import { diffFileSnapshots, snapshotFiles } from './helpers/proc.mjs';

const TIER_FILES = {
  1: ['tier1-features.test.mjs'],
  2: ['tier2-boundaries.test.mjs'],
  3: ['tier3-combinations.test.mjs'],
  4: ['tier4-scenarios.test.mjs'],
  all: [
    'tier1-features.test.mjs',
    'tier2-boundaries.test.mjs',
    'tier3-combinations.test.mjs',
    'tier4-scenarios.test.mjs',
  ],
};

function parseArgs(argv) {
  let tier = process.env.E2E_TIER ?? 'all';
  let pattern = null;

  for (const arg of argv) {
    if (arg.startsWith('--tier=')) {
      tier = arg.slice('--tier='.length).trim().toLowerCase();
    } else if (arg.startsWith('--pattern=')) {
      pattern = arg.slice('--pattern='.length);
    }
  }

  if (!(tier in TIER_FILES)) {
    throw new Error(`Invalid --tier="${tier}". Expected 1, 2, 3, 4, or all.`);
  }

  return {
    tier,
    files: TIER_FILES[tier].map((f) => path.join(E2E_DIR, f)),
    testNamePatterns: pattern ? [new RegExp(pattern)] : undefined,
  };
}

const { tier, files, testNamePatterns } = parseArgs(process.argv.slice(2));
const lockTargets = [
  path.join(ROOT_DIR, 'package.json'),
  path.join(ROOT_DIR, 'package-lock.json'),
];
const beforeSnapshot = snapshotFiles(lockTargets);

let hasFailure = false;
let skippedTopLevelOrLeaf = 0;

const stream = run({
  files,
  testNamePatterns,
  concurrency: false,
  timeout: 600_000,
});

stream.on('test:fail', (data) => {
  if (data.nesting === 0 || data.details?.type !== 'suite') {
    hasFailure = true;
  }
});

stream.on('test:pass', (data) => {
  if (data.skip !== undefined) {
    skippedTopLevelOrLeaf += 1;
  }
});

stream.compose(spec).pipe(process.stdout);

await new Promise((resolve) => {
  stream.on('end', resolve);
  stream.on('close', resolve);
});

const changedFiles = diffFileSnapshots(beforeSnapshot);
if (changedFiles.length > 0) {
  console.error(
    `\n[e2e/run.mjs] ERROR: Protected root manifest/lockfile modified during E2E execution:\n${JSON.stringify(changedFiles, null, 2)}`,
  );
  hasFailure = true;
}

if (!CORE_ONLY && skippedTopLevelOrLeaf > 0) {
  console.error(
    `\n[e2e/run.mjs] ERROR: ${skippedTopLevelOrLeaf} test(s) were skipped in default full mode (E2E_CORE_ONLY is unset; 0 skips required).`,
  );
  hasFailure = true;
}

if (CORE_ONLY) {
  console.log(
    `\n[e2e/run.mjs] E2E_CORE_ONLY=1 mode (tier=${tier}): skipped ${skippedTopLevelOrLeaf} app-dependent test(s).`,
  );
}

if (hasFailure) {
  process.exitCode = 1;
}
