import { isRunningInExpoGo } from 'expo';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

import { isNativeBuildEnabled } from '@/config/native-build';

export type PermissionStatus = 'granted' | 'denied' | 'unavailable';

export type PermissionUnavailableReason =
  | 'expo_go'
  | 'missing_native_flag'
  | 'emulator'
  | 'web'
  | 'unsupported_platform';

export type PermissionResult = {
  status: PermissionStatus;
  reason?: PermissionUnavailableReason;
};

export function getNativeFeatureUnavailableReason(
  options: { androidOnly?: boolean } = {},
): PermissionUnavailableReason | null {
  if (Platform.OS === 'web') return 'web';
  if (options.androidOnly && Platform.OS !== 'android') return 'unsupported_platform';
  if (!Device.isDevice) return 'emulator';
  if (isRunningInExpoGo()) return 'expo_go';
  if (!isNativeBuildEnabled()) return 'missing_native_flag';
  return null;
}

export function unavailableResult(
  reason: PermissionUnavailableReason,
): PermissionResult {
  return { status: 'unavailable', reason };
}

export function grantedResult(): PermissionResult {
  return { status: 'granted' };
}

export function deniedResult(): PermissionResult {
  return { status: 'denied' };
}

export function isPermissionGranted(result: PermissionResult): boolean {
  return result.status === 'granted';
}

export function permissionUnavailableMessage(reason?: PermissionUnavailableReason): string {
  switch (reason) {
    case 'expo_go':
      return 'Esta función requiere la app Kivo instalada (APK / App Store). No está disponible en Expo Go.';
    case 'missing_native_flag':
      return 'Esta función no está disponible en este entorno. Usa la app nativa de Kivo.';
    case 'emulator':
      return 'Esta función solo funciona en un teléfono físico.';
    case 'web':
      return 'Esta función no está disponible en la versión web.';
    case 'unsupported_platform':
      return 'Esta función solo está disponible en Android.';
    default:
      return 'Esta función no está disponible en este entorno.';
  }
}

export function permissionStatusLabel(status: PermissionStatus): string {
  switch (status) {
    case 'granted':
      return 'Activo';
    case 'denied':
      return 'Pendiente';
    case 'unavailable':
      return 'No disponible';
  }
}
