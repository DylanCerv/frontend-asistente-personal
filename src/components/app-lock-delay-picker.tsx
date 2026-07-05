import { Pressable, Text, View } from 'react-native';

import {
  APP_LOCK_DELAY_OPTIONS,
  getAppLockDelayDescription,
  getAppLockDelayShortLabel,
  type AppLockDelaySeconds,
} from '@/services/app-lock/lock-delay';

type AppLockDelayPickerProps = {
  value: AppLockDelaySeconds;
  onChange: (value: AppLockDelaySeconds) => void;
};

export function AppLockDelayPicker({ value, onChange }: AppLockDelayPickerProps) {
  return (
    <View className="w-full gap-2">
      <Text className="text-sm font-semibold text-foreground dark:text-foreground-dark">
        Cuándo bloquear
      </Text>
      <View className="w-full flex-row flex-wrap gap-2">
        {APP_LOCK_DELAY_OPTIONS.map((option) => {
          const isSelected = value === option;

          return (
            <Pressable
              key={option}
              accessibilityRole="radio"
              accessibilityState={{ selected: isSelected }}
              onPress={() => onChange(option)}
              className={`min-w-[18%] flex-1 rounded-2xl border px-3 py-3 active:opacity-80 ${
                isSelected
                  ? 'border-brand bg-surface-soft dark:border-brand-dark dark:bg-surface-soft-dark'
                  : 'border-border bg-surface dark:border-border-dark dark:bg-surface-dark'
              }`}>
              <Text
                className={`text-center text-sm font-semibold ${
                  isSelected
                    ? 'text-brand dark:text-brand-dark'
                    : 'text-foreground dark:text-foreground-dark'
                }`}>
                {getAppLockDelayShortLabel(option)}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Text className="text-sm leading-5 text-subtle dark:text-subtle-dark">
        {getAppLockDelayDescription(value)}
      </Text>
    </View>
  );
}
