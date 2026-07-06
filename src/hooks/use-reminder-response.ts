import { isRunningInExpoGo } from 'expo';
import * as Device from 'expo-device';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';

let lastHandledNotificationId: string | null = null;

function canUseLocalNotifications(): boolean {
  return Platform.OS !== 'web' && Device.isDevice && !isRunningInExpoGo();
}

export function useReminderResponse() {
  const router = useRouter();

  useEffect(() => {
    if (!canUseLocalNotifications()) return;

    let subscription: { remove: () => void } | undefined;

    void import('expo-notifications').then((Notifications) => {
      function navigateFromNotification(
        identifier: string,
        data: Record<string, unknown> | undefined,
      ) {
        if (lastHandledNotificationId === identifier) return;

        const recordId = data?.recordId;
        if (typeof recordId !== 'string') return;

        lastHandledNotificationId = identifier;
        router.push({ pathname: '/agenda', params: { taskId: recordId } });
      }

      subscription = Notifications.addNotificationResponseReceivedListener((response) => {
        const { identifier } = response.notification.request;
        navigateFromNotification(identifier, response.notification.request.content.data);
      });

      void Notifications.getLastNotificationResponseAsync().then((response) => {
        if (!response) return;
        const { identifier } = response.notification.request;
        navigateFromNotification(identifier, response.notification.request.content.data);
      });
    });

    return () => subscription?.remove();
  }, [router]);
}
