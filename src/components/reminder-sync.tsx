import { useDevicePushRegistration } from '@/hooks/use-device-push-registration';
import { useReminderResponse } from '@/hooks/use-reminder-response';
import { useReminderSync } from '@/hooks/use-reminder-sync';

export function ReminderSync() {
  useReminderSync();
  useReminderResponse();
  useDevicePushRegistration();
  return null;
}
