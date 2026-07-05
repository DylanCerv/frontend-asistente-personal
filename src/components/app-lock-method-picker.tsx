import Ionicons from '@react-native-vector-icons/ionicons';
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import type { AppLockMethod } from '@/context/user-preferences-context';
import {
  getBiometricCapability,
  type BiometricCapability,
} from '@/services/app-lock/biometric';

type AppLockMethodPickerProps = {
  value: AppLockMethod;
  onChange: (method: AppLockMethod) => void;
  includeNone?: boolean;
};

type LockOption = {
  id: AppLockMethod;
  title: string;
  hint?: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  disabled?: boolean;
};

export function AppLockMethodPicker({
  value,
  onChange,
  includeNone = true,
}: AppLockMethodPickerProps) {
  const [capability, setCapability] = useState<BiometricCapability | null>(null);

  useEffect(() => {
    void getBiometricCapability().then(setCapability);
  }, []);

  const biometricLabel = capability?.label ?? 'Biometría';
  const biometricIcon =
    biometricLabel === 'Face ID' ? ('scan-outline' as const) : ('finger-print-outline' as const);

  const options: LockOption[] = [];

  if (includeNone) {
    options.push({
      id: 'none',
      title: 'Sin bloqueo',
      icon: 'lock-open-outline',
    });
  }

  options.push({
    id: 'biometric',
    title: biometricLabel,
    hint:
      capability?.isAvailable
        ? undefined
        : capability?.hasHardware && !capability.isEnrolled
          ? 'No configurado'
          : 'No disponible',
    icon: biometricIcon,
    disabled: !capability?.isAvailable,
  });

  options.push({
    id: 'pin',
    title: 'PIN',
    icon: 'keypad-outline',
  });

  return (
    <View className="w-full gap-2">
      <Text className="text-sm font-semibold text-foreground dark:text-foreground-dark">
        Método de desbloqueo
      </Text>
      <View className="w-full overflow-hidden rounded-2xl bg-muted dark:bg-muted-dark">
        {options.map((option, index) => {
          const isSelected = value === option.id;
          const isDisabled = option.disabled === true;

          return (
            <Pressable
              key={option.id}
              accessibilityRole="radio"
              accessibilityState={{ selected: isSelected, disabled: isDisabled }}
              disabled={isDisabled}
              onPress={() => onChange(option.id)}
              className={`w-full flex-row items-center gap-3 px-4 py-3.5 active:opacity-80 ${
                isSelected ? 'bg-surface-soft dark:bg-surface-soft-dark' : 'bg-surface dark:bg-surface-dark'
              } ${isDisabled ? 'opacity-50' : ''} ${
                index > 0 ? 'border-t border-border/60 dark:border-border-dark/60' : ''
              }`}>
              <Ionicons
                name={option.icon}
                size={18}
                color={isSelected ? '#7C3AED' : '#6B6475'}
              />
              <Text
                className={`flex-1 text-[15px] font-medium ${
                  isSelected
                    ? 'text-brand dark:text-brand-dark'
                    : 'text-foreground dark:text-foreground-dark'
                }`}>
                {option.title}
              </Text>
              {option.hint ? (
                <Text className="text-xs text-subtle dark:text-subtle-dark">{option.hint}</Text>
              ) : null}
              <Ionicons
                name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
                size={18}
                color={isSelected ? '#7C3AED' : '#6B6475'}
              />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function getAppLockMethodLabel(
  method: AppLockMethod,
  capability?: BiometricCapability | null,
): string {
  if (method === 'pin') return 'PIN';
  if (method === 'biometric') return capability?.label ?? 'Biometría';
  return 'Sin bloqueo';
}
