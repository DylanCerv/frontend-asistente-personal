import {
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  type AudioRecorder,
  type RecordingOptions,
} from 'expo-audio';

export async function ensureMicrophonePermission(): Promise<boolean> {
  const permission = await requestRecordingPermissionsAsync();
  return permission.granted;
}

export async function configureRecordingAudioMode(): Promise<void> {
  await setAudioModeAsync({
    allowsRecording: true,
    playsInSilentMode: true,
    interruptionMode: 'duckOthers',
  });
}

/**
 * Stops an active or prepared recorder session so a new recording can start safely.
 */
export async function releaseAudioRecorderSession(recorder: AudioRecorder): Promise<void> {
  const status = recorder.getStatus();
  if (!status.isRecording && !status.canRecord) return;

  try {
    await recorder.stop();
  } catch {
    // Session may already be idle.
  }
}

/**
 * Prepares (if needed) and starts recording without double-prepare crashes on Android.
 */
export async function beginAudioRecordingSession(
  recorder: AudioRecorder,
  options: RecordingOptions,
): Promise<void> {
  let status = recorder.getStatus();

  if (status.isRecording) {
    await recorder.stop();
    status = recorder.getStatus();
  }

  if (!status.canRecord) {
    await recorder.prepareToRecordAsync(options);
  }

  recorder.record();
}
