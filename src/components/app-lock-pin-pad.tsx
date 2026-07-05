import Ionicons from '@react-native-vector-icons/ionicons';
import { Pressable, Text, View } from 'react-native';

type PinPadProps = {
  value: string;
  maxLength?: number;
  onChange: (next: string) => void;
  disabled?: boolean;
  size?: 'default' | 'large';
};

const ROWS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['empty', '0', 'back'],
] as const;

export function PinPad({
  value,
  maxLength = 4,
  onChange,
  disabled,
  size = 'default',
}: PinPadProps) {
  const isLarge = size === 'large';

  function handleKey(key: string) {
    if (disabled) return;
    if (key === 'back') {
      onChange(value.slice(0, -1));
      return;
    }
    if (key === 'empty' || value.length >= maxLength) return;
    onChange(`${value}${key}`);
  }

  return (
    <View className={`w-full ${isLarge ? 'max-w-[340px]' : 'max-w-sm'} gap-5 self-center`}>
      <View className={`flex-row items-center justify-center ${isLarge ? 'gap-5' : 'gap-3'}`}>
        {Array.from({ length: maxLength }).map((_, index) => (
          <View
            key={index}
            className={`rounded-full ${
              isLarge ? 'h-4 w-4' : 'h-3 w-3'
            } ${
              index < value.length ? 'bg-brand dark:bg-brand-dark' : 'bg-border dark:bg-border-dark'
            }`}
          />
        ))}
      </View>

      <View className="gap-3">
        {ROWS.map((row, rowIndex) => (
          <View key={`row-${rowIndex}`} className="flex-row justify-center gap-3">
            {row.map((key) => {
              if (key === 'empty') {
                return (
                  <View
                    key={`empty-${rowIndex}`}
                    className={isLarge ? 'h-[76px] flex-1 max-w-[104px]' : 'h-16 w-[30%] max-w-[88px]'}
                  />
                );
              }

              return (
                <Pressable
                  key={`${key}-${rowIndex}`}
                  accessibilityRole="button"
                  accessibilityLabel={key === 'back' ? 'Borrar' : key}
                  disabled={disabled}
                  onPress={() => handleKey(key)}
                  className={`items-center justify-center rounded-3xl border border-border/70 bg-surface active:opacity-80 dark:border-border-dark/70 dark:bg-surface-dark ${
                    isLarge ? 'h-[76px] flex-1 max-w-[104px]' : 'h-16 w-[30%] max-w-[88px]'
                  }`}>
                  {key === 'back' ? (
                    <Ionicons name="backspace-outline" size={isLarge ? 28 : 24} color="#6B6475" />
                  ) : (
                    <Text
                      className={`font-semibold text-foreground dark:text-foreground-dark ${
                        isLarge ? 'text-4xl' : 'text-2xl'
                      }`}>
                      {key}
                    </Text>
                  )}
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}
