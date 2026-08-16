import {
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  type AudioRecorder,
  type RecordingOptions,
} from 'expo-audio';

function isTransientAudioSessionError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? '');
  return (
    /keep awake/i.test(message) ||
    /current activity is no longer available/i.test(message) ||
    /activity.*destroyed/i.test(message)
  );
}

export async function ensureMicrophonePermission(): Promise<boolean> {
  const permission = await requestRecordingPermissionsAsync();
  return permission.granted;
}

export async function configureRecordingAudioMode(): Promise<void> {
  try {
    await setAudioModeAsync({
      allowsRecording: true,
      playsInSilentMode: true,
      interruptionMode: 'duckOthers',
    });
  } catch (error) {
    // Expo Go on Android can reject briefly while the activity is resuming.
    if (!isTransientAudioSessionError(error)) throw error;
  }
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

  try {
    // Best-effort reset so Expo Go does not leave keep-awake pending after close.
    await setAudioModeAsync({
      allowsRecording: false,
      playsInSilentMode: true,
    });
  } catch {
    // Ignore mode reset failures on teardown.
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
    try {
      await recorder.prepareToRecordAsync(options);
    } catch (error) {
      if (!isTransientAudioSessionError(error)) throw error;
      // Retry once after a short delay when Expo Go is still waking the activity.
      await new Promise((resolve) => setTimeout(resolve, 120));
      await recorder.prepareToRecordAsync(options);
    }
  }

  try {
    recorder.record();
  } catch (error) {
    if (!isTransientAudioSessionError(error)) throw error;
  }
}
