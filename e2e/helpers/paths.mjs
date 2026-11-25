import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const E2E_DIR = path.resolve(__dirname, '..');
export const ROOT_DIR = path.resolve(E2E_DIR, '..');
export const PACKAGES_DIR = path.join(ROOT_DIR, 'packages');
export const APPS_DIR = path.join(ROOT_DIR, 'apps');
export const CORE_ONLY = process.env.E2E_CORE_ONLY === '1';

export const DEFAULT_IGNORE_DIRS = new Set([
  'node_modules',
  '.git',
  '.next',
  '.expo',
  'dist',
  'out',
  'build',
  'coverage',
  '.turbo',
]);

export function toPosixRel(absPath, baseDir = ROOT_DIR) {
  return path.relative(baseDir, absPath).split(path.sep).join('/');
}

/**
 * Recursively walk workspace files safely (handles spaces in path, skips heavy/build dirs).
 * @param {string} startDir
 * @param {{
 *   ignoreDirs?: Set<string>,
 *   ignoreRelPrefixes?: string[],
 *   extensions?: Set<string> | null,
 * }} [opts]
 * @returns {Array<{ absPath: string, relPath: string }>}
 */
export function walkFiles(startDir = ROOT_DIR, opts = {}) {
  const ignoreDirs = opts.ignoreDirs ?? DEFAULT_IGNORE_DIRS;
  const ignoreRelPrefixes = opts.ignoreRelPrefixes ?? [];
  const extensions = opts.extensions ?? null;
  const results = [];

  if (!fs.existsSync(startDir)) {
    return results;
  }

  function visit(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const absPath = path.join(currentDir, entry.name);
      const relPath = toPosixRel(absPath, ROOT_DIR);

      if (ignoreRelPrefixes.some((prefix) => relPath === prefix.replace(/\/$/, '') || relPath.startsWith(prefix))) {
        continue;
      }

      if (entry.isDirectory()) {
        if (ignoreDirs.has(entry.name)) {
          continue;
        }
        visit(absPath);
      } else if (entry.isFile()) {
        if (extensions && !extensions.has(path.extname(entry.name).toLowerCase())) {
          continue;
        }
        results.push({ absPath, relPath });
      }
    }
  }

  visit(startDir);
  results.sort((a, b) => a.relPath.localeCompare(b.relPath));
  return results;
}

export function readTextSafe(absPath) {
  return fs.readFileSync(absPath, 'utf8');
}

export function readJsonSafe(absPath) {
  return JSON.parse(fs.readFileSync(absPath, 'utf8'));
}
