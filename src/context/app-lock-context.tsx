import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AppState, Platform, type AppStateStatus } from 'react-native';

import { useUserPreferences } from '@/context/user-preferences-context';
import {
  authenticateWithBiometric,
  getBiometricCapability,
  type BiometricIconName,
} from '@/services/app-lock/biometric';
import { hasPinConfigured, verifyPin } from '@/services/app-lock/pin-store';
import { consumeSkipAppLockOnce } from '@/services/app-lock/session';

type AppLockContextValue = {
  isLocked: boolean;
  isCheckingBiometric: boolean;
  biometricLabel: string;
  biometricIcon: BiometricIconName;
  canUseBiometric: boolean;
  canUsePin: boolean;
  unlockSession: () => void;
  lockSession: () => void;
  skipNextLock: () => void;
  tryBiometricUnlock: () => Promise<boolean>;
  tryPinUnlock: (pin: string) => Promise<boolean>;
};

const AppLockContext = createContext<AppLockContextValue | null>(null);

function clearLockTimer(timerRef: { current: ReturnType<typeof setTimeout> | null }) {
  if (timerRef.current) {
    clearTimeout(timerRef.current);
    timerRef.current = null;
  }
}

export function AppLockProvider({ children }: { children: ReactNode }) {
  const { appLockMethod, appLockDelaySeconds } = useUserPreferences();
  const [isLocked, setIsLocked] = useState(false);
  const [isCheckingBiometric, setIsCheckingBiometric] = useState(false);
  const [biometricLabel, setBiometricLabel] = useState('Biometría');
  const [biometricIcon, setBiometricIcon] = useState<BiometricIconName>('finger-print-outline');
  const [canUseBiometric, setCanUseBiometric] = useState(false);
  const [canUsePin, setCanUsePin] = useState(false);
  const skipNextLockRef = useRef(false);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const backgroundedAtRef = useRef<number | null>(null);
  const lockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isLockActive = appLockMethod !== 'none' && Platform.OS !== 'web';

  const refreshCapabilities = useCallback(async () => {
    const [capability, pinConfigured] = await Promise.all([
      getBiometricCapability(),
      hasPinConfigured(),
    ]);
    setBiometricLabel(capability.label);
    setBiometricIcon(capability.icon);
    setCanUseBiometric(capability.isAvailable);
    setCanUsePin(pinConfigured);
  }, []);

  useEffect(() => {
    void refreshCapabilities();
  }, [refreshCapabilities, appLockMethod]);

  useEffect(() => {
    if (isLockActive && isLocked) {
      void refreshCapabilities();
    }
  }, [isLockActive, isLocked, refreshCapabilities]);

  const unlockSession = useCallback(() => {
    setIsLocked(false);
  }, []);

  const lockSession = useCallback(() => {
    if (!isLockActive) return;
    setIsLocked(true);
  }, [isLockActive]);

  const skipNextLock = useCallback(() => {
    skipNextLockRef.current = true;
    setIsLocked(false);
  }, []);

  useEffect(() => {
    if (!isLockActive) {
      setIsLocked(false);
      clearLockTimer(lockTimerRef);
      return;
    }

    let isMounted = true;

    async function applyInitialLock() {
      const shouldSkip = await consumeSkipAppLockOnce();
      if (!isMounted) return;

      if (shouldSkip || skipNextLockRef.current) {
        skipNextLockRef.current = false;
        setIsLocked(false);
        return;
      }

      setIsLocked(true);
    }

    void applyInitialLock();

    return () => {
      isMounted = false;
    };
  }, [isLockActive]);

  useEffect(() => {
    if (!isLockActive) return;

    const subscription = AppState.addEventListener('change', (nextState) => {
      const prevState = appStateRef.current;
      appStateRef.current = nextState;

      if (nextState === 'background') {
        backgroundedAtRef.current = Date.now();

        if (appLockDelaySeconds === 0) {
          lockSession();
          return;
        }

        clearLockTimer(lockTimerRef);
        lockTimerRef.current = setTimeout(() => {
          lockSession();
        }, appLockDelaySeconds * 1000);
        return;
      }

      if (prevState === 'background' && nextState === 'active') {
        clearLockTimer(lockTimerRef);

        if (appLockDelaySeconds === 0) {
          lockSession();
          backgroundedAtRef.current = null;
          return;
        }

        const awayMs = backgroundedAtRef.current
          ? Date.now() - backgroundedAtRef.current
          : 0;

        if (awayMs >= appLockDelaySeconds * 1000) {
          lockSession();
        }

        backgroundedAtRef.current = null;
      }
    });

    return () => {
      clearLockTimer(lockTimerRef);
      subscription.remove();
    };
  }, [isLockActive, appLockDelaySeconds, lockSession]);

  const tryBiometricUnlock = useCallback(async () => {
    if (appLockMethod !== 'biometric') return false;

    setIsCheckingBiometric(true);
    try {
      const capability = await getBiometricCapability();
      const success = await authenticateWithBiometric(`Desbloquea Kivo con ${capability.label}`);
      if (success) {
        unlockSession();
      }
      return success;
    } finally {
      setIsCheckingBiometric(false);
    }
  }, [appLockMethod, unlockSession]);

  const tryPinUnlock = useCallback(
    async (pin: string) => {
      const success = await verifyPin(pin);
      if (success) {
        unlockSession();
      }
      return success;
    },
    [unlockSession],
  );

  const value = useMemo(
    () => ({
      isLocked: isLockActive && isLocked,
      isCheckingBiometric,
      biometricLabel,
      biometricIcon,
      canUseBiometric: canUseBiometric || appLockMethod === 'biometric',
      canUsePin,
      unlockSession,
      lockSession,
      skipNextLock,
      tryBiometricUnlock,
      tryPinUnlock,
    }),
    [
      isLockActive,
      isLocked,
      isCheckingBiometric,
      biometricLabel,
      biometricIcon,
      canUseBiometric,
      appLockMethod,
      canUsePin,
      unlockSession,
      lockSession,
      skipNextLock,
      tryBiometricUnlock,
      tryPinUnlock,
    ],
  );

  return <AppLockContext.Provider value={value}>{children}</AppLockContext.Provider>;
}

export function useAppLock() {
  const context = useContext(AppLockContext);
  if (!context) {
    throw new Error('useAppLock must be used within AppLockProvider');
  }
  return context;
}
