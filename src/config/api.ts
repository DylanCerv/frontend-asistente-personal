import Constants from 'expo-constants';

type ExpoExtra = {
  apiBaseUrl?: string;
  supabaseUrl?: string;
};

const extra = Constants.expoConfig?.extra as ExpoExtra | undefined;

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ??
  extra?.apiBaseUrl ??
  'http://localhost:3000/api';

export const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL ?? extra?.supabaseUrl ?? '';

export const POLL_INTERVAL_MS = 2500;
export const MAX_POLL_DURATION_MS = 120_000;

const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY ?? '';
const WHISPER_API_URL = process.env.EXPO_PUBLIC_WHISPER_API_URL ?? '';
const WHISPER_MODEL = process.env.EXPO_PUBLIC_WHISPER_MODEL ?? 'whisper-1';
const WHISPER_LANGUAGE = process.env.EXPO_PUBLIC_WHISPER_LANGUAGE ?? 'es';

export const apiConfig = {
  openaiApiKey: OPENAI_API_KEY,
  whisperApiUrl: WHISPER_API_URL,
  whisperModel: WHISPER_MODEL,
  whisperLanguage: WHISPER_LANGUAGE,
} as const;

function isPlaceholderUrl(url: string): boolean {
  return url.includes('192.168.x.x') || url.includes('your-api.com') || url.includes('your-project');
}

/** Backend API (auth, records, chat, audio jobs). */
export function isBackendConfigured(): boolean {
  const url = API_BASE_URL.trim();
  if (!url) return false;
  return !isPlaceholderUrl(url);
}

/** @deprecated Use isBackendConfigured — chat goes through /api/chat on the same backend. */
export function isAssistantApiConfigured(): boolean {
  return isBackendConfigured();
}

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
