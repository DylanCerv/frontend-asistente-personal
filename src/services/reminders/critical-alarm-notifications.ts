import { isRunningInExpoGo } from 'expo';
import * as Device from 'expo-device';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';

import { isNativeBuildEnabled } from '@/config/native-build';
import {
  deniedResult,
  getNativeFeatureUnavailableReason,
  grantedResult,
  isPermissionGranted,
  unavailableResult,
  type PermissionResult,
} from '@/services/permissions/permission-result';
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
import {
  shouldPlaySound,
  shouldVibrate,
  type ReminderAlertStyle,
} from '@/services/reminders/reminder-alert-style';
import {
  EXACT_ALERT_ID_PREFIX,
  SNOOZE_ALERT_ID_PREFIX,
  type ReminderScheduleItem,
} from '@/services/reminders/reminder-rules';

export const CRITICAL_ALARM_CHANNEL_ID = 'kivo-critical-alarm';
export const CRITICAL_ALARM_ID_PREFIX = 'kivo-fs-alarm-';
export const CRITICAL_SNOOZE_MINUTES = 5;

export const ACTION_COMPLETE = 'complete';
export const ACTION_SNOOZE = 'snooze';
export const ACTION_TALK = 'talk';

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

function canUseCriticalAlarms(): boolean {
  return (
    isNativeBuildEnabled() &&
    Platform.OS === 'android' &&
    Device.isDevice &&
    !isRunningInExpoGo()
  );
}

async function getNotifee(): Promise<NotifeeBundle | null> {
  if (!canUseCriticalAlarms()) return null;

  if (!notifeeModulePromise) {
    notifeeModulePromise = import('@notifee/react-native')
      .then((mod) => mod)
      .catch(() => null);
  }

  return notifeeModulePromise;
}

export function buildCriticalAlarmDeepLink(recordId: string, title: string): string {
  return Linking.createURL('/critical-alarm', {
    queryParams: {
      recordId,
      title,
    },
  });
}

async function ensureCriticalAlarmChannel(
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
  const channelId = `${CRITICAL_ALARM_CHANNEL_ID}-${soundKey}-${vibrationId}`;
  const cacheKey = `${alertStyle}:${channelId}`;
  if (channelReadyKey === cacheKey) return channelId;

  const playSound = shouldPlaySound(alertStyle, 'alarm');
  const vibrate = shouldVibrate(alertStyle);
  const sound = playSound
    ? soundUri ?? resolveNativeSoundName(soundId, playSound) ?? 'default'
    : undefined;

  await notifee.default.createChannel({
    id: channelId,
    name: 'Alarmas críticas a pantalla completa',
    importance: notifee.AndroidImportance.HIGH,
    visibility: notifee.AndroidVisibility.PUBLIC,
    sound,
    vibration: vibrate,
    vibrationPattern: vibrate
      ? toNotifeeVibrationPattern(resolveVibrationPattern(vibrationId, true))
      : undefined,
    lights: true,
    lightColor: '#C4B5FD',
  });

  channelReadyKey = cacheKey;
  return channelId;
}

function isExactCriticalItem(item: ReminderScheduleItem): boolean {
  return (
    item.kind === 'critical' &&
    item.alertLevel === 'alarm' &&
    (item.id.startsWith(EXACT_ALERT_ID_PREFIX) || item.id.startsWith(SNOOZE_ALERT_ID_PREFIX))
  );
}

function toNotifeeAlarmId(scheduleId: string): string {
  return `${CRITICAL_ALARM_ID_PREFIX}${scheduleId}`;
}

function resolveAlarmTitle(item: ReminderScheduleItem): string {
  const fromBody = item.body.match(/[“"]([^”"]+)[”"]/);
  if (fromBody?.[1]) return fromBody[1];
  if (item.title && item.title !== 'Alerta crítica' && item.title !== 'Alarma crítica') {
    return item.title;
  }
  return item.body || 'Tarea urgente';
}

export async function cancelAllCriticalAlarms(): Promise<void> {
  const notifee = await getNotifee();
  if (!notifee) return;

  try {
    const ids = await notifee.default.getTriggerNotificationIds();
    const criticalIds = ids.filter((id) => id.startsWith(CRITICAL_ALARM_ID_PREFIX));
    await Promise.all(criticalIds.map((id) => notifee.default.cancelNotification(id)));
  } catch {
    // Native module unavailable.
  }
}

export async function cancelCriticalAlarmForRecord(recordId: string): Promise<void> {
  const notifee = await getNotifee();
  if (!notifee) return;

  try {
    const ids = await notifee.default.getTriggerNotificationIds();
    const matching = ids.filter((id) => id.includes(recordId));
    await Promise.all(matching.map((id) => notifee.default.cancelNotification(id)));
  } catch {
    // Native module unavailable.
  }
}

async function scheduleOneCriticalAlarm(
  notifee: NotifeeBundle,
  item: ReminderScheduleItem,
  alertStyle: ReminderAlertStyle,
  media: AlertMediaOptions = {},
): Promise<void> {
  const channelId = await ensureCriticalAlarmChannel(notifee, alertStyle, media);
  const alarmTitle = resolveAlarmTitle(item);
  const deepLink = buildCriticalAlarmDeepLink(item.recordId, alarmTitle);
  const notificationId = toNotifeeAlarmId(item.id);
  const { soundId, vibrationId } = normalizeMedia(media);

  await notifee.default.createTriggerNotification(
    {
      id: notificationId,
      title: 'Alarma crítica',
      body: alarmTitle,
      data: {
        recordId: item.recordId,
        scheduleId: item.id,
        kind: item.kind,
        alertStyle,
        soundId,
        vibrationId,
        deepLink,
        openCriticalAlarm: '1',
        alarmTitle,
      },
      android: {
        channelId,
        category: notifee.AndroidCategory.ALARM,
        importance: notifee.AndroidImportance.HIGH,
        visibility: notifee.AndroidVisibility.PUBLIC,
        pressAction: {
          id: 'default',
          launchActivity: 'default',
        },
        fullScreenAction: {
          id: 'default',
          launchActivity: 'default',
        },
        actions: [
          {
            title: 'Ya lo hago',
            pressAction: { id: ACTION_COMPLETE },
          },
          {
            title: 'Posponer 5 min',
            pressAction: { id: ACTION_SNOOZE },
          },
          {
            title: 'Hablar',
            pressAction: { id: ACTION_TALK, launchActivity: 'default' },
          },
        ],
        lightUpScreen: true,
        loopSound: shouldPlaySound(alertStyle, 'alarm'),
        ongoing: true,
        autoCancel: false,
        color: '#C4B5FD',
      },
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

/** Sync Android full-screen critical alarms for exact-time critical schedule items. */
export async function syncCriticalAlarms(
  schedule: ReminderScheduleItem[],
  enabled: boolean,
  alertStyle: ReminderAlertStyle = 'both',
  media: AlertMediaOptions = {},
): Promise<void> {
  const notifee = await getNotifee();
  if (!notifee) return;

  await cancelAllCriticalAlarms();
  if (!enabled) return;

  const criticalExact = schedule.filter(isExactCriticalItem);
  await Promise.all(
    criticalExact.map((item) => scheduleOneCriticalAlarm(notifee, item, alertStyle, media)),
  );
}

export async function snoozeCriticalAlarm(
  item: {
    recordId: string;
    title: string;
    body: string;
  },
  alertStyle: ReminderAlertStyle = 'both',
  snoozeMinutes = CRITICAL_SNOOZE_MINUTES,
  media: AlertMediaOptions = {},
): Promise<void> {
  const notifee = await getNotifee();
  if (!notifee) return;

  await cancelCriticalAlarmForRecord(item.recordId);

  const triggerAt = new Date(Date.now() + snoozeMinutes * 60 * 1000);
  const scheduleItem: ReminderScheduleItem = {
    id: `${SNOOZE_ALERT_ID_PREFIX}${item.recordId}-${triggerAt.getTime()}`,
    recordId: item.recordId,
    triggerAt,
    title: item.title || 'Alarma crítica',
    body: item.body || 'Recordatorio pospuesto',
    alertLevel: 'alarm',
    kind: 'critical',
  };

  await scheduleOneCriticalAlarm(notifee, scheduleItem, alertStyle, media);
}

/** Fire a near-immediate full-screen critical alarm for native testing. */
export async function presentTestCriticalAlarm(
  alertStyle: ReminderAlertStyle = 'both',
  delayMs = 5000,
  media: AlertMediaOptions = {},
): Promise<boolean> {
  const notifee = await getNotifee();
  if (!notifee) return false;

  const settings = await notifee.default.requestPermission();
  if (settings.authorizationStatus < 1) return false;

  const triggerAt = new Date(Date.now() + delayMs);
  const scheduleItem: ReminderScheduleItem = {
    id: `${SNOOZE_ALERT_ID_PREFIX}test-critical-fs`,
    recordId: 'test-critical',
    triggerAt,
    title: 'Enviar propuesta a Carlos',
    body: 'Enviar propuesta a Carlos',
    alertLevel: 'alarm',
    kind: 'critical',
  };

  await scheduleOneCriticalAlarm(notifee, scheduleItem, alertStyle, media);
  return true;
}

export async function checkExactAlarmPermissionResult(): Promise<PermissionResult> {
  const unavailable = getNativeFeatureUnavailableReason({ androidOnly: true });
  if (unavailable) return unavailableResult(unavailable);

  const notifee = await getNotifee();
  if (!notifee) return unavailableResult('missing_native_flag');

  try {
    const settings = await notifee.default.getNotificationSettings();
    const alarmValue = settings.android?.alarm;
    if (alarmValue === -1 || alarmValue === undefined) {
      // Older APIs / not supported — treat as granted when notifications work.
      return grantedResult();
    }
    if (alarmValue === 1) return grantedResult();
    return deniedResult();
  } catch {
    return deniedResult();
  }
}

export async function checkExactAlarmPermission(): Promise<boolean> {
  return isPermissionGranted(await checkExactAlarmPermissionResult());
}

export async function openFullScreenIntentSettings(): Promise<void> {
  const notifee = await getNotifee();
  if (!notifee) return;

  try {
    await notifee.default.openAlarmPermissionSettings();
  } catch {
    try {
      await notifee.default.openNotificationSettings();
    } catch {
      // Settings screen unavailable.
    }
  }
}

export function canScheduleCriticalAlarms(): boolean {
  return canUseCriticalAlarms();
}
