import Ionicons from '@react-native-vector-icons/ionicons';
import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

const LINKS = [
  { id: 'memory', label: 'Memoria', icon: 'time-outline' as const, href: '/memory' },
  { id: 'agenda', label: 'Agenda', icon: 'calendar-outline' as const, href: '/agenda' },
  { id: 'finances', label: 'Finanzas', icon: 'wallet-outline' as const, href: '/finances' },
] as const;

export function SecondaryNavLinks() {
  const router = useRouter();

  return (
    <View className="flex-row gap-2">
      {LINKS.map((link) => (
        <Pressable
          key={link.id}
          accessibilityRole="button"
          onPress={() => router.push(link.href)}
          className="flex-1 flex-row items-center justify-center gap-1.5 rounded-2xl border border-border bg-surface py-3 active:opacity-85 dark:border-border-dark dark:bg-surface-dark">
          <Ionicons name={link.icon} size={16} color="#7C3AED" />
          <Text className="text-xs font-semibold text-foreground dark:text-foreground-dark">
            {link.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
