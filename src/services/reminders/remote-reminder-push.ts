import { AppState, Platform } from 'react-native';

import { presentActivityWakeAlert } from '@/services/reminders/activity-wake-notifications';
import { presentCriticalAlarmNow } from '@/services/reminders/critical-alarm-notifications';
import { wasRecentlyPresented } from '@/services/reminders/reminder-present-dedupe';
import type { ReminderAlertStyle } from '@/services/reminders/reminder-alert-style';

type PushData = Record<string, unknown>;

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function isTruthyFlag(value: unknown): boolean {
  return value === true || value === '1' || value === 'true';
}

function isServerPush(data: PushData | undefined | null): boolean {
  return asString(data?.source) === 'server';
}

export function readPushData(data: PushData | undefined | null): {
  recordId?: string;
  scheduleId?: string;
  kind?: string;
  alertLevel?: string;
  title?: string;
  body?: string;
  alarmTitle?: string;
  openCriticalAlarm: boolean;
  openWakeAlert: boolean;
  fromServer: boolean;
} {
  if (!data) {
    return { openCriticalAlarm: false, openWakeAlert: false, fromServer: false };
  }

  return {
    recordId: asString(data.recordId),
    scheduleId: asString(data.scheduleKey) ?? asString(data.scheduleId),
    kind: asString(data.kind),
    alertLevel: asString(data.alertLevel),
    title: asString(data.title),
    body: asString(data.body),
    alarmTitle: asString(data.alarmTitle) ?? asString(data.activityTitle),
    openCriticalAlarm: isTruthyFlag(data.openCriticalAlarm),
    openWakeAlert: isTruthyFlag(data.openWakeAlert),
    fromServer: isServerPush(data),
  };
}

/**
 * Handles a remote push for multi-device delivery.
 * Critical → full-screen alarm; activity-warning → wake heads-up.
 * Ignores local scheduled notifications (no source=server).
 */
export async function handleRemoteReminderPush(
  data: PushData | undefined | null,
  options?: { alertStyle?: ReminderAlertStyle },
): Promise<boolean> {
  try {
    const parsed = readPushData(data);
    if (!parsed.fromServer) return false;

    // Local AlarmManager and push often fire together on the same device.
    if (wasRecentlyPresented(parsed.scheduleId)) {
      return false;
    }

    const alertStyle = options?.alertStyle ?? 'both';

    if (parsed.openCriticalAlarm && parsed.recordId) {
      const headline = parsed.title || 'Es la hora';
      const alarmTitle = parsed.alarmTitle || parsed.body?.split('·')[0]?.trim() || 'Actividad';
      const shown = await presentCriticalAlarmNow(
        {
          recordId: parsed.recordId,
          title: headline,
          body: parsed.body,
          alarmTitle,
          scheduleId: parsed.scheduleId,
        },
        alertStyle,
      );

      if (shown && Platform.OS !== 'android' && AppState.currentState === 'active') {
        const Linking = await import('expo-linking');
        const deepLink = Linking.createURL('/critical-alarm', {
          queryParams: { recordId: parsed.recordId, title: alarmTitle },
        });
        try {
          await Linking.openURL(deepLink);
        } catch {
          // Navigation may already be handled.
        }
      }

      return shown;
    }

    if (parsed.openWakeAlert && parsed.recordId) {
      return presentActivityWakeAlert({
        recordId: parsed.recordId,
        title: parsed.title || 'En 30 minutos',
        body: parsed.body || `Tienes esta actividad: ${parsed.alarmTitle || 'Actividad'}`,
        scheduleId: parsed.scheduleId,
        alertStyle,
      });
    }

    return false;
  } catch {
    return false;
  }
}
