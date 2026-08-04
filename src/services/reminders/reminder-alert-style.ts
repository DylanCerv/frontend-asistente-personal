import type { ReminderAlertLevel } from '@/services/reminders/reminder-rules';

export type ReminderAlertStyle = 'sound' | 'vibration' | 'both';

export const DEFAULT_REMINDER_ALERT_STYLE: ReminderAlertStyle = 'both';

export function parseReminderAlertStyle(value: unknown): ReminderAlertStyle {
  if (value === 'sound' || value === 'vibration' || value === 'both') return value;
  return DEFAULT_REMINDER_ALERT_STYLE;
}

export function shouldPlaySound(
  style: ReminderAlertStyle,
  alertLevel: ReminderAlertLevel,
): boolean {
  if (style === 'vibration') return false;
  if (alertLevel === 'alarm') return true;
  return style === 'sound' || style === 'both';
}

export function shouldVibrate(style: ReminderAlertStyle): boolean {
  return style === 'vibration' || style === 'both';
}
