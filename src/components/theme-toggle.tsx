import { Pressable, Text, View } from 'react-native';

import { useThemePreference, type ThemeMode } from '@/context/theme-preference-context';

type ThemeToggleProps = {
  compact?: boolean;
};

export function ThemeToggle({ compact = false }: ThemeToggleProps) {
  const { mode, setMode } = useThemePreference();
  const isDark = mode === 'dark';

  if (compact) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        onPress={() => setMode(isDark ? 'light' : 'dark')}
        className={`h-11 w-11 items-center justify-center rounded-full border ${
          isDark
            ? 'border-border-dark bg-surface-dark'
            : 'border-border bg-white'
        } active:opacity-70`}>
        <Text className="text-xl">{isDark ? '☀️' : '🌙'}</Text>
      </Pressable>
    );
  }

  return (
    <View
      className={`flex-row gap-1 rounded-2xl border p-1 ${
        isDark ? 'border-border-dark bg-surface-dark' : 'border-border bg-white'
      }`}>
      <ThemeOption
        label="Claro"
        value="light"
        active={mode === 'light'}
        isDark={isDark}
        onSelect={setMode}
      />
      <ThemeOption
        label="Oscuro"
        value="dark"
        active={mode === 'dark'}
        isDark={isDark}
        onSelect={setMode}
      />
    </View>
  );
}

function ThemeOption({
  label,
  value,
  active,
  isDark,
  onSelect,
}: {
  label: string;
  value: ThemeMode;
  active: boolean;
  isDark: boolean;
  onSelect: (mode: ThemeMode) => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={() => onSelect(value)}
      className={`flex-1 items-center rounded-xl py-2.5 ${
        active
          ? isDark
            ? 'bg-canvas-dark'
            : 'bg-canvas shadow-sm'
          : ''
      }`}>
      <Text
        className={`text-sm ${
          active
            ? isDark
              ? 'font-semibold text-foreground-dark'
              : 'font-semibold text-foreground'
            : isDark
              ? 'font-medium text-subtle-dark'
              : 'font-medium text-subtle'
        }`}>
        {label}
      </Text>
    </Pressable>
  );
}
