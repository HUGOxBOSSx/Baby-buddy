import { isRunningInExpoGo } from 'expo';
import type * as NotificationsType from 'expo-notifications';
import { Platform } from 'react-native';

const ALERTS_CHANNEL_ID = 'baby-buddy-alerts';
const TIMERS_CHANNEL_ID = 'baby-buddy-timers';

let handlerConfigured = false;

export function isUnsupportedInCurrentExpoRuntime(): boolean {
  return Platform.OS === 'android' && isRunningInExpoGo();
}

async function getNotificationsModule(): Promise<typeof NotificationsType | null> {
  if (Platform.OS === 'web' || isUnsupportedInCurrentExpoRuntime()) {
    return null;
  }
  try {
    const raw = (await import('expo-notifications')) as unknown as
      | (typeof NotificationsType & { readonly default?: typeof NotificationsType })
      | undefined;
    const mod = raw && 'default' in raw && raw.default ? raw.default : raw;
    if (!mod) return null;
    if (!handlerConfigured && typeof mod.setNotificationHandler === 'function') {
      handlerConfigured = true;
      mod.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: false,
          shouldSetBadge: false,
        }),
      });
    }
    return mod;
  } catch {
    return null;
  }
}

async function ensureChannels(mod: typeof NotificationsType): Promise<void> {
  if (Platform.OS !== 'android') return;
  if (typeof mod.setNotificationChannelAsync !== 'function') return;
  try {
    // AndroidImportance: 3 = DEFAULT, 2 = LOW
    await mod.setNotificationChannelAsync(ALERTS_CHANNEL_ID, {
      name: 'Recordatorios y alertas',
      importance: 3,
    });
    await mod.setNotificationChannelAsync(TIMERS_CHANNEL_ID, {
      name: 'Registros en curso (siesta y tomas)',
      importance: 2,
    });
  } catch {
    // Expo Go on some Android versions may restrict channel creation.
  }
}

function isPermissionGranted(
  perm: NotificationsType.NotificationPermissionsStatus,
): boolean {
  const base = perm as {
    readonly granted?: boolean;
    readonly status?: string;
  };
  if (base.granted === true || base.status === 'granted') {
    return true;
  }
  const iosStatus = perm.ios?.status;
  // IosAuthorizationStatus: 2 = AUTHORIZED, 3 = PROVISIONAL
  return iosStatus === 2 || iosStatus === 3;
}

export async function requestMobileNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false;
    }
    try {
      const res = await Notification.requestPermission();
      return res === 'granted';
    } catch {
      return false;
    }
  }
  try {
    const mod = await getNotificationsModule();
    if (!mod) return false;
    await ensureChannels(mod);
    if (
      typeof mod.getPermissionsAsync !== 'function' ||
      typeof mod.requestPermissionsAsync !== 'function'
    ) {
      return false;
    }
    const existing = await mod.getPermissionsAsync();
    if (isPermissionGranted(existing)) return true;
    const requested = await mod.requestPermissionsAsync();
    return isPermissionGranted(requested);
  } catch {
    return false;
  }
}

export async function sendLocalNotification(opts: {
  readonly id: string;
  readonly title: string;
  readonly body: string;
  readonly channelId?: 'baby-buddy-alerts' | 'baby-buddy-timers';
  readonly data?: Record<string, string>;
}): Promise<void> {
  if (Platform.OS === 'web') {
    if (
      typeof window !== 'undefined' &&
      'Notification' in window &&
      Notification.permission === 'granted'
    ) {
      new Notification(opts.title, {
        body: opts.body,
        tag: opts.id,
        silent: opts.channelId === TIMERS_CHANNEL_ID,
      });
    }
    return;
  }
  try {
    const mod = await getNotificationsModule();
    if (!mod || typeof mod.scheduleNotificationAsync !== 'function') return;
    await ensureChannels(mod);
    await mod.scheduleNotificationAsync({
      identifier: opts.id,
      content: {
        title: opts.title,
        body: opts.body,
        data: opts.data,
        ...(Platform.OS === 'android'
          ? { channelId: opts.channelId ?? ALERTS_CHANNEL_ID }
          : {}),
      },
      trigger: null,
    });
  } catch {
    // Ignore when running on simulators or unsupported environments.
  }
}

export async function dismissLocalNotification(id: string): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    const mod = await getNotificationsModule();
    if (!mod || typeof mod.dismissNotificationAsync !== 'function') return;
    await mod.dismissNotificationAsync(id);
  } catch {
    // Ignore if already dismissed.
  }
}

export function subscribeNotificationResponse(
  onNavigateTab: (tab: string) => void,
): () => void {
  if (Platform.OS === 'web') {
    return () => {};
  }
  let cancelled = false;
  let removeFn: (() => void) | null = null;
  void getNotificationsModule()
    .then((mod) => {
      if (
        !mod ||
        cancelled ||
        typeof mod.addNotificationResponseReceivedListener !== 'function'
      ) {
        return;
      }
      const sub = mod.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data as
          | { readonly tab?: string }
          | undefined;
        if (data?.tab) {
          onNavigateTab(data.tab);
        }
      });
      removeFn = () => sub.remove();
    })
    .catch(() => {});
  return () => {
    cancelled = true;
    removeFn?.();
  };
}
