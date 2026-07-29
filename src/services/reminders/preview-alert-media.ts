import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import { Vibration } from 'react-native';

import { resolveAlertSoundUri } from '@/services/reminders/alert-sound-uri';
import {
  resolvePlaybackAsset,
  resolveVibrationPattern,
  type ReminderAlertSoundId,
  type ReminderAlertVibrationId,
} from '@/services/reminders/reminder-alert-presets';

let previewPlayer: AudioPlayer | null = null;

function stopPreviewSound() {
  try {
    previewPlayer?.pause();
    previewPlayer?.remove();
  } catch {
    // Already released.
  }
  previewPlayer = null;
}

export async function previewAlertSound(soundId: ReminderAlertSoundId): Promise<void> {
  stopPreviewSound();
  Vibration.cancel();

  try {
    await setAudioModeAsync({
      playsInSilentMode: true,
      allowsRecording: false,
    });

    const uri =
      soundId === 'custom' || soundId === 'system'
        ? await resolveAlertSoundUri(soundId)
        : null;

    const bundled = soundId === 'kivo_clear' ? resolvePlaybackAsset(soundId) : null;
    if (!uri && !bundled) return;

    const source = uri ? { uri } : bundled;
    if (!source) return;

    const player = createAudioPlayer(source);
    previewPlayer = player;
    player.play();
    setTimeout(() => {
      if (previewPlayer === player) stopPreviewSound();
    }, 1600);
  } catch {
    // Preview is best-effort (content:// may need APK).
  }
}

export function previewAlertVibration(vibrationId: ReminderAlertVibrationId): void {
  Vibration.cancel();
  Vibration.vibrate(resolveVibrationPattern(vibrationId, true));
}
