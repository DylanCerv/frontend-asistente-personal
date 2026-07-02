import Ionicons from '@react-native-vector-icons/ionicons';
import { Pressable, Text, View } from 'react-native';

import { useThemePreference, type ThemeMode } from '@/context/theme-preference-context';

type ThemeToggleProps = {
  compact?: boolean;
};

export function ThemeToggle({ compact = false }: ThemeToggleProps) {
  const { mode, setMode } = useThemePreference();

  if (compact) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Cambiar tema"
        onPress={() => setMode(mode === 'light' ? 'dark' : 'light')}
        className="h-11 w-11 items-center justify-center rounded-full bg-surface dark:bg-surface-dark">
        <Ionicons
          name={mode === 'light' ? 'moon-outline' : 'sunny-outline'}
          size={20}
          color={mode === 'light' ? '#7C3AED' : '#A78BFA'}
        />
      </Pressable>
    );
  }

  return (
    <View className="flex-row gap-1 rounded-xl bg-surface p-1 dark:bg-surface-dark">
      <ThemeOption label="Claro" value="light" active={mode === 'light'} onSelect={setMode} />
      <ThemeOption label="Oscuro" value="dark" active={mode === 'dark'} onSelect={setMode} />
    </View>
  );
}

function ThemeOption({
  label,
  value,
  active,
  onSelect,
}: {
  label: string;
  value: ThemeMode;
  active: boolean;
  onSelect: (mode: ThemeMode) => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => onSelect(value)}
      className={`flex-1 items-center rounded-lg py-2.5 ${active ? 'bg-canvas dark:bg-canvas-dark' : ''}`}>
      <Text
        className={`text-sm ${active ? 'font-semibold text-foreground dark:text-foreground-dark' : 'font-medium text-subtle dark:text-subtle-dark'}`}>
        {label}
      </Text>
    </Pressable>
  );
}
