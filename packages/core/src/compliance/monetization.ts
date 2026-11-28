/**
 * Deterministic monetization and ethical ad-window policy for Baby Buddy MX.
 * Enforces always-free safety surfaces (including 911), Pro tier gating,
 * and fixed local quiet hours (22:00-06:00 h) for free-tier banner ads.
 */

export type PlanTier = 'free' | 'pro';

export type AppSurface =
  | 'daily_log'
  | 'guides_basic'
  | 'guides_advanced'
  | 'clothing'
  | 'health_journal'
  | 'emergency_911'
  | 'family_cloud_sync'
  | 'child_screen';

export interface AdBannerPolicyInput {
  readonly plan: PlanTier;
  readonly surface: AppSurface;
  readonly localHour: number;
}

export const AD_QUIET_HOURS_LOCAL = {
  startHour: 22,
  endHour: 6,
} as const;

export const ALWAYS_FREE_SURFACES: readonly AppSurface[] = [
  'daily_log',
  'guides_basic',
  'clothing',
  'health_journal',
  'emergency_911',
] as const;

export const PRO_ONLY_SURFACES: readonly AppSurface[] = [
  'guides_advanced',
  'family_cloud_sync',
] as const;

/**
 * Returns true when the given local hour (0-23) falls inside the fixed
 * quiet window (22:00 inclusive through 05:59, i.e., before 06:00).
 * Non-finite values fail safe to true so ads are suppressed.
 */
export function isWithinAdQuietHours(localHour: number): boolean {
  if (!Number.isFinite(localHour)) {
    return true;
  }
  const normalizedHour = Math.floor(((localHour % 24) + 24) % 24);
  return (
    normalizedHour >= AD_QUIET_HOURS_LOCAL.startHour ||
    normalizedHour < AD_QUIET_HOURS_LOCAL.endHour
  );
}

/**
 * Determines whether a discreet free-tier banner ad may be shown.
 * Never allows ads on Pro, on 911/triage, on child-facing screens,
 * or during fixed local quiet hours (22:00-06:00 h).
 */
export function isAdBannerAllowed(input: AdBannerPolicyInput): boolean {
  if (input.plan === 'pro') {
    return false;
  }
  if (input.surface === 'emergency_911' || input.surface === 'child_screen') {
    return false;
  }
  return !isWithinAdQuietHours(input.localHour);
}

/**
 * Determines whether a user on the given plan can access a product surface.
 * Always-free surfaces (especially emergency_911) are never restricted.
 */
export function canAccessSurface(plan: PlanTier, surface: AppSurface): boolean {
  if (ALWAYS_FREE_SURFACES.includes(surface)) {
    return true;
  }
  if (plan === 'pro') {
    return true;
  }
  return !PRO_ONLY_SURFACES.includes(surface);
}
