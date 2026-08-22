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
  ACTION_SNOOZE,
  ACTION_TALK,
  cancelCriticalAlarmForRecord,
  canScheduleCriticalAlarms,
  CRITICAL_SNOOZE_MINUTES,
} from '@/services/reminders/critical-alarm-notifications';
import { snoozeInAppAlert } from '@/services/reminders/kivo-alerts';
import { markReminderPresented } from '@/services/reminders/reminder-present-dedupe';
import { snoozeReminderNotification } from '@/services/reminders/reminder-notifications';

function canUseNotifeeEvents(): boolean {
  return (
    isNativeBuildEnabled() &&
    Platform.OS === 'android' &&
    Device.isDevice &&
    !isRunningInExpoGo() &&
    canScheduleCriticalAlarms()
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

/**
 * Handles Notifee full-screen critical alarm events (Android native builds).
 */
export function useCriticalAlarmEvents() {
  const router = useRouter();
  const { records, toggleTaskComplete, toggleEventComplete } = useAssistant();
  const { reminderAlertStyle, reminderAlertSound, reminderAlertVibration } = useUserPreferences();

  useEffect(() => {
    if (!canUseNotifeeEvents()) return;

    let unsubscribe: (() => void) | undefined;
    let cancelled = false;

    void import('@notifee/react-native').then((notifee) => {
      if (cancelled) return;

      async function handleEvent(event: {
        type: number;
        detail: {
          notification?: {
            id?: string;
            title?: string;
            body?: string;
            data?: Record<string, unknown>;
          };
          pressAction?: { id?: string };
        };
      }) {
        const { EventType } = notifee;
        const data = event.detail.notification?.data ?? {};
        const recordId = typeof data.recordId === 'string' ? data.recordId : null;
        const alarmTitle =
          (typeof data.alarmTitle === 'string' && data.alarmTitle) ||
          event.detail.notification?.body ||
          null;
        const actionId = event.detail.pressAction?.id ?? 'default';
        const openCritical = data.openCriticalAlarm === '1' || data.openCriticalAlarm === true;

        if (
          event.type !== EventType.ACTION_PRESS &&
          event.type !== EventType.PRESS &&
          event.type !== EventType.DELIVERED
        ) {
          return;
        }

        if (event.type === EventType.DELIVERED && openCritical) {
          const scheduleId =
            typeof data.scheduleId === 'string' ? data.scheduleId : null;
          markReminderPresented(scheduleId);
          openCriticalAlarm(router, recordId, alarmTitle);
          return;
        }

        if (event.type === EventType.DELIVERED) {
          return;
        }

        if (actionId === ACTION_SNOOZE && recordId) {
          snoozeInAppAlert(recordId, CRITICAL_SNOOZE_MINUTES);
          await snoozeReminderNotification(
            {
              recordId,
              title: 'Es la hora',
              body: alarmTitle ?? 'Recordatorio pospuesto',
              kind: 'critical',
            },
            reminderAlertStyle,
            CRITICAL_SNOOZE_MINUTES,
            {
              soundId: reminderAlertSound,
              vibrationId: reminderAlertVibration,
            },
          );
          if (event.detail.notification?.id) {
            await notifee.default.cancelNotification(event.detail.notification.id);
          }
          return;
        }

        if (actionId === ACTION_COMPLETE && recordId && recordId !== 'test-critical') {
          const record = records.find((item) => item.id === recordId);
          if (record?.type === 'meeting' || record?.type === 'reminder') {
            toggleEventComplete(recordId);
          } else {
            toggleTaskComplete(recordId);
          }
          await cancelCriticalAlarmForRecord(recordId);
          if (event.detail.notification?.id) {
            await notifee.default.cancelNotification(event.detail.notification.id);
          }
          return;
        }

        if (actionId === ACTION_TALK) {
          if (event.detail.notification?.id) {
            await notifee.default.cancelNotification(event.detail.notification.id);
          }
          router.push({
            pathname: '/(main)/assistant',
            params: { autoRecord: '1' },
          });
          return;
        }

        if (openCritical || actionId === 'default') {
          if (event.detail.notification?.id) {
            await notifee.default.cancelNotification(event.detail.notification.id);
          }
          openCriticalAlarm(router, recordId, alarmTitle);
        }
      }

      unsubscribe = notifee.default.onForegroundEvent((event) => {
        void handleEvent(event);
      });

      void notifee.default.getInitialNotification().then((initial) => {
        if (!initial?.notification?.data) return;
        const data = initial.notification.data;
        if (data.openCriticalAlarm !== '1' && String(data.openCriticalAlarm) !== 'true') return;
        openCriticalAlarm(
          router,
          typeof data.recordId === 'string' ? data.recordId : null,
          typeof data.alarmTitle === 'string' ? data.alarmTitle : null,
        );
      });
    }).catch(() => undefined);

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
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
