import Constants from 'expo-constants';

export const API_BASE_URL =
  Constants.expoConfig?.extra?.apiBaseUrl ?? 'http://localhost:3000/api';

export const POLL_INTERVAL_MS = 2500;
export const MAX_POLL_DURATION_MS = 120_000;

const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY ?? '';
const WHISPER_API_URL =
  process.env.EXPO_PUBLIC_WHISPER_API_URL ?? 'https://api.openai.com/v1/audio/transcriptions';
const ASSISTANT_API_URL = process.env.EXPO_PUBLIC_ASSISTANT_API_URL ?? '';
const WHISPER_MODEL = process.env.EXPO_PUBLIC_WHISPER_MODEL ?? 'whisper-1';
const WHISPER_LANGUAGE = process.env.EXPO_PUBLIC_WHISPER_LANGUAGE ?? 'es';

export const apiConfig = {
  openaiApiKey: OPENAI_API_KEY,
  whisperApiUrl: WHISPER_API_URL,
  whisperModel: WHISPER_MODEL,
  whisperLanguage: WHISPER_LANGUAGE,
  assistantApiUrl: ASSISTANT_API_URL,
} as const;

export function isWhisperConfigured(): boolean {
  if (apiConfig.openaiApiKey) return true;
  const isOpenAiDefault = apiConfig.whisperApiUrl.includes('api.openai.com');
  return !isOpenAiDefault && Boolean(apiConfig.whisperApiUrl);
}

export function isAssistantApiConfigured(): boolean {
  return Boolean(apiConfig.assistantApiUrl);
}
