import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { PinPad } from '@/components/app-lock-pin-pad';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/text-input';
import { useAuth } from '@/context/auth-context';
import { useAppLock } from '@/context/app-lock-context';
import { loginRequest } from '@/services/auth/auth-api';
import {
  clearPinRecoverySession,
  isPinRecoverySessionValid,
} from '@/services/app-lock/pin-recovery';
import { savePin } from '@/services/app-lock/pin-store';

type PinRecoveryPhase = 'verify' | 'reset';

type AppLockPinRecoveryProps = {
  recoveryToken: string;
  onBack: () => void;
  onComplete: () => void;
};

export function AppLockPinRecovery({
  recoveryToken,
  onBack,
  onComplete,
}: AppLockPinRecoveryProps) {
  const { user } = useAuth();
  const { unlockSession } = useAppLock();
  const [phase, setPhase] = useState<PinRecoveryPhase>('verify');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [step, setStep] = useState<'create' | 'confirm'>('create');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  async function handleVerifyPassword() {
    if (!user?.email) return;
    if (!password.trim()) {
      setError('Ingresa tu contraseña de Kivo.');
      return;
    }

    setIsVerifying(true);
    setError(null);

    try {
      const sessionValid = await isPinRecoverySessionValid(user.id, recoveryToken);
      if (!sessionValid) {
        setError('La sesión de recuperación expiró. Intenta de nuevo.');
        return;
      }

      await loginRequest(user.email, password.trim());

      setPhase('reset');
      setStep('create');
      setPin('');
      setConfirmPin('');
    } catch {
      setError('Contraseña incorrecta. Verifica e intenta otra vez.');
    } finally {
      setIsVerifying(false);
    }
  }

  async function handleCreatePin(next: string) {
    setPin(next);
    if (next.length === 4) {
      setStep('confirm');
      setConfirmPin('');
      setError(null);
    }
  }

  async function handleConfirmPin(next: string) {
    setConfirmPin(next);
    if (next.length < 4) return;

    if (next !== pin) {
      setError('Los PIN no coinciden. Empieza de nuevo.');
      setStep('create');
      setPin('');
      setConfirmPin('');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await savePin(next);
      await clearPinRecoverySession();
      unlockSession();
      onComplete();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'No se pudo guardar el PIN.');
      setStep('create');
      setPin('');
      setConfirmPin('');
    } finally {
      setIsSaving(false);
    }
  }

  if (phase === 'verify') {
    return (
      <View className="w-full max-w-md gap-6 self-center">
        <View className="gap-2">
          <Text className="text-center text-xl font-bold text-foreground dark:text-foreground-dark">
            Recuperar PIN
          </Text>
          <Text className="text-center text-sm leading-6 text-subtle dark:text-subtle-dark">
            Confirma que eres tú con la contraseña de tu cuenta{' '}
            <Text className="font-semibold text-foreground dark:text-foreground-dark">
              {user?.email}
            </Text>
            . Luego podrás crear un PIN nuevo.
          </Text>
        </View>

        <Input
          label="Contraseña de tu cuenta"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          placeholder="Tu contraseña"
        />

        {error ? (
          <Text className="text-center text-sm text-danger dark:text-danger-dark">{error}</Text>
        ) : null}

        <View className="gap-3">
          <Button
            label={isVerifying ? 'Verificando...' : 'Continuar'}
            onPress={handleVerifyPassword}
            loading={isVerifying}
            disabled={isVerifying}
          />
          <Pressable accessibilityRole="button" onPress={onBack} className="items-center py-2">
            <Text className="text-sm font-medium text-brand dark:text-brand-dark">Volver al PIN</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View className="w-full max-w-md gap-6 self-center">
      <View className="gap-2">
        <Text className="text-center text-xl font-bold text-foreground dark:text-foreground-dark">
          {step === 'create' ? 'Nuevo PIN' : 'Confirma tu PIN'}
        </Text>
        <Text className="text-center text-sm text-subtle dark:text-subtle-dark">
          {step === 'create'
            ? 'Elige 4 dígitos para tu nuevo PIN.'
            : 'Ingresa otra vez el mismo PIN.'}
        </Text>
      </View>

      <PinPad
        size="large"
        value={step === 'create' ? pin : confirmPin}
        onChange={step === 'create' ? handleCreatePin : handleConfirmPin}
        disabled={isSaving}
      />

      {error ? (
        <Text className="text-center text-sm text-danger dark:text-danger-dark">{error}</Text>
      ) : null}

      <Pressable
        accessibilityRole="button"
        onPress={onBack}
        disabled={isSaving}
        className="items-center py-2">
        <Text className="text-sm font-medium text-brand dark:text-brand-dark">Cancelar</Text>
      </Pressable>
    </View>
  );
}
