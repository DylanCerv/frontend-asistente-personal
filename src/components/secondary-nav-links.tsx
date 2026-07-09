import Ionicons from '@react-native-vector-icons/ionicons';
import { type Href, useRouter } from 'expo-router';
import { Pressable, ScrollView, Text } from 'react-native';

import { useScreenAccent } from '@/constants/screen-themes';

const LINKS = [
  { id: 'agenda' as const, label: 'Agenda', icon: 'calendar-outline' as const, href: '/agenda' },
  { id: 'finances' as const, label: 'Finanzas', icon: 'wallet-outline' as const, href: '/finances' },
  { id: 'report' as const, label: 'Reporte', icon: 'stats-chart-outline' as const, href: '/report' },
];

function NavLink({
  label,
  icon,
  href,
  themeId,
}: {
  label: string;
  icon: (typeof LINKS)[number]['icon'];
  href: string;
  themeId: (typeof LINKS)[number]['id'];
}) {
  const router = useRouter();
  const accent = useScreenAccent(themeId);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() => router.push(href as Href)}
      className="flex-row items-center gap-1.5 rounded-2xl border px-4 py-3 active:opacity-85"
      style={{ borderColor: accent.border, backgroundColor: accent.soft }}>
      <Ionicons name={icon} size={16} color={accent.main} />
      <Text className="text-xs font-semibold" style={{ color: accent.main }}>
        {label}
      </Text>
    </Pressable>
  );
}

export function SecondaryNavLinks() {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
      {LINKS.map((link) => (
        <NavLink
          key={link.id}
          label={link.label}
          icon={link.icon}
          href={link.href}
          themeId={link.id}
        />
      ))}
    </ScrollView>
  );
}
