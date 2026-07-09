import Ionicons from '@react-native-vector-icons/ionicons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { AppLockPinRecovery } from '@/components/app-lock-pin-recovery';
import { PinPad } from '@/components/app-lock-pin-pad';
import { KivoLogo } from '@/components/kivo-logo';
import { ScreenSafeArea } from '@/components/screen-safe-area';
import { useAuth } from '@/context/auth-context';
import { useAppLock } from '@/context/app-lock-context';
import { useUserPreferences } from '@/context/user-preferences-context';
import { startPinRecoverySession } from '@/services/app-lock/pin-recovery';

type PinUnlockMode = 'enter' | 'recovery';

export function AppLockScreen() {
  const { biometricLabel, biometricIcon, isCheckingBiometric, tryBiometricUnlock, tryPinUnlock } =
    useAppLock();
  const { appLockMethod } = useUserPreferences();

  useEffect(() => {
    if (appLockMethod === 'biometric') {
      void tryBiometricUnlock();
    }
  }, [appLockMethod, tryBiometricUnlock]);

  if (appLockMethod === 'pin') {
    return <PinUnlockView onUnlock={tryPinUnlock} />;
  }

  return (
    <ScreenSafeArea className="absolute inset-0 z-50 bg-canvas dark:bg-canvas-dark">
      <View className="flex-1 items-center justify-center gap-8 px-6">
        <View className="items-center gap-3">
          <View className="rounded-[26px] bg-surface p-2 shadow-sm dark:bg-surface-dark">
            <KivoLogo size={64} />
          </View>
          <Text className="text-2xl font-bold text-foreground dark:text-foreground-dark">
            Kivo está protegido
          </Text>
          <Text className="text-center text-sm text-subtle dark:text-subtle-dark">
            Usa {biometricLabel} para continuar
          </Text>
        </View>

        {isCheckingBiometric ? (
          <ActivityIndicator size="large" color="#7C3AED" />
        ) : (
          <Pressable
            accessibilityRole="button"
            onPress={() => void tryBiometricUnlock()}
            className="min-h-[52px] min-w-[220px] flex-row items-center justify-center gap-2 rounded-2xl bg-brand px-6 active:opacity-85 dark:bg-brand-dark">
            <Ionicons name={biometricIcon} size={20} color="#FFFFFF" />
            <Text className="text-base font-semibold text-white">
              Desbloquear con {biometricLabel}
            </Text>
          </Pressable>
        )}
      </View>
    </ScreenSafeArea>
  );
}

function PinUnlockView({
  onUnlock,
}: {
  onUnlock: (pin: string) => Promise<boolean>;
}) {
  const { user } = useAuth();
  const [mode, setMode] = useState<PinUnlockMode>('enter');
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [recoveryToken, setRecoveryToken] = useState<string | null>(null);
  const [isStartingRecovery, setIsStartingRecovery] = useState(false);

  async function handlePinChange(next: string) {
    setPin(next);
    setError(null);
    if (next.length < 4) return;

    const success = await onUnlock(next);
    if (!success) {
      setError('PIN incorrecto');
      setPin('');
    }
  }

  async function handleForgotPin() {
    if (!user?.id) return;

    setIsStartingRecovery(true);
    setError(null);

    try {
      const token = await startPinRecoverySession(user.id);
      setRecoveryToken(token);
      setMode('recovery');
    } catch {
      setError('No se pudo iniciar la recuperación. Intenta de nuevo.');
    } finally {
      setIsStartingRecovery(false);
    }
  }

  function handleBackToEnter() {
    setMode('enter');
    setRecoveryToken(null);
    setPin('');
    setError(null);
  }

  return (
    <ScreenSafeArea className="absolute inset-0 z-50 bg-canvas dark:bg-canvas-dark">
      <View className="flex-1 justify-between px-6 pb-10 pt-8">
        <View className="items-center gap-3">
          <View className="rounded-[26px] bg-surface p-2 shadow-sm dark:bg-surface-dark">
            <KivoLogo size={56} />
          </View>
          <Text className="text-2xl font-bold text-foreground dark:text-foreground-dark">
            {mode === 'enter' ? 'Ingresa tu PIN' : 'Restablecer PIN'}
          </Text>
          <Text className="max-w-xs text-center text-sm text-subtle dark:text-subtle-dark">
            {mode === 'enter'
              ? 'Usa tu código de 4 dígitos para abrir Kivo.'
              : 'Verifica tu cuenta y crea un PIN nuevo.'}
          </Text>
        </View>

        <View className="flex-1 justify-center py-6">
          {mode === 'enter' ? (
            <View className="gap-5">
              <PinPad size="large" value={pin} onChange={handlePinChange} />
              {error ? (
                <Text className="text-center text-sm text-danger dark:text-danger-dark">{error}</Text>
              ) : null}
            </View>
          ) : recoveryToken ? (
            <AppLockPinRecovery
              recoveryToken={recoveryToken}
              onBack={handleBackToEnter}
              onComplete={handleBackToEnter}
            />
          ) : null}
        </View>

        {mode === 'enter' ? (
          <Pressable
            accessibilityRole="button"
            onPress={handleForgotPin}
            disabled={isStartingRecovery}
            className="items-center py-3 active:opacity-70">
            <Text className="text-sm font-semibold text-brand dark:text-brand-dark">
              {isStartingRecovery ? 'Preparando recuperación...' : '¿Olvidaste tu PIN?'}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </ScreenSafeArea>
  );
}
