import { describe, expect, it } from 'vitest';
import {
  AD_QUIET_HOURS_LOCAL,
  ALWAYS_FREE_SURFACES,
  canAccessSurface,
  isAdBannerAllowed,
  isWithinAdQuietHours,
  type AppSurface,
} from '../compliance/monetization';

describe('monetization & ethical ad-window policy', () => {
  it('defines fixed quiet hours from 22:00 to 06:00 local time', () => {
    expect(AD_QUIET_HOURS_LOCAL).toEqual({ startHour: 22, endHour: 6 });

    for (let hour = 0; hour < 24; hour += 1) {
      const expectedQuiet = hour >= 22 || hour < 6;
      expect(isWithinAdQuietHours(hour)).toBe(expectedQuiet);
    }

    expect(isWithinAdQuietHours(Number.NaN)).toBe(true);
  });

  it('evaluates isAdBannerAllowed across all 24 hours for free vs pro and safety surfaces', () => {
    for (let hour = 0; hour < 24; hour += 1) {
      const expectedDaytimeFree = hour >= 6 && hour < 22;

      expect(
        isAdBannerAllowed({ plan: 'free', surface: 'daily_log', localHour: hour }),
      ).toBe(expectedDaytimeFree);

      expect(
        isAdBannerAllowed({ plan: 'pro', surface: 'daily_log', localHour: hour }),
      ).toBe(false);

      expect(
        isAdBannerAllowed({ plan: 'free', surface: 'emergency_911', localHour: hour }),
      ).toBe(false);

      expect(
        isAdBannerAllowed({ plan: 'free', surface: 'child_screen', localHour: hour }),
      ).toBe(false);
    }
  });

  it('never restricts ALWAYS_FREE_SURFACES including emergency_911 on any plan', () => {
    for (const surface of ALWAYS_FREE_SURFACES) {
      expect(canAccessSurface('free', surface)).toBe(true);
      expect(canAccessSurface('pro', surface)).toBe(true);
    }
    expect(canAccessSurface('free', 'emergency_911')).toBe(true);
  });

  it('gates only Pro surfaces for free plan while allowing them on pro plan', () => {
    const proOnly: readonly AppSurface[] = ['guides_advanced', 'family_cloud_sync'];
    for (const surface of proOnly) {
      expect(canAccessSurface('free', surface)).toBe(false);
      expect(canAccessSurface('pro', surface)).toBe(true);
    }
  });
});
