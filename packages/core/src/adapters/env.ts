export interface OfflineEnvConfig {
  readonly mode: 'offline_local';
  readonly supabaseUrl: string | null;
  readonly supabaseAnonKeyConfigured: boolean;
  readonly geminiApiKeyConfigured: boolean;
  readonly vercelEnv: 'local';
  readonly hasLiveCredentials: false;
}

export function loadOfflineEnvConfig(
  envSource: Record<string, string | undefined> = typeof process !==
    'undefined' && process.env
    ? process.env
    : {},
): OfflineEnvConfig {
  const rawSupabaseUrl =
    envSource.NEXT_PUBLIC_SUPABASE_URL ??
    envSource.EXPO_PUBLIC_SUPABASE_URL ??
    '';
  const trimmedUrl = rawSupabaseUrl.trim();

  const rawAnonKey =
    envSource.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    envSource.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
    '';

  const rawGeminiKey = envSource.GEMINI_API_KEY ?? '';

  return {
    mode: 'offline_local',
    supabaseUrl: trimmedUrl.length > 0 ? trimmedUrl : null,
    supabaseAnonKeyConfigured: rawAnonKey.trim().length > 0,
    geminiApiKeyConfigured: rawGeminiKey.trim().length > 0,
    vercelEnv: 'local',
    hasLiveCredentials: false,
  };
}
