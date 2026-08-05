import { isRunningInExpoGo } from 'expo';
import * as Device from 'expo-device';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';

import { isNativeBuildEnabled } from '@/config/native-build';
import {
  formatFocusCountdown,
  getSessionProgressPercent,
  type FocusSessionRecord,
} from '@/services/focus/focus-session-store';

export const FOCUS_SESSION_CHANNEL_ID = 'kivo-focus-session';
export const FOCUS_SESSION_NOTIFICATION_ID = 'kivo-focus-session-active';

export const FOCUS_ACTION_COMPLETE = 'focus_complete';
export const FOCUS_ACTION_POSTPONE = 'focus_postpone';
export const FOCUS_ACTION_EXTEND = 'focus_extend';
export const FOCUS_ACTION_STOP = 'focus_stop';

export const FOCUS_POSTPONE_MINUTES = 10;
export const FOCUS_EXTEND_MINUTES = 25;

type NotifeeBundle = typeof import('@notifee/react-native');

let notifeeModulePromise: Promise<NotifeeBundle | null> | null = null;
let channelReady = false;
let foregroundServiceRegistered = false;

function canUseFocusNotifications(): boolean {
  return (
    isNativeBuildEnabled() &&
    Platform.OS === 'android' &&
    Device.isDevice &&
    !isRunningInExpoGo()
  );
}

async function getNotifee(): Promise<NotifeeBundle | null> {
  if (!canUseFocusNotifications()) return null;

  if (!notifeeModulePromise) {
    notifeeModulePromise = import('@notifee/react-native')
      .then((mod) => mod)
      .catch(() => null);
  }

  return notifeeModulePromise;
}

export function buildFocusSessionDeepLink(): string {
  return Linking.createURL('/focus-session');
}

async function ensureFocusChannel(notifee: NotifeeBundle): Promise<string> {
  if (channelReady) return FOCUS_SESSION_CHANNEL_ID;

  await notifee.default.createChannel({
    id: FOCUS_SESSION_CHANNEL_ID,
    name: 'Sesión Focus',
    importance: notifee.AndroidImportance.DEFAULT,
    visibility: notifee.AndroidVisibility.PUBLIC,
    vibration: false,
    lights: true,
    lightColor: '#C4B5FD',
  });

  channelReady = true;
  return FOCUS_SESSION_CHANNEL_ID;
}

export async function registerFocusForegroundService(): Promise<void> {
  const notifee = await getNotifee();
  if (!notifee || foregroundServiceRegistered) return;

  try {
    notifee.default.registerForegroundService(() => {
      return new Promise(() => {
        // Kept alive until stopForegroundService / cancelNotification.
      });
    });
    foregroundServiceRegistered = true;
  } catch {
    // Already registered or unavailable.
  }
}

export async function displayFocusSessionNotification(
  session: FocusSessionRecord,
  options: { asForegroundService?: boolean } = {},
): Promise<void> {
  const notifee = await getNotifee();
  if (!notifee) return;

  await registerFocusForegroundService();
  const channelId = await ensureFocusChannel(notifee);
  const remainingMs = Math.max(0, session.endsAt - Date.now());
  const timerText = formatFocusCountdown(remainingMs);
  const progress = getSessionProgressPercent(session);
  const deepLink = buildFocusSessionDeepLink();
  const asForegroundService = options.asForegroundService ?? session.effectiveIntensity === 'strict';

  await notifee.default.displayNotification({
    id: FOCUS_SESSION_NOTIFICATION_ID,
    title: 'Sesión Focus',
    body: `${session.title} · ${timerText} · ${progress}%`,
    subtitle: 'EN CURSO',
    data: {
      kind: 'focus-session',
      taskId: session.taskId,
      title: session.title,
      endsAt: String(session.endsAt),
      startedAt: String(session.startedAt),
      intensity: session.intensity,
      effectiveIntensity: session.effectiveIntensity,
      deepLink,
    },
    android: {
      channelId,
      asForegroundService,
      ongoing: true,
      autoCancel: false,
      onlyAlertOnce: true,
      pressAction: {
        id: 'default',
        launchActivity: 'default',
      },
      actions: [
        {
          title: 'Completar',
          pressAction: { id: FOCUS_ACTION_COMPLETE },
        },
        {
          title: 'Posponer',
          pressAction: { id: FOCUS_ACTION_POSTPONE },
        },
        {
          title: 'Aumentar',
          pressAction: { id: FOCUS_ACTION_EXTEND },
        },
        {
          title: 'Desactivar',
          pressAction: { id: FOCUS_ACTION_STOP },
        },
      ],
      color: '#C4B5FD',
      progress: {
        max: 100,
        current: progress,
        indeterminate: false,
      },
    },
  });
}

export async function updateFocusSessionNotification(session: FocusSessionRecord): Promise<void> {
  await displayFocusSessionNotification(session, {
    asForegroundService: session.effectiveIntensity === 'strict',
  });
}

export async function cancelFocusSessionNotification(): Promise<void> {
  const notifee = await getNotifee();
  if (!notifee) return;

  try {
    await notifee.default.stopForegroundService();
  } catch {
    // Not running as FGS.
  }

  try {
    await notifee.default.cancelNotification(FOCUS_SESSION_NOTIFICATION_ID);
  } catch {
    // Already cancelled.
  }
}

export function canUseFocusSessionNotifications(): boolean {
  return canUseFocusNotifications();
}
