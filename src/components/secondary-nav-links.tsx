import Ionicons from '@react-native-vector-icons/ionicons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, Text } from 'react-native';

const LINKS = [
  { id: 'agenda', label: 'Agenda', icon: 'calendar-outline' as const, href: '/agenda' },
  { id: 'finances', label: 'Finanzas', icon: 'wallet-outline' as const, href: '/finances' },
  { id: 'report', label: 'Reporte', icon: 'stats-chart-outline' as const, href: '/report' },
] as const;

export function SecondaryNavLinks() {
  const router = useRouter();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerClassName="gap-2">
      {LINKS.map((link) => (
        <Pressable
          key={link.id}
          accessibilityRole="button"
          accessibilityLabel={link.label}
          onPress={() => router.push(link.href)}
          className="flex-row items-center gap-1.5 rounded-2xl border border-border bg-surface px-4 py-3 active:opacity-85 dark:border-border-dark dark:bg-surface-dark">
          <Ionicons name={link.icon} size={16} color="#7C3AED" />
          <Text className="text-xs font-semibold text-foreground dark:text-foreground-dark">
            {link.label}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}
