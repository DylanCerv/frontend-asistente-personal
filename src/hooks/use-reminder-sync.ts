import { useEffect } from 'react';
import { AppState } from 'react-native';

import { useAssistant } from '@/context/assistant-context';
import { useUserPreferences } from '@/context/user-preferences-context';
import {
  checkNotificationPermissionResult,
  syncReminderNotifications,
} from '@/services/reminders/reminder-notifications';

export function useReminderSync() {
  const { records } = useAssistant();
  const {
    reminderNotifications,
    pushNotifications,
    reminderAlertStyle,
    reminderAlertSound,
    reminderAlertVibration,
    setPushNotifications,
    setReminderNotifications,
  } = useUserPreferences();

  const remindersActive = reminderNotifications && pushNotifications;

  useEffect(() => {
    async function alignPermissionToggles() {
      const result = await checkNotificationPermissionResult();
      // Only clear prefs when the OS actually denied — not when the feature is
      // unavailable in this runtime (would falsely disable user settings).
      if (result.status !== 'denied') return;

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
    void syncReminderNotifications(records, remindersActive, reminderAlertStyle, {
      // Morning digest is bundled with smart reminders at 5:00 am.
      dailySummaryEnabled: remindersActive,
      soundId: reminderAlertSound,
      vibrationId: reminderAlertVibration,
    });
  }, [
    records,
    remindersActive,
    reminderAlertStyle,
    reminderAlertSound,
    reminderAlertVibration,
  ]);
}
