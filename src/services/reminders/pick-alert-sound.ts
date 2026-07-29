import * as DocumentPicker from 'expo-document-picker';
import { copyAsync, documentDirectory } from 'expo-file-system/legacy';
import { Platform } from 'react-native';

import {
  canUseCustomAlertSounds,
  canUseSystemRingtonePicker,
  clearSystemAlertSoundOverride,
  saveCustomAlertSound,
  saveSystemAlertSound,
} from '@/services/reminders/alert-sound-uri';

export type PickedAlertSound = {
  soundId: 'custom' | 'system';
  uri: string;
  name: string;
};

function safeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80) || 'alert-tone';
}

/** Pick an audio file from device storage and copy it into the app documents folder. */
export async function pickCustomAlertSoundFile(): Promise<PickedAlertSound | null> {
  if (!canUseCustomAlertSounds() || !documentDirectory) return null;

  const result = await DocumentPicker.getDocumentAsync({
    type: ['audio/*'],
    copyToCacheDirectory: true,
    multiple: false,
  });

  if (result.canceled || !result.assets?.[0]) return null;

  const asset = result.assets[0];
  const displayName = asset.name?.trim() || 'Audio personalizado';
  const dest = `${documentDirectory}kivo-alert-${safeFileName(displayName)}`;

  try {
    await copyAsync({ from: asset.uri, to: dest });
    await saveCustomAlertSound(dest, displayName);
    return { soundId: 'custom', uri: dest, name: displayName };
  } catch {
    if (!asset.uri) return null;
    await saveCustomAlertSound(asset.uri, displayName);
    return { soundId: 'custom', uri: asset.uri, name: displayName };
  }
}

/**
 * Open Android system notification ringtone picker and store as Sistema override.
 */
export async function pickSystemRingtone(): Promise<PickedAlertSound | null> {
  if (!canUseSystemRingtonePicker()) return null;

  try {
    const IntentLauncher = await import('expo-intent-launcher');
    const result = await IntentLauncher.startActivityAsync(
      'android.intent.action.RINGTONE_PICKER',
      {
        extra: {
          'android.intent.extra.ringtone.Type': 7, // TYPE_ALL (alarm + notification + ringtone)
          'android.intent.extra.ringtone.ShowDefault': true,
          'android.intent.extra.ringtone.ShowSilent': false,
          'android.intent.extra.ringtone.Title': 'Tono del sistema',
        },
      },
    );

    if (result.resultCode !== IntentLauncher.ResultCode.Success) {
      return null;
    }

    const data = result.data;
    let uri: string | null = typeof data === 'string' ? data : null;

    if (!uri && data && typeof data === 'object') {
      const record = data as Record<string, unknown>;
      if (typeof record.uri === 'string') uri = record.uri;
    }

    if (!uri) return null;

    let title = 'Tono del sistema';
    if (Platform.OS === 'android') {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const native = require('kivo-focus-lock') as {
          getRingtoneTitle?: (uri: string) => string | null;
        };
        const resolved = native.getRingtoneTitle?.(uri);
        if (resolved) title = resolved;
      } catch {
        // Title optional.
      }
    }

    await saveSystemAlertSound(uri, title);
    return { soundId: 'system', uri, name: title };
  } catch {
    return null;
  }
}

/** Reset Sistema to the OS default notification sound (clear override). */
export async function resetSystemAlertSoundToDefault(): Promise<void> {
  await clearSystemAlertSoundOverride();
}
