import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';

export type BiometricCapability = {
  isAvailable: boolean;
  hasHardware: boolean;
  isEnrolled: boolean;
  label: string;
};

export async function getBiometricCapability(): Promise<BiometricCapability> {
  if (Platform.OS === 'web') {
    return { isAvailable: false, hasHardware: false, isEnrolled: false, label: 'Biometría' };
  }

  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  const isEnrolled = hasHardware ? await LocalAuthentication.isEnrolledAsync() : false;
  const types = hasHardware ? await LocalAuthentication.supportedAuthenticationTypesAsync() : [];
  const label = types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)
    ? 'Face ID'
    : types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)
      ? 'Huella'
      : 'Biometría';

  return {
    isAvailable: hasHardware && isEnrolled,
    hasHardware,
    isEnrolled,
    label,
  };
}

export async function authenticateWithBiometric(promptMessage: string): Promise<boolean> {
  const capability = await getBiometricCapability();
  if (!capability.isAvailable) return false;

  const result = await LocalAuthentication.authenticateAsync({
    promptMessage,
    cancelLabel: 'Cancelar',
    disableDeviceFallback: true,
  });

  return result.success;
}
