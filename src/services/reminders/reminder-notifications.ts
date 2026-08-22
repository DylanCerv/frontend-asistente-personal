import { isRunningInExpoGo } from 'expo';
import * as Device from 'expo-device';
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
  cancelAllActivityWakeAlerts,
  canScheduleActivityWakeAlerts,
  isAndroidActivityWakeItem,
  syncActivityWakeAlerts,
} from '@/services/reminders/activity-wake-notifications';
import {
  buildCriticalAlarmDeepLink,
  canScheduleCriticalAlarms,
  cancelAllCriticalAlarms,
  cancelCriticalAlarmForRecord,
  CRITICAL_SNOOZE_MINUTES,
  presentTestCriticalAlarm,
  snoozeCriticalAlarm as snoozeNotifeeCriticalAlarm,
  syncCriticalAlarms,
} from '@/services/reminders/critical-alarm-notifications';
import {
  DEFAULT_REMINDER_ALERT_SOUND,
  DEFAULT_REMINDER_ALERT_VIBRATION,
  resolveNativeSoundName,
  resolveVibrationPattern,
  type ReminderAlertSoundId,
  type ReminderAlertVibrationId,
} from '@/services/reminders/reminder-alert-presets';
import {
  parseReminderAlertStyle,
  shouldPlaySound,
  shouldVibrate,
  type ReminderAlertStyle,
} from '@/services/reminders/reminder-alert-style';
import {
  buildReminderSchedule,
  DAILY_SUMMARY_ID,
  EXACT_ALERT_ID_PREFIX,
  SNOOZE_ALERT_ID_PREFIX,
  type ReminderAlertLevel,
  type ReminderNotificationKind,
  type ReminderScheduleItem,
} from '@/services/reminders/reminder-rules';
import type { MemoryRecord } from '@/types/record';

export type { PermissionResult };

export {
  buildCriticalAlarmDeepLink,
  canScheduleCriticalAlarms,
  cancelCriticalAlarmForRecord,
  CRITICAL_SNOOZE_MINUTES,
  presentTestCriticalAlarm,
};

export { snoozeNotifeeCriticalAlarm as snoozeCriticalAlarmNative };

export type AlertMediaOptions = {
  soundId?: ReminderAlertSoundId;
  vibrationId?: ReminderAlertVibrationId;
};

function normalizeMedia(options?: AlertMediaOptions) {
  return {
    soundId: options?.soundId ?? DEFAULT_REMINDER_ALERT_SOUND,
    vibrationId: options?.vibrationId ?? DEFAULT_REMINDER_ALERT_VIBRATION,
  };
}

function channelSuffix(soundId: ReminderAlertSoundId, vibrationId: ReminderAlertVibrationId) {
  return `${soundId}-${vibrationId}`;
}

async function resolveExpoChannelSound(
  soundId: ReminderAlertSoundId,
  playSound: boolean,
): Promise<string | undefined> {
  if (!playSound) return undefined;
  // Expo soft channels: use OS default for system/custom; Kivo uses bundled name.
  if (soundId === 'custom' || soundId === 'system') {
    return 'default';
  }
  return resolveNativeSoundName(soundId, playSound);
}

const ANDROID_ALARM_CHANNEL_ID = 'kivo-alarms';
const ANDROID_NOTIFICATION_CHANNEL_ID = 'kivo-reminders';
const ANDROID_CRITICAL_CHANNEL_ID = 'kivo-critical';
const ANDROID_ASSISTANT_CHANNEL_ID = 'kivo-assistant';

export const CRITICAL_CATEGORY_ID = 'kivo-critical';
export const ASSISTANT_CATEGORY_ID = 'kivo-assistant';
export const ACTION_COMPLETE = 'complete';
export const ACTION_SNOOZE = 'snooze';
export const ACTION_OPEN_BRIEFING = 'open-briefing';
export const ACTION_TALK = 'talk';

const REMINDER_ID_PREFIXES = [
  'asistente-reminder-',
  'kivo-exact-',
  'kivo-summary-',
  'kivo-snooze-',
  'kivo-checkin-',
  'kivo-open-',
  'kivo-activity-30m-',
] as const;

const CRITICAL_ACCENT = '#F8A49B';
const ASSISTANT_ACCENT = '#2DD4BF';

type NotificationsModule = typeof import('expo-notifications');

let notificationsModulePromise: Promise<NotificationsModule | null> | null = null;
let notificationHandlerConfigured = false;
let categoriesConfigured = false;

function canUseLocalNotifications(): boolean {
  return (
    isNativeBuildEnabled() &&
    Platform.OS !== 'web' &&
    Device.isDevice &&
    !isRunningInExpoGo()
  );
}

function isAndroidFullScreenCritical(item: ReminderScheduleItem): boolean {
  return (
    Platform.OS === 'android' &&
    canScheduleCriticalAlarms() &&
    item.kind === 'critical' &&
    item.alertLevel === 'alarm' &&
    (item.id.startsWith(EXACT_ALERT_ID_PREFIX) || item.id.startsWith(SNOOZE_ALERT_ID_PREFIX))
  );
}

async function ensureNotificationCategories(Notifications: NotificationsModule): Promise<void> {
  if (categoriesConfigured) return;

  await Notifications.setNotificationCategoryAsync(CRITICAL_CATEGORY_ID, [
    {
      identifier: ACTION_COMPLETE,
      buttonTitle: 'Ya lo hago',
      options: { opensAppToForeground: true },
    },
    {
      identifier: ACTION_SNOOZE,
      buttonTitle: 'Posponer 5 min',
      options: { opensAppToForeground: false },
    },
    {
      identifier: ACTION_TALK,
      buttonTitle: 'Hablar',
      options: { opensAppToForeground: true },
    },
  ]);

  await Notifications.setNotificationCategoryAsync(ASSISTANT_CATEGORY_ID, [
    {
      identifier: ACTION_OPEN_BRIEFING,
      buttonTitle: 'Abrir resumen',
      options: { opensAppToForeground: true },
    },
  ]);

  categoriesConfigured = true;
}

async function getNotificationsModule(): Promise<NotificationsModule | null> {
  if (!canUseLocalNotifications()) return null;

  if (!notificationsModulePromise) {
    notificationsModulePromise = import('expo-notifications')
      .then(async (Notifications) => {
        if (!notificationHandlerConfigured) {
          Notifications.setNotificationHandler({
            handleNotification: async (notification) => {
              const data = notification.request.content.data ?? {};
              const alertStyle = parseReminderAlertStyle(data.alertStyle);
              const alertLevel = data.alertLevel as ReminderAlertLevel | undefined;
              const kind = data.kind as ReminderNotificationKind | undefined;
              const fromServer = data.source === 'server';
              const elevateToNative =
                fromServer &&
                (data.openCriticalAlarm === '1' ||
                  data.openCriticalAlarm === true ||
                  data.openWakeAlert === '1' ||
                  data.openWakeAlert === true);

              // Critical/wake from the server are presented via Notifee — hide Expo tray copy.
              if (elevateToNative) {
                return {
                  shouldShowAlert: false,
                  shouldPlaySound: false,
                  shouldSetBadge: false,
                  shouldShowBanner: false,
                  shouldShowList: false,
                };
              }

              return {
                shouldShowAlert: true,
                shouldPlaySound: shouldPlaySound(alertStyle, alertLevel ?? 'notification'),
                shouldSetBadge: false,
                shouldShowBanner: kind !== 'critical',
                shouldShowList: true,
              };
            },
          });
          notificationHandlerConfigured = true;
        }

        await ensureNotificationCategories(Notifications);
        return Notifications;
      })
      .catch(() => null);
  }

  return notificationsModulePromise;
}

export function getNotificationPermissionUnavailableReason() {
  return getNativeFeatureUnavailableReason();
}

export async function checkNotificationPermissionResult(): Promise<PermissionResult> {
  const unavailable = getNativeFeatureUnavailableReason();
  if (unavailable) return unavailableResult(unavailable);

  const Notifications = await getNotificationsModule();
  if (!Notifications) return unavailableResult('missing_native_flag');

  const current = await Notifications.getPermissionsAsync();
  return current.granted ? grantedResult() : deniedResult();
}

export async function requestNotificationPermissionResult(): Promise<PermissionResult> {
  const unavailable = getNativeFeatureUnavailableReason();
  if (unavailable) return unavailableResult(unavailable);

  const Notifications = await getNotificationsModule();
  if (!Notifications) return unavailableResult('missing_native_flag');

  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return grantedResult();

  const requested = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: false,
      allowSound: true,
    },
  });
  return requested.granted ? grantedResult() : deniedResult();
}

export async function checkNotificationPermissions(): Promise<boolean> {
  return isPermissionGranted(await checkNotificationPermissionResult());
}

export async function requestNotificationPermissions(): Promise<boolean> {
  return isPermissionGranted(await requestNotificationPermissionResult());
}

/** @deprecated Use requestNotificationPermissions */
export async function ensureNotificationPermissions(): Promise<boolean> {
  return requestNotificationPermissions();
}

async function ensureAndroidChannels(
  Notifications: NotificationsModule,
  alertStyle: ReminderAlertStyle,
  media: AlertMediaOptions = {},
): Promise<void> {
  if (Platform.OS !== 'android') return;

  const { soundId, vibrationId } = normalizeMedia(media);
  const suffix = channelSuffix(soundId, vibrationId);
  const useSound = alertStyle !== 'vibration';
  const useVibration = shouldVibrate(alertStyle);
  const soundName = await resolveExpoChannelSound(soundId, useSound);
  const softPattern = useVibration ? resolveVibrationPattern(vibrationId, false) : undefined;
  const alarmPattern = useVibration ? resolveVibrationPattern(vibrationId, true) : undefined;

  await Notifications.setNotificationChannelAsync(`${ANDROID_ALARM_CHANNEL_ID}-${suffix}`, {
    name: 'Alertas con sonido',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: alarmPattern,
    lightColor: '#7C3AED',
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    sound: soundName,
  });

  await Notifications.setNotificationChannelAsync(`${ANDROID_NOTIFICATION_CHANNEL_ID}-${suffix}`, {
    name: 'Recordatorios del día',
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: softPattern,
    lightColor: '#7C3AED',
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    sound: soundName,
  });

  await Notifications.setNotificationChannelAsync(`${ANDROID_CRITICAL_CHANNEL_ID}-${suffix}`, {
    name: 'Alertas críticas',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: alarmPattern,
    lightColor: CRITICAL_ACCENT,
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    sound: soundName,
  });

  await Notifications.setNotificationChannelAsync(`${ANDROID_ASSISTANT_CHANNEL_ID}-${suffix}`, {
    name: 'Resumen del asistente',
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: softPattern,
    lightColor: ASSISTANT_ACCENT,
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    sound: soundName,
  });

  // Unsuffixed IDs must match Expo Push `channelId` from the backend.
  await Notifications.setNotificationChannelAsync('kivo-reminders', {
    name: 'Recordatorios Kivo',
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: softPattern,
    lightColor: '#7C3AED',
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    sound: soundName,
  });
  await Notifications.setNotificationChannelAsync('kivo-activity-wake', {
    name: 'Aviso de actividad',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: alarmPattern,
    lightColor: '#7C3AED',
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    sound: soundName,
  });
  await Notifications.setNotificationChannelAsync('kivo-critical-alarm', {
    name: 'Alarmas de actividad',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: alarmPattern,
    lightColor: CRITICAL_ACCENT,
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    sound: soundName,
  });
}

function resolveAndroidChannelId(
  kind: ReminderNotificationKind,
  alertLevel: ReminderAlertLevel,
  media: AlertMediaOptions = {},
): string {
  const { soundId, vibrationId } = normalizeMedia(media);
  const suffix = channelSuffix(soundId, vibrationId);
  if (kind === 'critical') return `${ANDROID_CRITICAL_CHANNEL_ID}-${suffix}`;
  if (kind === 'daily-summary') return `${ANDROID_ASSISTANT_CHANNEL_ID}-${suffix}`;
  if (kind === 'activity-warning') return `${ANDROID_ALARM_CHANNEL_ID}-${suffix}`;
  const base =
    alertLevel === 'alarm' ? ANDROID_ALARM_CHANNEL_ID : ANDROID_NOTIFICATION_CHANNEL_ID;
  return `${base}-${suffix}`;
}

function resolveCategoryId(kind: ReminderNotificationKind): string | undefined {
  if (kind === 'critical') return CRITICAL_CATEGORY_ID;
  if (kind === 'daily-summary') return ASSISTANT_CATEGORY_ID;
  return undefined;
}

function buildDateTrigger(
  Notifications: NotificationsModule,
  date: Date,
  item: ReminderScheduleItem,
  media: AlertMediaOptions = {},
) {
  if (Platform.OS === 'android') {
    return {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date,
      channelId: resolveAndroidChannelId(item.kind, item.alertLevel, media),
    } as const;
  }

  return {
    type: Notifications.SchedulableTriggerInputTypes.DATE,
    date,
  } as const;
}

function buildNotificationContent(
  Notifications: NotificationsModule,
  item: ReminderScheduleItem,
  alertStyle: ReminderAlertStyle,
  media: AlertMediaOptions = {},
) {
  const { soundId, vibrationId } = normalizeMedia(media);
  const isAlarm = item.alertLevel === 'alarm' || item.kind === 'critical';
  const playSound = shouldPlaySound(alertStyle, item.alertLevel);
  const vibrate = shouldVibrate(alertStyle);
  const categoryIdentifier = resolveCategoryId(item.kind);
  // Soft expo channels: bundled/default only (custom URI is for Notifee critical path).
  const soundName =
    playSound && (soundId === 'custom' || soundId === 'system')
      ? 'default'
      : resolveNativeSoundName(soundId, playSound);

  return {
    title: item.title,
    body: item.body,
    sound: soundName,
    vibrate: vibrate ? resolveVibrationPattern(vibrationId, isAlarm) : undefined,
    categoryIdentifier,
    data: {
      recordId: item.recordId,
      alertLevel: item.alertLevel,
      alertStyle,
      soundId,
      vibrationId,
      kind: item.kind,
      scheduleId: item.id,
      openCriticalAlarm: item.kind === 'critical' ? '1' : '0',
      openWakeAlert: item.kind === 'activity-warning' ? '1' : '0',
      alarmTitle: item.kind === 'critical' ? extractAlarmTitle(item) : undefined,
    },
    ...(Platform.OS === 'android'
      ? {
          priority: isAlarm
            ? Notifications.AndroidNotificationPriority.MAX
            : Notifications.AndroidNotificationPriority.DEFAULT,
          color:
            item.kind === 'critical'
              ? CRITICAL_ACCENT
              : item.kind === 'daily-summary'
                ? ASSISTANT_ACCENT
                : '#7C3AED',
        }
      : {}),
  };
}

function extractAlarmTitle(item: ReminderScheduleItem): string {
  const fromBody = item.body.match(/[“"]([^”"]+)[”"]/);
  if (fromBody?.[1]) return fromBody[1];
  if (item.title && item.title !== 'Alerta crítica' && item.title !== 'Alarma crítica') {
    return item.title;
  }
  return item.body;
}

export async function cancelAppReminders(): Promise<void> {
  const Notifications = await getNotificationsModule();
  if (!Notifications) return;

  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((item) =>
        REMINDER_ID_PREFIXES.some((prefix) => item.identifier.startsWith(prefix)),
      )
      .map((item) => Notifications.cancelScheduledNotificationAsync(item.identifier)),
  );
}

export async function syncReminderNotifications(
  records: MemoryRecord[],
  enabled = true,
  alertStyle: ReminderAlertStyle = 'both',
  options?: {
    dailySummaryEnabled?: boolean;
    soundId?: ReminderAlertSoundId;
    vibrationId?: ReminderAlertVibrationId;
  },
): Promise<void> {
  const media = normalizeMedia(options);
  const schedule = buildReminderSchedule(records, {
    includeDailySummary: options?.dailySummaryEnabled !== false,
  });

  const Notifications = await getNotificationsModule();

  // Always keep Android Notifee alarms in sync, even if expo-notifications is unavailable.
  if (!enabled) {
    await cancelAllCriticalAlarms();
    await cancelAllActivityWakeAlerts();
    if (Notifications) await cancelAppReminders();
    return;
  }

  const granted = Notifications
    ? await checkNotificationPermissions()
    : canScheduleCriticalAlarms() || canScheduleActivityWakeAlerts();

  if (!granted) {
    await cancelAllCriticalAlarms();
    await cancelAllActivityWakeAlerts();
    if (Notifications) await cancelAppReminders();
    return;
  }

  await syncCriticalAlarms(schedule, true, alertStyle, media);
  await syncActivityWakeAlerts(schedule, true, alertStyle, media);

  if (!Notifications) return;

  await cancelAppReminders();
  await ensureAndroidChannels(Notifications, alertStyle, media);
  await ensureNotificationCategories(Notifications);

  const expoSchedule = schedule.filter(
    (item) => !isAndroidFullScreenCritical(item) && !isAndroidActivityWakeItem(item),
  );

  await Promise.allSettled(
    expoSchedule.map((item) =>
      Notifications.scheduleNotificationAsync({
        identifier: item.id,
        content: buildNotificationContent(Notifications, item, alertStyle, media),
        trigger: buildDateTrigger(Notifications, item.triggerAt, item, media),
      }),
    ),
  );
}

export async function snoozeReminderNotification(
  item: {
    recordId: string;
    title: string;
    body: string;
    kind?: ReminderNotificationKind;
    scheduleId?: string;
  },
  alertStyle: ReminderAlertStyle = 'both',
  snoozeMinutes = CRITICAL_SNOOZE_MINUTES,
  media: AlertMediaOptions = {},
): Promise<void> {
  const normalized = normalizeMedia(media);
  const Notifications = await getNotificationsModule();
  if (!Notifications) return;

  const granted = await checkNotificationPermissions();
  if (!granted) return;

  await ensureAndroidChannels(Notifications, alertStyle, normalized);
  await ensureNotificationCategories(Notifications);

  const triggerAt = new Date(Date.now() + snoozeMinutes * 60 * 1000);
  const kind = item.kind ?? 'critical';
  const scheduleItem: ReminderScheduleItem = {
    id: `${SNOOZE_ALERT_ID_PREFIX}${item.recordId}-${triggerAt.getTime()}`,
    recordId: item.recordId,
    triggerAt,
    title: item.title || 'Alerta crítica',
    body: item.body || 'Recordatorio pospuesto',
    alertLevel: 'alarm',
    kind,
  };

  if (item.scheduleId) {
    try {
      await Notifications.cancelScheduledNotificationAsync(item.scheduleId);
    } catch {
      // Already fired or missing.
    }
  }

  if (isAndroidFullScreenCritical(scheduleItem)) {
    await snoozeNotifeeCriticalAlarm(
      {
        recordId: item.recordId,
        title: scheduleItem.title,
        body: scheduleItem.body,
      },
      alertStyle,
      snoozeMinutes,
      normalized,
    );
    return;
  }

  await Notifications.scheduleNotificationAsync({
    identifier: scheduleItem.id,
    content: buildNotificationContent(Notifications, scheduleItem, alertStyle, normalized),
    trigger: buildDateTrigger(Notifications, scheduleItem.triggerAt, scheduleItem, normalized),
  });
}

/** Fire immediate sample alerts for physical-device testing (__DEV__). */
export async function presentTestKivoAlerts(
  alertStyle: ReminderAlertStyle = 'both',
  media: AlertMediaOptions = {},
): Promise<boolean> {
  const normalized = normalizeMedia(media);
  const Notifications = await getNotificationsModule();
  if (!Notifications) return false;

  const granted = await requestNotificationPermissions();
  if (!granted) return false;

  await ensureAndroidChannels(Notifications, alertStyle, normalized);
  await ensureNotificationCategories(Notifications);

  const summary: ReminderScheduleItem = {
    id: `${DAILY_SUMMARY_ID}-test`,
    recordId: 'daily-summary',
    triggerAt: new Date(Date.now() + 3500),
    title: 'Resumen del día',
    body: '4 reuniones programadas hoy · Focus mejoró un 12%',
    alertLevel: 'notification',
    kind: 'daily-summary',
  };

  const criticalItem: ReminderScheduleItem = {
    id: `${SNOOZE_ALERT_ID_PREFIX}test-critical`,
    recordId: 'test-critical',
    triggerAt: new Date(Date.now() + 1500),
    title: 'Alerta crítica',
    body: 'La tarea “Prototipo de alta fidelidad” está por vencer. El proyecto Nexus depende de este hito.',
    alertLevel: 'alarm',
    kind: 'critical',
  };

  if (canScheduleCriticalAlarms()) {
    await presentTestCriticalAlarm(alertStyle, 5000, normalized);
  } else {
    await Notifications.scheduleNotificationAsync({
      identifier: criticalItem.id,
      content: buildNotificationContent(Notifications, criticalItem, alertStyle, normalized),
      trigger: buildDateTrigger(Notifications, criticalItem.triggerAt, criticalItem, normalized),
    });
  }

  await Notifications.scheduleNotificationAsync({
    identifier: summary.id,
    content: buildNotificationContent(Notifications, summary, alertStyle, normalized),
    trigger: buildDateTrigger(Notifications, summary.triggerAt, summary, normalized),
  });

  return true;
}

export function canScheduleLocalNotifications(): boolean {
  return canUseLocalNotifications();
}
