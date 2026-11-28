export type WebNotificationPermissionState =
  | NotificationPermission
  | 'unsupported';

export function isWebNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getWebNotificationPermission(): WebNotificationPermissionState {
  if (!isWebNotificationSupported()) {
    return 'unsupported';
  }
  return Notification.permission;
}

export async function requestWebNotificationPermission(): Promise<WebNotificationPermissionState> {
  if (!isWebNotificationSupported()) {
    return 'unsupported';
  }
  try {
    return await Notification.requestPermission();
  } catch {
    return Notification.permission;
  }
}

export function showWebNotification(opts: {
  readonly title: string;
  readonly body: string;
  readonly tag: string;
  readonly silent?: boolean;
  readonly onClickUrl?: string;
}): void {
  if (!isWebNotificationSupported()) return;
  if (Notification.permission !== 'granted') return;
  try {
    const notification = new Notification(opts.title, {
      body: opts.body,
      tag: opts.tag,
      silent: opts.silent ?? false,
    });
    notification.onclick = () => {
      window.focus();
      if (opts.onClickUrl) {
        window.location.assign(opts.onClickUrl);
      }
      notification.close();
    };
  } catch {
    // Some mobile browsers expose Notification constructor that throws in non-SW contexts.
  }
}
