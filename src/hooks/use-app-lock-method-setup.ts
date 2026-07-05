import { useState } from 'react';

import type { AppLockMethod } from '@/context/user-preferences-context';
import { useUserPreferences } from '@/context/user-preferences-context';
import { getBiometricCapability } from '@/services/app-lock/biometric';
import { hasPinConfigured } from '@/services/app-lock/pin-store';
import { showAppAlert } from '@/services/app-dialog';

type UseAppLockMethodSetupResult = {
  showPinSetup: boolean;
  handleMethodChange: (method: AppLockMethod) => Promise<void>;
  handlePinSetupComplete: () => Promise<void>;
  handlePinSetupCancel: () => void;
};

export function useAppLockMethodSetup(): UseAppLockMethodSetupResult {
  const { appLockMethod, enableAppLock, disableAppLock } = useUserPreferences();
  const [showPinSetup, setShowPinSetup] = useState(false);

  async function handleMethodChange(method: AppLockMethod) {
    if (method === appLockMethod) return;

    if (method === 'none') {
      await disableAppLock();
      return;
    }

    if (method === 'biometric') {
      const capability = await getBiometricCapability();
      if (!capability.isAvailable) {
        showAppAlert(
          'No disponible',
          capability.hasHardware && !capability.isEnrolled
            ? `Configura ${capability.label} en los ajustes de tu teléfono primero.`
            : `${capability.label} no está disponible en este dispositivo.`,
        );
        return;
      }

      await enableAppLock('biometric');
      return;
    }

    const pinReady = await hasPinConfigured();
    if (!pinReady) {
      setShowPinSetup(true);
      return;
    }

    await enableAppLock('pin');
  }

  async function handlePinSetupComplete() {
    await enableAppLock('pin');
    setShowPinSetup(false);
  }

  function handlePinSetupCancel() {
    setShowPinSetup(false);
  }

  return {
    showPinSetup,
    handleMethodChange,
    handlePinSetupComplete,
    handlePinSetupCancel,
  };
}
