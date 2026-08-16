import { AudioQuality, IOSOutputFormat, type RecordingOptions } from 'expo-audio';

/**
 * Lightweight speech recording for OpenAI Whisper.
 * OpenAI accepts: flac, m4a, mp3, mp4, mpeg, mpga, oga, ogg, wav, webm.
 *
 * AAC/M4A at 16 kHz mono ~24 kbps keeps files small and Whisper-compatible.
 */
export const LIGHT_VOICE_RECORDING_OPTIONS: RecordingOptions = {
  extension: '.m4a',
  sampleRate: 16000,
  numberOfChannels: 1,
  bitRate: 24000,
  isMeteringEnabled: true,
  android: {
    extension: '.m4a',
    outputFormat: 'mpeg4',
    audioEncoder: 'aac',
    audioSource: 'voice_recognition',
  },
  ios: {
    extension: '.m4a',
    outputFormat: IOSOutputFormat.MPEG4AAC,
    audioQuality: AudioQuality.LOW,
  },
  web: {
    mimeType: 'audio/webm',
    bitsPerSecond: 24000,
  },
};

export const LIGHT_VOICE_UPLOAD = {
  fileName: 'voice.m4a',
  mimeType: 'audio/m4a',
} as const;

/** Reject accidental taps / empty clips before upload or Whisper processing. */
export const MIN_VOICE_RECORDING_MS = 1000;

export const SHORT_VOICE_RECORDING_MESSAGE =
  'El audio es muy corto. Habla al menos 1 segundo e intenta de nuevo.';

export function isVoiceRecordingTooShort(durationMs: number): boolean {
  return !Number.isFinite(durationMs) || durationMs < MIN_VOICE_RECORDING_MS;
}
