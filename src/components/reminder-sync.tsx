import { useReminderResponse } from '@/hooks/use-reminder-response';
import { useReminderSync } from '@/hooks/use-reminder-sync';

export function ReminderSync() {
  useReminderSync();
  useReminderResponse();
  return null;
}
