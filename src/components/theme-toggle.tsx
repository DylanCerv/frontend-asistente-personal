import Ionicons from '@react-native-vector-icons/ionicons';
import { Pressable, Text, View } from 'react-native';

import { useThemePreference, type ThemeMode } from '@/context/theme-preference-context';

type ThemeToggleProps = {
  compact?: boolean;
  variant?: 'segmented' | 'cards';
};

export function ThemeToggle({ compact = false, variant = 'segmented' }: ThemeToggleProps) {
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

  if (variant === 'cards') {
    return (
      <View className="flex-row gap-3">
        <ThemeCard
          label="Claro"
          description="Fondo suave y limpio"
          icon="sunny-outline"
          value="light"
          active={mode === 'light'}
          onSelect={setMode}
        />
        <ThemeCard
          label="Oscuro"
          description="Menos brillo, más descanso"
          icon="moon-outline"
          value="dark"
          active={mode === 'dark'}
          onSelect={setMode}
        />
      </View>
    );
  }

  return (
    <View className="flex-row gap-1 rounded-xl bg-surface p-1 dark:bg-surface-dark">
      <ThemeOption label="Claro" value="light" active={mode === 'light'} onSelect={setMode} />
      <ThemeOption label="Oscuro" value="dark" active={mode === 'dark'} onSelect={setMode} />
    </View>
  );
}

function ThemeCard({
  label,
  description,
  icon,
  value,
  active,
  onSelect,
}: {
  label: string;
  description: string;
  icon: 'sunny-outline' | 'moon-outline';
  value: ThemeMode;
  active: boolean;
  onSelect: (mode: ThemeMode) => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => onSelect(value)}
      className={`flex-1 gap-3 rounded-[24px] border p-4 active:opacity-90 ${
        active
          ? 'border-brand bg-muted dark:border-brand-dark dark:bg-muted-dark'
          : 'border-border bg-canvas dark:border-border-dark dark:bg-canvas-dark'
      }`}>
      <View
        className={`h-11 w-11 items-center justify-center rounded-2xl ${
          active ? 'bg-brand dark:bg-brand-dark' : 'bg-surface-soft dark:bg-surface-soft-dark'
        }`}>
        <Ionicons name={icon} size={22} color={active ? '#FFFFFF' : '#7C3AED'} />
      </View>
      <View className="gap-1">
        <Text
          className={`text-base font-semibold ${
            active ? 'text-foreground dark:text-foreground-dark' : 'text-subtle dark:text-subtle-dark'
          }`}>
          {label}
        </Text>
        <Text className="text-xs leading-4 text-subtle dark:text-subtle-dark">{description}</Text>
      </View>
    </Pressable>
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
