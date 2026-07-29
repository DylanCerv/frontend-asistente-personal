import { isRunningInExpoGo } from 'expo';
import * as Device from 'expo-device';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { isNativeBuildEnabled } from '@/config/native-build';
import { useAssistant } from '@/context/assistant-context';
import { useUserPreferences } from '@/context/user-preferences-context';
import {
  ACTION_COMPLETE,
  ACTION_OPEN_BRIEFING,
  ACTION_SNOOZE,
  ACTION_TALK,
  CRITICAL_SNOOZE_MINUTES,
  snoozeReminderNotification,
} from '@/services/reminders/reminder-notifications';
import type { ReminderNotificationKind } from '@/services/reminders/reminder-rules';
import { useCriticalAlarmEvents } from '@/hooks/use-critical-alarm-events';

let lastHandledNotificationId: string | null = null;

function canUseLocalNotifications(): boolean {
  return (
    isNativeBuildEnabled() &&
    Platform.OS !== 'web' &&
    Device.isDevice &&
    !isRunningInExpoGo()
  );
}

function openCriticalAlarm(
  router: ReturnType<typeof useRouter>,
  recordId: string | null,
  title: string | null,
) {
  router.push({
    pathname: '/critical-alarm',
    params: {
      recordId: recordId ?? 'test-critical',
      title: title ?? 'Tarea urgente',
    },
  });
}

export function useReminderResponse() {
  const router = useRouter();
  const { toggleTaskComplete, toggleEventComplete, records } = useAssistant();
  const { reminderAlertStyle, reminderAlertSound, reminderAlertVibration } = useUserPreferences();

  useCriticalAlarmEvents();

  useEffect(() => {
    if (!canUseLocalNotifications()) return;

    let subscription: { remove: () => void } | undefined;

    void import('expo-notifications').then((Notifications) => {
      async function handleResponse(response: {
        actionIdentifier: string;
        notification: {
          request: {
            identifier: string;
            content: {
              title?: string | null;
              body?: string | null;
              data?: Record<string, unknown>;
            };
          };
        };
      }) {
        const { identifier } = response.notification.request;
        const data = response.notification.request.content.data ?? {};
        const actionId = response.actionIdentifier;
        const recordId = typeof data.recordId === 'string' ? data.recordId : null;
        const kind = data.kind as ReminderNotificationKind | undefined;
        const scheduleId =
          typeof data.scheduleId === 'string' ? data.scheduleId : identifier;
        const alarmTitle =
          (typeof data.alarmTitle === 'string' && data.alarmTitle) ||
          response.notification.request.content.body ||
          null;

        const dedupeKey = `${identifier}:${actionId}`;
        if (lastHandledNotificationId === dedupeKey) return;
        lastHandledNotificationId = dedupeKey;

        if (actionId === ACTION_SNOOZE && recordId) {
          await snoozeReminderNotification(
            {
              recordId,
              title: response.notification.request.content.title ?? 'Alarma crítica',
              body: response.notification.request.content.body ?? 'Recordatorio pospuesto',
              kind: kind ?? 'critical',
              scheduleId,
            },
            reminderAlertStyle,
            CRITICAL_SNOOZE_MINUTES,
            {
              soundId: reminderAlertSound,
              vibrationId: reminderAlertVibration,
            },
          );
          return;
        }

        if (actionId === ACTION_TALK) {
          router.push({
            pathname: '/(main)/assistant',
            params: { autoRecord: '1' },
          });
          return;
        }

        if (actionId === ACTION_COMPLETE && recordId && recordId !== 'daily-summary') {
          if (recordId !== 'test-critical') {
            const record = records.find((item) => item.id === recordId);
            if (record?.type === 'meeting' || record?.type === 'reminder') {
              toggleEventComplete(recordId);
            } else {
              toggleTaskComplete(recordId);
            }
          }
          return;
        }

        if (
          actionId === ACTION_OPEN_BRIEFING ||
          kind === 'daily-summary' ||
          recordId === 'daily-summary'
        ) {
          router.push('/');
          return;
        }

        if (
          actionId === Notifications.DEFAULT_ACTION_IDENTIFIER ||
          !actionId ||
          actionId === 'expo.modules.notifications.actions.DEFAULT'
        ) {
          if (
            (kind === 'critical' || data.openCriticalAlarm === '1') &&
            recordId &&
            recordId !== 'daily-summary'
          ) {
            openCriticalAlarm(router, recordId, alarmTitle);
            return;
          }
          if (recordId && recordId !== 'daily-summary' && recordId !== 'test-critical') {
            router.push({ pathname: '/tasks', params: { taskId: recordId } });
            return;
          }
          router.push('/');
        }
      }

      subscription = Notifications.addNotificationResponseReceivedListener((response) => {
        void handleResponse(response);
      });

      void Notifications.getLastNotificationResponseAsync().then((response) => {
        if (!response) return;
        void handleResponse(response);
      });
    });

    return () => subscription?.remove();
  }, [
    records,
    reminderAlertStyle,
    reminderAlertSound,
    reminderAlertVibration,
    router,
    toggleEventComplete,
    toggleTaskComplete,
  ]);
}
