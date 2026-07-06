import { isRunningInExpoGo } from 'expo';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

import {
  buildVibrationPattern,
  parseReminderAlertStyle,
  shouldPlaySound,
  shouldVibrate,
  type ReminderAlertStyle,
} from '@/services/reminders/reminder-alert-style';
import {
  buildReminderSchedule,
  type ReminderAlertLevel,
} from '@/services/reminders/reminder-rules';
import type { MemoryRecord } from '@/types/record';

const ANDROID_ALARM_CHANNEL_ID = 'kivo-alarms';
const ANDROID_NOTIFICATION_CHANNEL_ID = 'kivo-reminders';
const REMINDER_ID_PREFIXES = ['asistente-reminder-', 'kivo-exact-'] as const;

type NotificationsModule = typeof import('expo-notifications');

let notificationsModulePromise: Promise<NotificationsModule | null> | null = null;
let notificationHandlerConfigured = false;

function canUseLocalNotifications(): boolean {
  return Platform.OS !== 'web' && Device.isDevice && !isRunningInExpoGo();
}

async function getNotificationsModule(): Promise<NotificationsModule | null> {
  if (!canUseLocalNotifications()) return null;

  if (!notificationsModulePromise) {
    notificationsModulePromise = import('expo-notifications').then((Notifications) => {
      if (!notificationHandlerConfigured) {
        Notifications.setNotificationHandler({
          handleNotification: async (notification) => {
            const alertStyle = parseReminderAlertStyle(
              notification.request.content.data?.alertStyle,
            );
            const alertLevel = notification.request.content.data?.alertLevel as
              | ReminderAlertLevel
              | undefined;

            return {
              shouldShowAlert: true,
              shouldPlaySound: shouldPlaySound(alertStyle, alertLevel ?? 'notification'),
              shouldSetBadge: false,
              shouldShowBanner: true,
              shouldShowList: true,
            };
          },
        });
        notificationHandlerConfigured = true;
      }

      return Notifications;
    });
  }

  return notificationsModulePromise;
}

export async function checkNotificationPermissions(): Promise<boolean> {
  const Notifications = await getNotificationsModule();
  if (!Notifications) return false;

  const current = await Notifications.getPermissionsAsync();
  return current.granted ?? false;
}

export async function requestNotificationPermissions(): Promise<boolean> {
  const Notifications = await getNotificationsModule();
  if (!Notifications) return false;

  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;

  const requested = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: false,
      allowSound: true,
    },
  });
  return requested.granted ?? false;
}

/** @deprecated Use requestNotificationPermissions */
export async function ensureNotificationPermissions(): Promise<boolean> {
  return requestNotificationPermissions();
}

async function ensureAndroidChannels(
  Notifications: NotificationsModule,
  alertStyle: ReminderAlertStyle,
): Promise<void> {
  if (Platform.OS !== 'android') return;

  const useSound = alertStyle !== 'vibration';
  const useVibration = shouldVibrate(alertStyle);

  await Notifications.setNotificationChannelAsync(ANDROID_ALARM_CHANNEL_ID, {
    name: 'Alertas con sonido',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: useVibration ? buildVibrationPattern(true) : undefined,
    lightColor: '#7C3AED',
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    sound: useSound ? 'default' : undefined,
  });

  await Notifications.setNotificationChannelAsync(ANDROID_NOTIFICATION_CHANNEL_ID, {
    name: 'Recordatorios del día',
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: useVibration ? buildVibrationPattern(false) : undefined,
    lightColor: '#7C3AED',
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    sound: useSound ? 'default' : undefined,
  });
}

function resolveAndroidChannelId(alertLevel: ReminderAlertLevel): string {
  return alertLevel === 'alarm' ? ANDROID_ALARM_CHANNEL_ID : ANDROID_NOTIFICATION_CHANNEL_ID;
}

function buildNotificationContent(
  Notifications: NotificationsModule,
  item: {
    title: string;
    body: string;
    recordId: string;
    alertLevel: ReminderAlertLevel;
    id: string;
  },
  alertStyle: ReminderAlertStyle,
) {
  const isAlarm = item.alertLevel === 'alarm';
  const playSound = shouldPlaySound(alertStyle, item.alertLevel);
  const vibrate = shouldVibrate(alertStyle);

  return {
    title: item.title,
    body: item.body,
    sound: playSound ? 'default' : undefined,
    vibrate: vibrate ? buildVibrationPattern(isAlarm) : undefined,
    data: {
      recordId: item.recordId,
      alertLevel: item.alertLevel,
      alertStyle,
      kind: item.id.startsWith('kivo-exact-') ? 'exact' : 'offset',
    },
    ...(Platform.OS === 'android'
      ? {
          channelId: resolveAndroidChannelId(item.alertLevel),
          priority: isAlarm
            ? Notifications.AndroidNotificationPriority.HIGH
            : Notifications.AndroidNotificationPriority.DEFAULT,
        }
      : {}),
  };
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
): Promise<void> {
  const Notifications = await getNotificationsModule();
  if (!Notifications) return;

  await cancelAppReminders();

  if (!enabled) return;

  const granted = await checkNotificationPermissions();
  if (!granted) return;

  await ensureAndroidChannels(Notifications, alertStyle);

  const schedule = buildReminderSchedule(records);

  await Promise.all(
    schedule.map((item) =>
      Notifications.scheduleNotificationAsync({
        identifier: item.id,
        content: buildNotificationContent(Notifications, item, alertStyle),
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: item.triggerAt,
        },
      }),
    ),
  );
}
