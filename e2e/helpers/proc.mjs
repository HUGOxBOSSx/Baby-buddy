import { spawn, spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { ROOT_DIR } from './paths.mjs';

export function getNpmCliPath() {
  const envExec = process.env.npm_execpath;
  if (envExec && (envExec.endsWith('.js') || envExec.endsWith('.cjs')) && fs.existsSync(envExec)) {
    return envExec;
  }
  const nodeDir = path.dirname(process.execPath);
  const candidates =
    process.platform === 'win32'
      ? [path.join(nodeDir, 'node_modules', 'npm', 'bin', 'npm-cli.js')]
      : [
          path.resolve(nodeDir, '..', 'lib', 'node_modules', 'npm', 'bin', 'npm-cli.js'),
          path.join(nodeDir, 'node_modules', 'npm', 'bin', 'npm-cli.js'),
        ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  throw new Error(`Unable to locate npm-cli.js relative to ${process.execPath}`);
}

export function sanitizeOfflineEnv(extraEnv = {}) {
  return {
    ...process.env,
    APP_ENV: 'local',
    NEXT_PUBLIC_APP_MODE: 'offline',
    EXPO_PUBLIC_APP_MODE: 'offline',
    EXPO_NO_TELEMETRY: '1',
    EXPO_OFFLINE: '1',
    BABY_BUDDY_AI_ENABLED: 'false',
    NEXT_PUBLIC_SUPABASE_URL: '',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: '',
    EXPO_PUBLIC_SUPABASE_URL: '',
    EXPO_PUBLIC_SUPABASE_ANON_KEY: '',
    GEMINI_API_KEY: '',
    VERCEL_ENV: 'local',
    FORCE_COLOR: '0',
    ...extraEnv,
  };
}

export function runNodeScript(scriptPath, args = [], opts = {}) {
  return spawnSync(process.execPath, [scriptPath, ...args], {
    cwd: opts.cwd ?? ROOT_DIR,
    env: sanitizeOfflineEnv(opts.env),
    encoding: 'utf8',
    shell: false,
    maxBuffer: 25 * 1024 * 1024,
    timeout: opts.timeoutMs ?? 300_000,
  });
}

export function runNpm(args, opts = {}) {
  return runNodeScript(getNpmCliPath(), args, opts);
}

export function runGit(args, opts = {}) {
  return spawnSync('git', args, {
    cwd: opts.cwd ?? ROOT_DIR,
    encoding: 'utf8',
    shell: false,
    maxBuffer: 10 * 1024 * 1024,
    timeout: opts.timeoutMs ?? 30_000,
  });
}

export function resolveWorkspaceBin(workspaceDir, pkgName, binRelPath) {
  const pkgJsonPath = path.join(workspaceDir, 'package.json');
  const req = createRequire(pkgJsonPath);
  const targetPkgJson = req.resolve(`${pkgName}/package.json`);
  const resolved = path.join(path.dirname(targetPkgJson), binRelPath);
  if (!fs.existsSync(resolved)) {
    throw new Error(`Resolved binary does not exist: ${resolved}`);
  }
  return resolved;
}

export function spawnNodeBin(binPath, args = [], opts = {}) {
  return spawn(process.execPath, [binPath, ...args], {
    cwd: opts.cwd ?? ROOT_DIR,
    env: sanitizeOfflineEnv(opts.env),
    shell: false,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

export function killProcessTree(child) {
  if (!child || child.pid == null || child.exitCode !== null) {
    return;
  }
  if (process.platform === 'win32') {
    spawnSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], {
      shell: false,
      stdio: 'ignore',
    });
    return;
  }
  try {
    child.kill('SIGTERM');
  } catch {
    // ignore
  }
  if (child.exitCode === null) {
    try {
      child.kill('SIGKILL');
    } catch {
      // ignore
    }
  }
}

export function sha256File(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  const buf = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(buf).digest('hex');
}

export function snapshotFiles(filePaths) {
  const map = new Map();
  for (const filePath of filePaths) {
    map.set(filePath, sha256File(filePath));
  }
  return map;
}

export function diffFileSnapshots(beforeMap) {
  const changed = [];
  for (const [filePath, beforeHash] of beforeMap.entries()) {
    const afterHash = sha256File(filePath);
    if (beforeHash !== afterHash) {
      changed.push({ filePath, beforeHash, afterHash });
    }
  }
  return changed;
}
