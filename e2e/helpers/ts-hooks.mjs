import fs from 'node:fs';
import { registerHooks, stripTypeScriptTypes } from 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { ROOT_DIR } from './paths.mjs';

const WORKSPACE_PACKAGE_MAP = new Map([
  ['@baby-buddy/core', path.join(ROOT_DIR, 'packages', 'core')],
  ['@baby-buddy/content', path.join(ROOT_DIR, 'packages', 'content')],
]);

function resolveWorkspaceEntry(pkgDir) {
  const pkgJsonPath = path.join(pkgDir, 'package.json');
  const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
  const dotExport = pkgJson.exports?.['.'];
  const relEntry =
    typeof dotExport === 'string'
      ? dotExport
      : dotExport?.default ?? dotExport?.import ?? pkgJson.main ?? './src/index.ts';
  return path.resolve(pkgDir, relEntry);
}

function resolveTsRelativeCandidate(baseDir, specifier) {
  const rawTarget = path.resolve(baseDir, specifier);
  const candidates = [];

  if (specifier.endsWith('.js') || specifier.endsWith('.mjs')) {
    const stem = rawTarget.replace(/\.(?:m?js)$/, '');
    candidates.push(`${stem}.ts`, `${stem}.tsx`);
  }

  candidates.push(
    rawTarget,
    `${rawTarget}.ts`,
    `${rawTarget}.tsx`,
    path.join(rawTarget, 'index.ts'),
    path.join(rawTarget, 'index.tsx'),
  );

  for (const candidate of candidates) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return candidate;
    }
  }
  return null;
}

if (!globalThis.__babyBuddyTsHooksRegistered) {
  registerHooks({
    resolve(specifier, context, nextResolve) {
      try {
        return nextResolve(specifier, context);
      } catch (err) {
        if (WORKSPACE_PACKAGE_MAP.has(specifier)) {
          const entry = resolveWorkspaceEntry(WORKSPACE_PACKAGE_MAP.get(specifier));
          return {
            url: pathToFileURL(entry).href,
            shortCircuit: true,
          };
        }

        if (
          (specifier.startsWith('./') || specifier.startsWith('../')) &&
          context.parentURL?.startsWith('file:')
        ) {
          const parentPath = fileURLToPath(context.parentURL);
          const candidate = resolveTsRelativeCandidate(path.dirname(parentPath), specifier);
          if (candidate) {
            return {
              url: pathToFileURL(candidate).href,
              shortCircuit: true,
            };
          }
        }

        throw err;
      }
    },

    load(url, context, nextLoad) {
      if (url.startsWith('file:') && (url.endsWith('.ts') || url.endsWith('.tsx'))) {
        const filePath = fileURLToPath(url);
        const normPath = filePath.split(path.sep).join('/');
        const normRoot = ROOT_DIR.split(path.sep).join('/');
        if (normPath.startsWith(normRoot) && !normPath.includes('/node_modules/')) {
          const source = fs.readFileSync(filePath, 'utf8');
          const stripped = stripTypeScriptTypes(source, {
            mode: 'strip',
            sourceUrl: url,
          });
          return {
            format: 'module',
            source: stripped,
            shortCircuit: true,
          };
        }
      }
      return nextLoad(url, context);
    },
  });

  globalThis.__babyBuddyTsHooksRegistered = true;
}

export async function importCore() {
  return import('@baby-buddy/core');
}

export async function importContent() {
  return import('@baby-buddy/content');
}
