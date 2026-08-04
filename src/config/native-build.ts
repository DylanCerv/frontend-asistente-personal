/**
 * Native-only features (widgets, local notifications, quick actions).
 * Off in Expo Go by default. Set EXPO_PUBLIC_NATIVE_BUILD=1 for APK / EAS.
 */
export function isNativeBuildEnabled(): boolean {
  return process.env.EXPO_PUBLIC_NATIVE_BUILD === '1';
}
