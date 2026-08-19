import * as Speech from 'expo-speech';

export function stopSpokenReply() {
  Speech.stop();
}

export function speakAssistantReply(text: string) {
  const trimmed = text.trim();
  if (!trimmed) return;

  Speech.stop();
  Speech.speak(trimmed, {
    language: 'es',
    pitch: 1,
    rate: 1.02,
  });
}

export function spokenReplyDurationMs(text: string) {
  return Math.min(20000, Math.max(4500, text.trim().length * 80));
}
