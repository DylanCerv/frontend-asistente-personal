import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';

import { useAuth } from '@/context/auth-context';
import { useUserPreferences } from '@/context/user-preferences-context';
import { isNativeBuildEnabled } from '@/config/native-build';
import {
  registerDevicePushToken,
  unregisterDevicePushToken,
} from '@/services/reminders/device-push-token';
import { handleRemoteReminderPush } from '@/services/reminders/remote-reminder-push';

/**
 * Registers the Expo push token for multi-device delivery and handles
 * incoming remote reminder / critical-alarm pushes.
 */
export function useDevicePushRegistration() {
  const { isAuthenticated, user } = useAuth();
  const { pushNotifications, reminderNotifications, reminderAlertStyle } =
    useUserPreferences();

  const enabled =
    isAuthenticated &&
    Boolean(user) &&
    pushNotifications &&
    reminderNotifications &&
    isNativeBuildEnabled();

  useEffect(() => {
    if (!enabled) return;

    void registerDevicePushToken().catch(() => undefined);

    const subscription = AppState.addEventListener('change', (next) => {
      if (next === 'active') {
        void registerDevicePushToken().catch(() => undefined);
      }
    });

    return () => subscription.remove();
  }, [enabled, user?.id]);

  useEffect(() => {
    if (!enabled || Platform.OS === 'web') return;

    let receivedSub: { remove: () => void } | undefined;
    let responseSub: { remove: () => void } | undefined;
    let cancelled = false;

    async function attach() {
      try {
        const Notifications = await import('expo-notifications');
        if (cancelled) return;

        receivedSub = Notifications.addNotificationReceivedListener((notification) => {
          void (async () => {
            const handled = await handleRemoteReminderPush(
              notification.request.content.data,
              { alertStyle: reminderAlertStyle },
            );
            // Local Notifee already owns critical/wake UI — drop the Expo tray copy.
            if (handled && notification.request.identifier) {
              try {
                await Notifications.dismissNotificationAsync(notification.request.identifier);
              } catch {
                // Best-effort.
              }
            }
          })();
        });

        responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
          void handleRemoteReminderPush(response.notification.request.content.data, {
            alertStyle: reminderAlertStyle,
          });
        });
      } catch {
        // expo-notifications unavailable in this runtime.
      }
    }

    void attach();

    return () => {
      cancelled = true;
      receivedSub?.remove();
      responseSub?.remove();
    };
  }, [enabled, reminderAlertStyle]);
}

export async function clearDevicePushOnSignOut(): Promise<void> {
  await unregisterDevicePushToken();
}
