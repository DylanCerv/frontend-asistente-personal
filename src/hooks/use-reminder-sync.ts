import { useEffect } from 'react';
import { AppState } from 'react-native';

import { useAssistant } from '@/context/assistant-context';
import { useUserPreferences } from '@/context/user-preferences-context';
import {
  checkNotificationPermissions,
  syncReminderNotifications,
} from '@/services/reminders/reminder-notifications';

export function useReminderSync() {
  const { records } = useAssistant();
  const {
    reminderNotifications,
    pushNotifications,
    reminderAlertStyle,
    setPushNotifications,
    setReminderNotifications,
  } = useUserPreferences();

  const remindersActive = reminderNotifications && pushNotifications;

  useEffect(() => {
    async function alignPermissionToggles() {
      const granted = await checkNotificationPermissions();
      if (granted) return;

      if (pushNotifications) await setPushNotifications(false);
      if (reminderNotifications) await setReminderNotifications(false);
    }

    void alignPermissionToggles();

    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        void alignPermissionToggles();
      }
    });

    return () => subscription.remove();
  }, [
    pushNotifications,
    reminderNotifications,
    setPushNotifications,
    setReminderNotifications,
  ]);

  useEffect(() => {
    void syncReminderNotifications(records, remindersActive, reminderAlertStyle);
  }, [records, remindersActive, reminderAlertStyle]);
}
