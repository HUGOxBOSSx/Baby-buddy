import Constants from 'expo-constants';

export const CURRENT_APP_VERSION: string =
  Constants.expoConfig?.version ?? '0.1.0';

export const DEFAULT_RELEASES_URL =
  'https://github.com/HUGOxBOSSx/Baby-buddy/releases';

export const DEFAULT_RELEASES_API =
  'https://api.github.com/repos/HUGOxBOSSx/Baby-buddy/releases/latest';

export type UpdateCheckResult =
  | {
      readonly status: 'update_available';
      readonly currentVersion: string;
      readonly latestVersion: string;
      readonly apkUrl: string | null;
      readonly releasesUrl: string;
      readonly notesMx: string;
    }
  | {
      readonly status: 'up_to_date';
      readonly currentVersion: string;
      readonly latestVersion: string;
      readonly releasesUrl: string;
    }
  | {
      readonly status: 'manual_releases';
      readonly currentVersion: string;
      readonly releasesUrl: string;
      readonly messageMx: string;
    }
  | {
      readonly status: 'offline';
      readonly currentVersion: string;
      readonly releasesUrl: string;
      readonly messageMx: string;
    };

export function compareSemver(a: string, b: string): number {
  const clean = (v: string) =>
    v
      .trim()
      .replace(/^v/i, '')
      .split('-')[0]
      ?.split('.')
      .map((part) => Number.parseInt(part, 10) || 0) ?? [0, 0, 0];
  const pa = clean(a);
  const pb = clean(b);
  const len = Math.max(pa.length, pb.length, 3);
  for (let i = 0; i < len; i += 1) {
    const va = pa[i] ?? 0;
    const vb = pb[i] ?? 0;
    if (va > vb) return 1;
    if (va < vb) return -1;
  }
  return 0;
}

interface GitHubReleaseAsset {
  readonly name?: string;
  readonly browser_download_url?: string;
}

interface GitHubReleasePayload {
  readonly tag_name?: string;
  readonly body?: string;
  readonly html_url?: string;
  readonly assets?: readonly GitHubReleaseAsset[];
}

export async function checkForApkUpdate(): Promise<UpdateCheckResult> {
  const currentVersion = CURRENT_APP_VERSION;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 7000);
  try {
    const res = await fetch(DEFAULT_RELEASES_API, {
      signal: ctrl.signal,
      headers: {
        Accept: 'application/vnd.github+json',
      },
    });

    if (res.status === 401 || res.status === 403 || res.status === 404) {
      return {
        status: 'manual_releases',
        currentVersion,
        releasesUrl: DEFAULT_RELEASES_URL,
        messageMx:
          'Abre Releases en tu navegador (iniciando sesión en GitHub si el repositorio es privado) para descargar la última APK.',
      };
    }

    if (!res.ok) {
      return {
        status: 'offline',
        currentVersion,
        releasesUrl: DEFAULT_RELEASES_URL,
        messageMx: `No se pudo consultar actualizaciones (HTTP ${res.status}).`,
      };
    }

    const payload = (await res.json()) as GitHubReleasePayload;
    const rawTag = payload.tag_name ?? currentVersion;
    const latestVersion = rawTag.replace(/^v/i, '');
    const releasesUrl = payload.html_url ?? DEFAULT_RELEASES_URL;
    const apkAsset = payload.assets?.find((a) =>
      a.name?.toLowerCase().endsWith('.apk'),
    );
    const apkUrl = apkAsset?.browser_download_url ?? null;

    if (compareSemver(latestVersion, currentVersion) > 0) {
      return {
        status: 'update_available',
        currentVersion,
        latestVersion,
        apkUrl,
        releasesUrl,
        notesMx: (payload.body ?? '').trim().slice(0, 260),
      };
    }

    return {
      status: 'up_to_date',
      currentVersion,
      latestVersion,
      releasesUrl,
    };
  } catch {
    return {
      status: 'offline',
      currentVersion,
      releasesUrl: DEFAULT_RELEASES_URL,
      messageMx:
        'Sin conexión para verificar actualizaciones. Puedes revisar después.',
    };
  } finally {
    clearTimeout(timer);
  }
}
