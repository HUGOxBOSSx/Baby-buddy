import net from 'node:net';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { ROOT_DIR } from './paths.mjs';
import { killProcessTree, resolveWorkspaceBin, spawnNodeBin } from './proc.mjs';

export function getFreePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.unref();
    srv.on('error', reject);
    srv.listen(0, '127.0.0.1', () => {
      const addr = srv.address();
      if (!addr || typeof addr === 'string') {
        srv.close(() => reject(new Error('Failed to allocate ephemeral TCP port')));
        return;
      }
      const { port } = addr;
      srv.close((err) => (err ? reject(err) : resolve(port)));
    });
  });
}

function stripHtmlToText(html) {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function extractStylesheetHrefs(html) {
  const hrefs = [];
  const linkRe = /<link\b[^>]*>/gi;
  let match;
  while ((match = linkRe.exec(html)) !== null) {
    const tag = match[0];
    if (/rel\s*=\s*["']stylesheet["']/i.test(tag)) {
      const hrefMatch = /href\s*=\s*["']([^"']+)["']/i.exec(tag);
      if (hrefMatch?.[1]) {
        hrefs.push(hrefMatch[1]);
      }
    }
  }
  return [...new Set(hrefs)];
}

export async function startWebServer(opts = {}) {
  const webDir = opts.cwd ?? path.join(ROOT_DIR, 'apps', 'web');
  const nextBin = resolveWorkspaceBin(webDir, 'next', 'dist/bin/next');
  const port = await getFreePort();
  const baseUrl = `http://127.0.0.1:${port}`;
  const child = spawnNodeBin(nextBin, ['start', '-H', '127.0.0.1', '-p', String(port)], {
    cwd: webDir,
    env: opts.env,
  });

  let stdout = '';
  let stderr = '';
  child.stdout?.on('data', (chunk) => {
    stdout += chunk.toString('utf8');
  });
  child.stderr?.on('data', (chunk) => {
    stderr += chunk.toString('utf8');
  });

  const deadline = Date.now() + (opts.timeoutMs ?? 25_000);
  let ready = false;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(
        `next start exited early with code ${child.exitCode}.\nSTDOUT:\n${stdout}\nSTDERR:\n${stderr}`,
      );
    }
    try {
      const res = await fetch(`${baseUrl}/`, { signal: AbortSignal.timeout(2000) });
      if (res.status >= 200 && res.status < 500) {
        ready = true;
        break;
      }
    } catch {
      // keep polling
    }
    await delay(250);
  }

  if (!ready) {
    killProcessTree(child);
    throw new Error(
      `Timed out waiting for next start on ${baseUrl}.\nSTDOUT:\n${stdout}\nSTDERR:\n${stderr}`,
    );
  }

  async function getPage(routePath = '/') {
    const normalizedRoute = routePath.startsWith('/') ? routePath : `/${routePath}`;
    const res = await fetch(`${baseUrl}${normalizedRoute}`, {
      signal: AbortSignal.timeout(5000),
      headers: { Accept: 'text/html' },
    });
    const html = await res.text();
    const cssHrefs = extractStylesheetHrefs(html);
    const cssChunks = [];
    for (const href of cssHrefs) {
      const cssUrl = href.startsWith('http') ? href : `${baseUrl}${href.startsWith('/') ? href : `/${href}`}`;
      const cssRes = await fetch(cssUrl, { signal: AbortSignal.timeout(5000) });
      if (cssRes.ok) {
        cssChunks.push(await cssRes.text());
      }
    }
    const headers = Object.fromEntries(res.headers.entries());
    return {
      status: res.status,
      headers,
      html,
      cssBundleText: cssChunks.join('\n'),
      textContent: stripHtmlToText(html),
    };
  }

  function stop() {
    killProcessTree(child);
  }

  return { port, baseUrl, child, getPage, stop };
}
