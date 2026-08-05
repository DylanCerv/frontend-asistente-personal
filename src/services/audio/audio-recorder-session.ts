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

function readRecorderStatus(recorder: AudioRecorder) {
  try {
    return recorder.getStatus();
  } catch {
    // Native shared object may already be released (Integer cast / released object).
    return null;
  }
}

/**
 * Stops an active or prepared recorder session so a new recording can start safely.
 */
export async function releaseAudioRecorderSession(recorder: AudioRecorder): Promise<void> {
  const status = readRecorderStatus(recorder);
  if (!status || (!status.isRecording && !status.canRecord)) return;

  try {
    await recorder.stop();
  } catch {
    // Session may already be idle or released.
  }
}

/**
 * Prepares (if needed) and starts recording without double-prepare crashes on Android.
 */
export async function beginAudioRecordingSession(
  recorder: AudioRecorder,
  options: RecordingOptions,
): Promise<void> {
  let status = readRecorderStatus(recorder);
  if (!status) return;

  if (status.isRecording) {
    try {
      await recorder.stop();
    } catch {
      // Already stopped.
    }
    status = readRecorderStatus(recorder);
    if (!status) return;
  }

  if (!status.canRecord) {
    await recorder.prepareToRecordAsync(options);
  }

  recorder.record();
}
