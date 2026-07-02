import Ionicons from '@react-native-vector-icons/ionicons';
import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

type ScreenHeaderProps = {
  title: string;
  subtitle?: string;
  showBack?: boolean;
};

export function ScreenHeader({ title, subtitle, showBack = true }: ScreenHeaderProps) {
  const router = useRouter();

  return (
    <View className="gap-1 border-b border-border px-6 py-3 dark:border-border-dark">
      <View className="flex-row items-center gap-2">
        {showBack ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Volver"
            onPress={() => router.back()}
            className="h-9 w-9 items-center justify-center rounded-full active:opacity-80">
            <Ionicons name="arrow-back" size={22} color="#7C3AED" />
          </Pressable>
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
