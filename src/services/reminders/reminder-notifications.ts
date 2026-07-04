import { isRunningInExpoGo } from 'expo';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

import { buildReminderSchedule } from '@/services/reminders/reminder-rules';
import type { MemoryRecord } from '@/types/record';

const ANDROID_CHANNEL_ID = 'asistente-reminders';

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
          handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: false,
            shouldShowBanner: true,
            shouldShowList: true,
          }),
        });
        notificationHandlerConfigured = true;
      }

      return Notifications;
    });
  }

  return notificationsModulePromise;
}

export async function ensureNotificationPermissions(): Promise<boolean> {
  const Notifications = await getNotificationsModule();
  if (!Notifications) return false;

  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;

  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted ?? false;
}

async function ensureAndroidChannel(Notifications: NotificationsModule): Promise<void> {
  if (Platform.OS !== 'android') return;

  await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
    name: 'Recordatorios',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#7C3AED',
  });
}

export async function cancelAppReminders(): Promise<void> {
  const Notifications = await getNotificationsModule();
  if (!Notifications) return;

  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((item) => item.identifier.startsWith('asistente-reminder-'))
      .map((item) => Notifications.cancelScheduledNotificationAsync(item.identifier)),
  );
}

export async function syncReminderNotifications(
  records: MemoryRecord[],
  /** When false, cancels all pending reminders */
  enabled = true,
): Promise<void> {
  const Notifications = await getNotificationsModule();
  if (!Notifications) return;

  await cancelAppReminders();

  if (!enabled) return;

  const granted = await ensureNotificationPermissions();
  if (!granted) return;

  await ensureAndroidChannel(Notifications);

  const schedule = buildReminderSchedule(records);

  await Promise.all(
    schedule.map((item) =>
      Notifications.scheduleNotificationAsync({
        identifier: item.id,
        content: {
          title: item.title,
          body: item.body,
          data: { recordId: item.recordId },
          ...(Platform.OS === 'android' ? { channelId: ANDROID_CHANNEL_ID } : {}),
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: item.triggerAt,
        },
      }),
    ),
  );
}

/** Always schedules reminders regardless of user toggle (for overdue/urgent tasks) */
export async function forceReminderSync(records: MemoryRecord[]): Promise<void> {
  return syncReminderNotifications(records, true);
}
