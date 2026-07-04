import Constants from 'expo-constants';

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ??
  Constants.expoConfig?.extra?.apiBaseUrl ??
  'http://localhost:3000/api';

export const POLL_INTERVAL_MS = 2500;
export const MAX_POLL_DURATION_MS = 120_000;

const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY ?? '';
const WHISPER_API_URL = process.env.EXPO_PUBLIC_WHISPER_API_URL ?? '';
const ASSISTANT_API_URL =
  process.env.EXPO_PUBLIC_ASSISTANT_API_URL ?? `${API_BASE_URL}/chat`;
const WHISPER_MODEL = process.env.EXPO_PUBLIC_WHISPER_MODEL ?? 'whisper-1';
const WHISPER_LANGUAGE = process.env.EXPO_PUBLIC_WHISPER_LANGUAGE ?? 'es';

export const apiConfig = {
  openaiApiKey: OPENAI_API_KEY,
  whisperApiUrl: WHISPER_API_URL,
  whisperModel: WHISPER_MODEL,
  whisperLanguage: WHISPER_LANGUAGE,
  assistantApiUrl: ASSISTANT_API_URL,
} as const;

/** Optional remote STT for development only. Production uses on-device speech. */
export function isWhisperConfigured(): boolean {
  const url = apiConfig.whisperApiUrl.trim();
  if (!url) return false;

  const isOpenAi = url.includes('api.openai.com');
  if (!isOpenAi) return true;

  if (!apiConfig.openaiApiKey || apiConfig.openaiApiKey.includes('your-key')) return false;
  if (apiConfig.openaiApiKey === 'sk-your-key-here') return false;
  return true;
}

export function isAssistantApiConfigured(): boolean {
  const url = apiConfig.assistantApiUrl.trim();
  if (!url) return false;
  return !url.includes('your-api.com');
}
