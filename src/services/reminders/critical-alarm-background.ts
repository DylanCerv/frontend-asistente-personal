import { Platform } from 'react-native';

import { isNativeBuildEnabled } from '@/config/native-build';
import { applyFocusBackgroundAction } from '@/services/focus/focus-session-background';
import {
  FOCUS_ACTION_COMPLETE,
  FOCUS_ACTION_EXTEND,
  FOCUS_ACTION_POSTPONE,
  FOCUS_ACTION_STOP,
} from '@/services/focus/focus-session-notifications';
import {
  ACTION_COMPLETE,
  ACTION_SNOOZE,
  ACTION_TALK,
  cancelCriticalAlarmForRecord,
  CRITICAL_SNOOZE_MINUTES,
} from '@/services/reminders/critical-alarm-notifications';
import { snoozeInAppAlert } from '@/services/reminders/kivo-alerts';
import {
  parseReminderAlertSound,
  parseReminderAlertVibration,
} from '@/services/reminders/reminder-alert-presets';
import { parseReminderAlertStyle } from '@/services/reminders/reminder-alert-style';
import { snoozeReminderNotification } from '@/services/reminders/reminder-notifications';

/**
 * Single Notifee background handler (Notifee allows only one).
 * Dispatches critical-alarm and focus-session actions.
 */
export function registerCriticalAlarmBackgroundHandler(): void {
  if (!isNativeBuildEnabled() || Platform.OS !== 'android') return;

  void import('@notifee/react-native')
    .then((notifee) => {
      notifee.default.onBackgroundEvent(async ({ type, detail }) => {
        const { EventType } = notifee;
        if (type !== EventType.ACTION_PRESS && type !== EventType.PRESS) return;

        const data = detail.notification?.data ?? {};

        if (data.kind === 'focus-session') {
          const actionId = detail.pressAction?.id ?? 'default';
          if (actionId === FOCUS_ACTION_COMPLETE) {
            await applyFocusBackgroundAction('complete');
          } else if (actionId === FOCUS_ACTION_POSTPONE) {
            await applyFocusBackgroundAction('postpone');
          } else if (actionId === FOCUS_ACTION_EXTEND) {
            await applyFocusBackgroundAction('extend');
          } else if (actionId === FOCUS_ACTION_STOP) {
            await applyFocusBackgroundAction('stop');
          }
          return;
        }

        const recordId = typeof data.recordId === 'string' ? data.recordId : null;
        const alarmTitle =
          (typeof data.alarmTitle === 'string' && data.alarmTitle) ||
          detail.notification?.body ||
          'Recordatorio pospuesto';
        const actionId = detail.pressAction?.id ?? 'default';
        const alertStyle = parseReminderAlertStyle(data.alertStyle);
        const soundId = parseReminderAlertSound(data.soundId);
        const vibrationId = parseReminderAlertVibration(data.vibrationId);

        if (actionId === ACTION_SNOOZE && recordId) {
          snoozeInAppAlert(recordId, CRITICAL_SNOOZE_MINUTES);
          await snoozeReminderNotification(
            {
              recordId,
              title: 'Es la hora',
              body: alarmTitle,
              kind: 'critical',
            },
            alertStyle,
            CRITICAL_SNOOZE_MINUTES,
            { soundId, vibrationId },
          );
          if (detail.notification?.id) {
            await notifee.default.cancelNotification(detail.notification.id);
          }
          return;
        }

        if (actionId === ACTION_COMPLETE && recordId && recordId !== 'test-critical') {
          await cancelCriticalAlarmForRecord(recordId);
          if (detail.notification?.id) {
            await notifee.default.cancelNotification(detail.notification.id);
          }
          return;
        }

        if (actionId === ACTION_TALK && detail.notification?.id) {
          await notifee.default.cancelNotification(detail.notification.id);
        }
      });
    })
    .catch(() => {
      // Notifee unavailable in this runtime.
    });
}
