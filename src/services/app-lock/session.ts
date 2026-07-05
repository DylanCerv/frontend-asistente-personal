import AsyncStorage from '@react-native-async-storage/async-storage';

const SKIP_ONCE_KEY = '@asistente/skip_app_lock_once';

export async function markSkipAppLockOnce(): Promise<void> {
  await AsyncStorage.setItem(SKIP_ONCE_KEY, 'true');
}

export async function consumeSkipAppLockOnce(): Promise<boolean> {
  const value = await AsyncStorage.getItem(SKIP_ONCE_KEY);
  if (value !== 'true') return false;
  await AsyncStorage.removeItem(SKIP_ONCE_KEY);
  return true;
}
