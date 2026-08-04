import AsyncStorage from '@react-native-async-storage/async-storage';

import type { ApiSession } from '@/types/api';

const SESSION_STORAGE_KEY = '@asistente/auth-session';

export async function getStoredSession(): Promise<ApiSession | null> {
  const raw = await AsyncStorage.getItem(SESSION_STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as ApiSession;
  } catch {
    await AsyncStorage.removeItem(SESSION_STORAGE_KEY);
    return null;
  }
}

export async function setStoredSession(session: ApiSession): Promise<void> {
  await AsyncStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

export async function clearStoredSession(): Promise<void> {
  await AsyncStorage.removeItem(SESSION_STORAGE_KEY);
}

export async function getAccessToken(): Promise<string | null> {
  const session = await getStoredSession();
  return session?.accessToken ?? null;
}
