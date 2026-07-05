import { useState } from 'react';
import { Modal, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PinPad } from '@/components/app-lock-pin-pad';
import { Button } from '@/components/ui/button';
import { savePin } from '@/services/app-lock/pin-store';

type AppLockPinSetupProps = {
  visible: boolean;
  title?: string;
  onComplete: () => void;
  onCancel: () => void;
};

export function AppLockPinSetup({
  visible,
  title = 'Crea tu PIN',
  onComplete,
  onCancel,
}: AppLockPinSetupProps) {
  const [step, setStep] = useState<'create' | 'confirm'>('create');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  function reset() {
    setStep('create');
    setPin('');
    setConfirmPin('');
    setError(null);
    setIsSaving(false);
  }

  function handleCancel() {
    reset();
    onCancel();
  }

  async function handleCreateComplete(next: string) {
    setPin(next);
    if (next.length === 4) {
      setStep('confirm');
      setConfirmPin('');
      setError(null);
    }
  }

  async function handleConfirmComplete(next: string) {
    setConfirmPin(next);
    if (next.length < 4) return;

    if (next !== pin) {
      setError('Los PIN no coinciden. Intenta de nuevo.');
      setStep('create');
      setPin('');
      setConfirmPin('');
      return;
    }

    setIsSaving(true);
    try {
      await savePin(next);
      reset();
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

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleCancel}>
      <SafeAreaView className="flex-1 bg-canvas dark:bg-canvas-dark">
        <View className="flex-1 justify-center gap-8 px-6">
          <View className="items-center gap-2">
            <Text className="text-2xl font-bold text-foreground dark:text-foreground-dark">{title}</Text>
            <Text className="text-center text-sm text-subtle dark:text-subtle-dark">
              {step === 'create'
                ? 'Elige 4 dígitos para proteger Kivo en este dispositivo.'
                : 'Confirma tu PIN.'}
            </Text>
          </View>

          <PinPad
            size="large"
            value={step === 'create' ? pin : confirmPin}
            onChange={step === 'create' ? handleCreateComplete : handleConfirmComplete}
            disabled={isSaving}
          />

          {error ? (
            <Text className="text-center text-sm text-danger dark:text-danger-dark">{error}</Text>
          ) : null}

          <Button label="Cancelar" variant="secondary" onPress={handleCancel} disabled={isSaving} />
        </View>
      </SafeAreaView>
    </Modal>
  );
}
