import Ionicons from '@react-native-vector-icons/ionicons';
import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import type { ScreenAccent } from '@/constants/screen-themes';

type ScreenHeaderProps = {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  accent?: ScreenAccent;
};

export function ScreenHeader({ title, subtitle, showBack = true, accent }: ScreenHeaderProps) {
  const router = useRouter();
  const accentColor = accent?.main ?? '#7C3AED';

  return (
    <View
      className="gap-1 border-b border-border px-6 py-3 dark:border-border-dark"
      style={accent ? { borderBottomColor: accent.border } : undefined}>
      <View className="flex-row items-center gap-2">
        {showBack ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Volver"
            onPress={() => router.back()}
            className="h-9 w-9 items-center justify-center rounded-full active:opacity-80">
            <Ionicons name="arrow-back" size={22} color={accentColor} />
          </Pressable>
        ) : null}
        {accent ? (
          <View
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: accentColor }}
          />
        ) : null}
        <Text className="flex-1 text-xl font-bold text-foreground dark:text-foreground-dark">
          {title}
        </Text>
      </View>
      {subtitle ? (
        <Text className={`text-sm text-subtle dark:text-subtle-dark ${showBack ? 'pl-11' : ''}`}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}
