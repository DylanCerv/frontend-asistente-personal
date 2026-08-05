import { isRunningInExpoGo } from 'expo';
import { Platform } from 'react-native';

/**
 * Native-only features (widgets, local notifications, calendar, quick actions).
 *
 * Always off in Expo Go and on web.
 * On in development client / standalone APK / iOS builds.
 * Set EXPO_PUBLIC_NATIVE_BUILD=0 to force off even on a native binary.
 * EXPO_PUBLIC_NATIVE_BUILD=1 is still used at prebuild time (app.config.js / EAS).
 */
export function isNativeBuildEnabled(): boolean {
  if (process.env.EXPO_PUBLIC_NATIVE_BUILD === '0') return false;
  if (Platform.OS === 'web' || isRunningInExpoGo()) return false;
  return true;
}
