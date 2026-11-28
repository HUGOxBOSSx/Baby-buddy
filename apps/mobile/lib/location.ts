import type * as LocationType from 'expo-location';
import { Platform } from 'react-native';

export interface DeviceCoords {
  readonly lat: number;
  readonly lon: number;
  readonly city?: string;
}

async function getLocationModule(): Promise<typeof LocationType | null> {
  if (Platform.OS === 'web') return null;
  try {
    const raw = (await import('expo-location')) as unknown as
      | (typeof LocationType & { readonly default?: typeof LocationType })
      | undefined;
    const mod = raw && 'default' in raw && raw.default ? raw.default : raw;
    return mod ?? null;
  } catch {
    return null;
  }
}

export async function requestMobileLocationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') {
    if (
      typeof window === 'undefined' ||
      !window.isSecureContext ||
      typeof navigator === 'undefined' ||
      !navigator.geolocation
    ) {
      return false;
    }
    return new Promise<boolean>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        () => resolve(true),
        () => resolve(false),
        { timeout: 5000, maximumAge: 600_000 },
      );
    });
  }
  try {
    const mod = await getLocationModule();
    if (
      !mod ||
      typeof mod.getForegroundPermissionsAsync !== 'function' ||
      typeof mod.requestForegroundPermissionsAsync !== 'function'
    ) {
      return false;
    }
    const existing = await mod.getForegroundPermissionsAsync();
    if (existing.granted) return true;
    const requested = await mod.requestForegroundPermissionsAsync();
    return requested.granted;
  } catch {
    return false;
  }
}

export async function getCurrentDeviceCoords(): Promise<DeviceCoords | null> {
  if (Platform.OS === 'web') {
    if (
      typeof window === 'undefined' ||
      !window.isSecureContext ||
      typeof navigator === 'undefined' ||
      !navigator.geolocation
    ) {
      return null;
    }
    return new Promise<DeviceCoords | null>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          resolve({
            lat: pos.coords.latitude,
            lon: pos.coords.longitude,
          }),
        () => resolve(null),
        { timeout: 6000, maximumAge: 300_000 },
      );
    });
  }

  try {
    const mod = await getLocationModule();
    if (
      !mod ||
      typeof mod.getForegroundPermissionsAsync !== 'function' ||
      typeof mod.getCurrentPositionAsync !== 'function'
    ) {
      return null;
    }
    const perm = await mod.getForegroundPermissionsAsync();
    if (!perm.granted) return null;

    const last =
      typeof mod.getLastKnownPositionAsync === 'function'
        ? await mod.getLastKnownPositionAsync()
        : null;
    const pos =
      last ??
      (await mod.getCurrentPositionAsync({
        // LocationAccuracy.Balanced = 3
        accuracy: 3,
      }));
    const lat = pos.coords.latitude;
    const lon = pos.coords.longitude;
    let city: string | undefined;
    try {
      if (typeof mod.reverseGeocodeAsync === 'function') {
        const places = await mod.reverseGeocodeAsync({
          latitude: lat,
          longitude: lon,
        });
        const first = places[0];
        city = first?.city ?? first?.subregion ?? first?.region ?? undefined;
      }
    } catch {
      // Reverse geocoding is optional.
    }
    return { lat, lon, city };
  } catch {
    return null;
  }
}
