import { useEffect } from 'react';

import { useAssistant } from '@/context/assistant-context';
import { useUserPreferences } from '@/context/user-preferences-context';
import { syncReminderNotifications } from '@/services/reminders/reminder-notifications';

export function useReminderSync() {
  const { records } = useAssistant();
  const { reminderNotifications } = useUserPreferences();

  useEffect(() => {
    void syncReminderNotifications(records, reminderNotifications);
  }, [records, reminderNotifications]);
}
