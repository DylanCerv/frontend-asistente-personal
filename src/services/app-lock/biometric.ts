import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';

export type BiometricAuthType = 'face' | 'fingerprint' | 'unknown';
export type BiometricIconName = 'scan-outline' | 'finger-print-outline';

export type BiometricCapability = {
  isAvailable: boolean;
  hasHardware: boolean;
  isEnrolled: boolean;
  authType: BiometricAuthType;
  label: string;
  icon: BiometricIconName;
};

const FALLBACK_CAPABILITY: BiometricCapability = {
  isAvailable: false,
  hasHardware: false,
  isEnrolled: false,
  authType: 'unknown',
  label: 'Biometría',
  icon: 'finger-print-outline',
};

const FACE_PRESENTATION = {
  authType: 'face' as const,
  label: Platform.OS === 'ios' ? 'Face ID' : 'Reconocimiento facial',
  icon: 'scan-outline' as const,
};

const FINGERPRINT_PRESENTATION = {
  authType: 'fingerprint' as const,
  label: 'Huella dactilar',
  icon: 'finger-print-outline' as const,
};

const GENERIC_PRESENTATION = {
  authType: 'unknown' as const,
  label: 'Biometría',
  icon: 'finger-print-outline' as const,
};

function hasAuthenticationType(
  types: LocalAuthentication.AuthenticationType[],
  type: LocalAuthentication.AuthenticationType,
): boolean {
  return types.includes(type);
}

async function resolveIosPresentation(
  types: LocalAuthentication.AuthenticationType[],
): Promise<Pick<BiometricCapability, 'authType' | 'label' | 'icon'>> {
  if (hasAuthenticationType(types, LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
    return FACE_PRESENTATION;
  }

  if (hasAuthenticationType(types, LocalAuthentication.AuthenticationType.FINGERPRINT)) {
    return FINGERPRINT_PRESENTATION;
  }

  return GENERIC_PRESENTATION;
}

async function resolveAndroidPresentation(
  types: LocalAuthentication.AuthenticationType[],
): Promise<Pick<BiometricCapability, 'authType' | 'label' | 'icon'>> {
  const hasFingerprint = hasAuthenticationType(
    types,
    LocalAuthentication.AuthenticationType.FINGERPRINT,
  );
  const hasFace = hasAuthenticationType(
    types,
    LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION,
  );

  const enrolledLevel = await LocalAuthentication.getEnrolledLevelAsync();
  const hasStrongBiometrics =
    enrolledLevel >= LocalAuthentication.SecurityLevel.BIOMETRIC_STRONG;
  const hasOnlyWeakBiometrics =
    enrolledLevel >= LocalAuthentication.SecurityLevel.BIOMETRIC_WEAK && !hasStrongBiometrics;

  // Hardware can report face + fingerprint even if only one is enrolled.
  if (hasFingerprint && hasFace) {
    if (hasStrongBiometrics) {
      // Class 3 biometrics (fingerprint / 3D face). Fingerprint is far more common.
      return FINGERPRINT_PRESENTATION;
    }

    if (hasOnlyWeakBiometrics) {
      return FACE_PRESENTATION;
    }

    return GENERIC_PRESENTATION;
  }

  if (hasFingerprint) {
    return FINGERPRINT_PRESENTATION;
  }

  if (hasFace) {
    if (hasOnlyWeakBiometrics) {
      return FACE_PRESENTATION;
    }

    // Face-only hardware with strong biometrics: could be 3D face or a misreported fingerprint sensor.
    return hasStrongBiometrics ? GENERIC_PRESENTATION : FACE_PRESENTATION;
  }

  return GENERIC_PRESENTATION;
}

async function resolveBiometricPresentation(
  types: LocalAuthentication.AuthenticationType[],
): Promise<Pick<BiometricCapability, 'authType' | 'label' | 'icon'>> {
  if (Platform.OS === 'ios') {
    return resolveIosPresentation(types);
  }

  if (Platform.OS === 'android') {
    return resolveAndroidPresentation(types);
  }

  return GENERIC_PRESENTATION;
}

export async function getBiometricCapability(): Promise<BiometricCapability> {
  if (Platform.OS === 'web') {
    return FALLBACK_CAPABILITY;
  }

  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  const isEnrolled = hasHardware ? await LocalAuthentication.isEnrolledAsync() : false;
  const types = hasHardware ? await LocalAuthentication.supportedAuthenticationTypesAsync() : [];
  const presentation = await resolveBiometricPresentation(types);

  return {
    isAvailable: hasHardware && isEnrolled,
    hasHardware,
    isEnrolled,
    ...presentation,
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
