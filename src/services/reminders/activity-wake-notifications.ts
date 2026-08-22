import { isRunningInExpoGo } from 'expo';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

import { isNativeBuildEnabled } from '@/config/native-build';
import {
  DEFAULT_REMINDER_ALERT_SOUND,
  DEFAULT_REMINDER_ALERT_VIBRATION,
  resolveNativeSoundName,
  resolveVibrationPattern,
  toNotifeeVibrationPattern,
  type ReminderAlertSoundId,
  type ReminderAlertVibrationId,
} from '@/services/reminders/reminder-alert-presets';
import { resolveAlertSoundUri } from '@/services/reminders/alert-sound-uri';
import type { ReminderAlertStyle } from '@/services/reminders/reminder-alert-style';
import {
  ACTIVITY_SOON_ID_PREFIX,
  type ReminderScheduleItem,
} from '@/services/reminders/reminder-rules';

export const ACTIVITY_WAKE_CHANNEL_ID = 'kivo-activity-wake';
export const ACTIVITY_WAKE_ID_PREFIX = 'kivo-wake-';

type AlertMediaOptions = {
  soundId?: ReminderAlertSoundId;
  vibrationId?: ReminderAlertVibrationId;
};

type NotifeeBundle = typeof import('@notifee/react-native');

let notifeeModulePromise: Promise<NotifeeBundle | null> | null = null;
let channelReadyKey: string | null = null;

function normalizeMedia(options?: AlertMediaOptions) {
  return {
    soundId: options?.soundId ?? DEFAULT_REMINDER_ALERT_SOUND,
    vibrationId: options?.vibrationId ?? DEFAULT_REMINDER_ALERT_VIBRATION,
  };
}

function canUseWakeAlerts(): boolean {
  return (
    isNativeBuildEnabled() &&
    Platform.OS === 'android' &&
    Device.isDevice &&
    !isRunningInExpoGo()
  );
}

async function getNotifee(): Promise<NotifeeBundle | null> {
  if (!canUseWakeAlerts()) return null;

  if (!notifeeModulePromise) {
    notifeeModulePromise = import('@notifee/react-native')
      .then((mod) => mod)
      .catch(() => null);
  }

  return notifeeModulePromise;
}

function isActivitySoonItem(item: ReminderScheduleItem): boolean {
  return item.kind === 'activity-warning' && item.id.startsWith(ACTIVITY_SOON_ID_PREFIX);
}

function toWakeNotificationId(scheduleId: string): string {
  return `${ACTIVITY_WAKE_ID_PREFIX}${scheduleId}`;
}

async function ensureWakeChannel(
  notifee: NotifeeBundle,
  alertStyle: ReminderAlertStyle,
  media: AlertMediaOptions = {},
): Promise<string> {
  const { soundId, vibrationId } = normalizeMedia(media);
  const soundUri =
    soundId === 'custom' || soundId === 'system'
      ? await resolveAlertSoundUri(soundId)
      : null;
  const soundKey = soundUri ? `uri-${soundUri.slice(-24)}` : soundId;
  const channelId = `${ACTIVITY_WAKE_CHANNEL_ID}-${soundKey}-${vibrationId}`;
  const cacheKey = `${alertStyle}:${channelId}`;
  if (channelReadyKey === cacheKey) return channelId;

  await notifee.default.createChannel({
    id: channelId,
    name: 'Aviso de actividad (enciende pantalla)',
    importance: notifee.AndroidImportance.HIGH,
    visibility: notifee.AndroidVisibility.PUBLIC,
    // −30 min heads-up always sounds and vibrates (notification style, not looping alarm).
    sound: soundUri ?? resolveNativeSoundName(soundId, true) ?? 'default',
    vibration: true,
    vibrationPattern: toNotifeeVibrationPattern(resolveVibrationPattern(vibrationId, false)),
    lights: true,
    lightColor: '#C4B5FD',
  });

  // Base ID matches Expo Push channelId from the backend.
  await notifee.default.createChannel({
    id: ACTIVITY_WAKE_CHANNEL_ID,
    name: 'Aviso de actividad',
    importance: notifee.AndroidImportance.HIGH,
    visibility: notifee.AndroidVisibility.PUBLIC,
    sound: soundUri ?? resolveNativeSoundName(soundId, true) ?? 'default',
    vibration: true,
    vibrationPattern: toNotifeeVibrationPattern(resolveVibrationPattern(vibrationId, false)),
    lights: true,
    lightColor: '#C4B5FD',
  });

  channelReadyKey = cacheKey;
  return channelId;
}

function buildWakeAndroidConfig(
  notifee: NotifeeBundle,
  channelId: string,
  vibrationId: ReminderAlertVibrationId,
) {
  return {
    channelId,
    // EVENT is widely supported; lights the lock-screen heads-up without alarm UI.
    category: notifee.AndroidCategory.EVENT,
    importance: notifee.AndroidImportance.HIGH,
    visibility: notifee.AndroidVisibility.PUBLIC,
    pressAction: {
      id: 'default',
      launchActivity: 'default',
    },
    // Do NOT use fullScreenAction here — that opens the app like an alarm.
    // lightUpScreen + HIGH channel is enough for the −30 min notification.
    lightUpScreen: true,
    sound: 'default',
    vibrationPattern: toNotifeeVibrationPattern(resolveVibrationPattern(vibrationId, false)),
    autoCancel: true,
    color: '#C4B5FD',
  };
}

export async function cancelAllActivityWakeAlerts(): Promise<void> {
  const notifee = await getNotifee();
  if (!notifee) return;

  try {
    const ids = await notifee.default.getTriggerNotificationIds();
    const wakeIds = ids.filter((id) => id.startsWith(ACTIVITY_WAKE_ID_PREFIX));
    await Promise.all(wakeIds.map((id) => notifee.default.cancelNotification(id)));
  } catch {
    // Native module unavailable.
  }
}

async function scheduleOneWakeAlert(
  notifee: NotifeeBundle,
  item: ReminderScheduleItem,
  alertStyle: ReminderAlertStyle,
  media: AlertMediaOptions = {},
): Promise<void> {
  const channelId = await ensureWakeChannel(notifee, alertStyle, media);
  const { soundId, vibrationId } = normalizeMedia(media);

  await notifee.default.createTriggerNotification(
    {
      id: toWakeNotificationId(item.id),
      title: item.title,
      body: item.body,
      data: {
        recordId: item.recordId,
        scheduleId: item.id,
        kind: item.kind,
        alertStyle,
        soundId,
        vibrationId,
        openWakeAlert: '1',
        activityTitle: item.body,
      },
      android: buildWakeAndroidConfig(notifee, channelId, vibrationId),
    },
    {
      type: notifee.TriggerType.TIMESTAMP,
      timestamp: item.triggerAt.getTime(),
      alarmManager: {
        allowWhileIdle: true,
      },
    },
  );
}

/** Schedule Android wake alerts for timed activities (−30 min). */
export async function syncActivityWakeAlerts(
  schedule: ReminderScheduleItem[],
  enabled: boolean,
  alertStyle: ReminderAlertStyle = 'both',
  media: AlertMediaOptions = {},
): Promise<void> {
  const notifee = await getNotifee();
  if (!notifee) return;

  await cancelAllActivityWakeAlerts();
  if (!enabled) return;

  const soonItems = schedule.filter(isActivitySoonItem);
  await Promise.allSettled(
    soonItems.map((item) => scheduleOneWakeAlert(notifee, item, alertStyle, media)),
  );
}

/** Immediately show a wake heads-up (used when a remote push arrives). */
export async function presentActivityWakeAlert(input: {
  recordId: string;
  title: string;
  body: string;
  scheduleId?: string;
  alertStyle?: ReminderAlertStyle;
  media?: AlertMediaOptions;
}): Promise<boolean> {
  const notifee = await getNotifee();
  if (!notifee) return false;

  try {
    const { markReminderPresented, wasRecentlyPresented } = await import(
      '@/services/reminders/reminder-present-dedupe'
    );
    const alertStyle = input.alertStyle ?? 'both';
    const media = normalizeMedia(input.media);
    const scheduleId = input.scheduleId ?? `${ACTIVITY_SOON_ID_PREFIX}${input.recordId}`;
    if (wasRecentlyPresented(scheduleId)) return false;

    const channelId = await ensureWakeChannel(notifee, alertStyle, media);

    await notifee.default.displayNotification({
      id: toWakeNotificationId(scheduleId),
      title: input.title || 'Actividad en 30 minutos',
      body: input.body,
      data: {
        recordId: input.recordId,
        scheduleId,
        kind: 'activity-warning',
        openWakeAlert: '1',
        activityTitle: input.body,
      },
      android: buildWakeAndroidConfig(notifee, channelId, media.vibrationId),
    });

    markReminderPresented(scheduleId);
    return true;
  } catch {
    return false;
  }
}

export function canScheduleActivityWakeAlerts(): boolean {
  return canUseWakeAlerts();
}

export function isAndroidActivityWakeItem(item: ReminderScheduleItem): boolean {
  return canUseWakeAlerts() && isActivitySoonItem(item);
}
