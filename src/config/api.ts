import Constants from 'expo-constants';

type ExpoExtra = {
  apiBaseUrl?: string;
  supabaseUrl?: string;
};

const extra = Constants.expoConfig?.extra as ExpoExtra | undefined;

export const API_BASE_URL = (
  process.env.EXPO_PUBLIC_API_BASE_URL ??
  extra?.apiBaseUrl ??
  'http://localhost:3000/api'
).replace(/\/$/, '');

export const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL ?? extra?.supabaseUrl ?? '';

export const POLL_INTERVAL_MS = 800;
export const MAX_POLL_DURATION_MS = 120_000;

function isPlaceholderUrl(url: string): boolean {
  return (
    url.includes('192.168.x.x') ||
    url.includes('your-api.com') ||
    url.includes('your-project')
  );
}

/** Backend API (auth, records, chat, audio jobs). */
export function isBackendConfigured(): boolean {
  const url = API_BASE_URL.trim();
  if (!url) return false;
  return !isPlaceholderUrl(url);
}
