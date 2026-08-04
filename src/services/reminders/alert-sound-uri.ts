import AsyncStorage from '@react-native-async-storage/async-storage';
import { isRunningInExpoGo } from 'expo';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

import { isNativeBuildEnabled } from '@/config/native-build';
import type { ReminderAlertSoundId } from '@/services/reminders/reminder-alert-presets';

const CUSTOM_SOUND_URI_KEY = '@asistente/reminder_alert_custom_sound_uri';
const CUSTOM_SOUND_NAME_KEY = '@asistente/reminder_alert_custom_sound_name';
/** Optional override of the OS default (picked via RingtoneManager). */
const SYSTEM_SOUND_URI_KEY = '@asistente/reminder_alert_system_sound_uri';
const SYSTEM_SOUND_NAME_KEY = '@asistente/reminder_alert_system_sound_name';

export type AlertSoundUriState = {
  customUri: string | null;
  customName: string | null;
  systemUri: string | null;
  systemName: string | null;
};

export async function loadAlertSoundUriState(): Promise<AlertSoundUriState> {
  const [customUri, customName, systemUri, systemName, legacyRingtoneUri, legacyRingtoneName] =
    await Promise.all([
      AsyncStorage.getItem(CUSTOM_SOUND_URI_KEY),
      AsyncStorage.getItem(CUSTOM_SOUND_NAME_KEY),
      AsyncStorage.getItem(SYSTEM_SOUND_URI_KEY),
      AsyncStorage.getItem(SYSTEM_SOUND_NAME_KEY),
      AsyncStorage.getItem('@asistente/reminder_alert_ringtone_uri'),
      AsyncStorage.getItem('@asistente/reminder_alert_ringtone_name'),
    ]);

  // Migrate legacy "ringtone" keys into system override once.
  let resolvedSystemUri = systemUri;
  let resolvedSystemName = systemName;
  if (!resolvedSystemUri && legacyRingtoneUri) {
    resolvedSystemUri = legacyRingtoneUri;
    resolvedSystemName = legacyRingtoneName;
    await AsyncStorage.multiSet([
      [SYSTEM_SOUND_URI_KEY, legacyRingtoneUri],
      [SYSTEM_SOUND_NAME_KEY, legacyRingtoneName ?? 'Tono del sistema'],
    ]);
  }

  return {
    customUri,
    customName,
    systemUri: resolvedSystemUri,
    systemName: resolvedSystemName,
  };
}

export async function saveCustomAlertSound(uri: string, name: string): Promise<void> {
  await AsyncStorage.multiSet([
    [CUSTOM_SOUND_URI_KEY, uri],
    [CUSTOM_SOUND_NAME_KEY, name],
  ]);
}

export async function saveSystemAlertSound(uri: string, name: string): Promise<void> {
  await AsyncStorage.multiSet([
    [SYSTEM_SOUND_URI_KEY, uri],
    [SYSTEM_SOUND_NAME_KEY, name],
  ]);
}

export async function clearSystemAlertSoundOverride(): Promise<void> {
  await AsyncStorage.multiRemove([SYSTEM_SOUND_URI_KEY, SYSTEM_SOUND_NAME_KEY]);
}

function getDefaultOsSoundUriFromNative(): string | null {
  if (Platform.OS !== 'android') return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const native = require('kivo-focus-lock') as {
      getDefaultNotificationSoundUri?: () => string | null;
    };
    return native.getDefaultNotificationSoundUri?.() ?? null;
  } catch {
    return null;
  }
}

/**
 * Resolve playable URI for channels / preview.
 * - custom → file from storage
 * - system → user-picked OS tone, else Android default notification URI
 */
export async function resolveAlertSoundUri(
  soundId: ReminderAlertSoundId,
): Promise<string | null> {
  if (soundId === 'custom') {
    return (await AsyncStorage.getItem(CUSTOM_SOUND_URI_KEY)) ?? null;
  }
  if (soundId === 'system') {
    const override = await AsyncStorage.getItem(SYSTEM_SOUND_URI_KEY);
    if (override) return override;
    return getDefaultOsSoundUriFromNative();
  }
  return null;
}

export async function getAlertSoundDisplayLabel(
  soundId: ReminderAlertSoundId,
): Promise<string | null> {
  if (soundId === 'custom') {
    return AsyncStorage.getItem(CUSTOM_SOUND_NAME_KEY);
  }
  if (soundId === 'system') {
    return AsyncStorage.getItem(SYSTEM_SOUND_NAME_KEY);
  }
  return null;
}

export function canUseCustomAlertSounds(): boolean {
  return Platform.OS !== 'web';
}

export function canUseSystemRingtonePicker(): boolean {
  return (
    isNativeBuildEnabled() &&
    Platform.OS === 'android' &&
    Device.isDevice &&
    !isRunningInExpoGo()
  );
}
