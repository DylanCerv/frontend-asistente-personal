import AsyncStorage from '@react-native-async-storage/async-storage';
import { isRunningInExpoGo } from 'expo';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

import { apiRequest } from '@/services/api/api-client';
import { isNativeBuildEnabled } from '@/config/native-build';
import { requestNotificationPermissions } from '@/services/reminders/reminder-notifications';

const PUSH_TOKEN_STORAGE_KEY = '@kivo/device_expo_push_token';

type RegisterPushTokenPayload = {
  token: string;
  platform: 'ios' | 'android' | 'web' | 'unknown';
  deviceId?: string | null;
  appVersion?: string | null;
};

let lastRegisteredToken: string | null = null;
let registerInFlight: Promise<string | null> | null = null;

function getEasProjectId(): string | undefined {
  const extra = Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined;
  return extra?.eas?.projectId ?? Constants.easConfig?.projectId;
}

function resolvePlatform(): RegisterPushTokenPayload['platform'] {
  if (Platform.OS === 'ios') return 'ios';
  if (Platform.OS === 'android') return 'android';
  if (Platform.OS === 'web') return 'web';
  return 'unknown';
}

function canRegisterPush(): boolean {
  return (
    isNativeBuildEnabled() &&
    Device.isDevice &&
    !isRunningInExpoGo() &&
    Platform.OS !== 'web'
  );
}

async function getExpoPushToken(): Promise<string | null> {
  if (!canRegisterPush()) return null;

  const granted = await requestNotificationPermissions();
  if (!granted) return null;

  const projectId = getEasProjectId();
  if (!projectId) return null;

  try {
    const Notifications = await import('expo-notifications');
    const result = await Notifications.getExpoPushTokenAsync({ projectId });
    return result.data || null;
  } catch {
    return null;
  }
}

async function persistToken(token: string | null): Promise<void> {
  try {
    if (token) {
      await AsyncStorage.setItem(PUSH_TOKEN_STORAGE_KEY, token);
    } else {
      await AsyncStorage.removeItem(PUSH_TOKEN_STORAGE_KEY);
    }
  } catch {
    // Storage failures must not block push registration.
  }
}

async function readPersistedToken(): Promise<string | null> {
  try {
    return (await AsyncStorage.getItem(PUSH_TOKEN_STORAGE_KEY))?.trim() || null;
  } catch {
    return null;
  }
}

async function registerTokenOnServer(payload: RegisterPushTokenPayload): Promise<void> {
  await apiRequest('/devices/push-token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

/**
 * Registers this device's Expo push token with the backend so the account
 * can receive reminders/alarms on every logged-in device.
 * Never throws — safe to call from effects / sign-in flows.
 */
export async function registerDevicePushToken(): Promise<string | null> {
  if (registerInFlight) return registerInFlight;

  registerInFlight = (async () => {
    try {
      const token = await getExpoPushToken();
      if (!token) return null;
      if (token === lastRegisteredToken) return token;

      await registerTokenOnServer({
        token,
        platform: resolvePlatform(),
        deviceId: Device.modelId ?? Device.modelName ?? null,
        appVersion: Constants.expoConfig?.version ?? null,
      });

      lastRegisteredToken = token;
      await persistToken(token);
      return token;
    } catch {
      // Backend offline / auth expired — local alarms still work on this device.
      return null;
    } finally {
      registerInFlight = null;
    }
  })();

  return registerInFlight;
}

export async function unregisterDevicePushToken(): Promise<void> {
  const token = lastRegisteredToken ?? (await readPersistedToken());
  lastRegisteredToken = null;
  await persistToken(null);

  if (!token) return;

  try {
    await apiRequest('/devices/push-token', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
  } catch {
    // Best-effort on sign-out.
  }
}
