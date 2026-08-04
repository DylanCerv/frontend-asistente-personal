import Ionicons from '@react-native-vector-icons/ionicons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import type { ComponentProps } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

import {
  APP_ACCENT,
  APP_BORDER,
  APP_SURFACE,
  APP_TEXT_DIM,
} from '@/constants/app-colors';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

type TabMeta = {
  label: string;
  icon: IoniconName;
  iconActive: IoniconName;
};

const TAB_META: Record<string, TabMeta> = {
  index: {
    label: 'Focus',
    icon: 'locate-outline',
    iconActive: 'locate',
  },
  assistant: {
    label: 'Asistente',
    icon: 'mic-outline',
    iconActive: 'mic',
  },
  tasks: {
    label: 'Tareas',
    icon: 'clipboard-outline',
    iconActive: 'clipboard',
  },
  profile: {
    label: 'Perfil',
    icon: 'person-outline',
    iconActive: 'person',
  },
};

/** Hidden routes that should keep a visible parent tab illuminated. */
const ROUTE_TO_TAB: Record<string, string> = {
  agenda: 'tasks',
  memory: 'tasks',
  finances: 'tasks',
  report: 'tasks',
};

const VISIBLE_TABS = new Set(Object.keys(TAB_META));
const GLOW_SIZE = 36;

function resolveActiveTabName(routeName: string): string {
  return ROUTE_TO_TAB[routeName] ?? routeName;
}

function TabActiveGlow({ glowId }: { glowId: string }) {
  return (
    <Svg
      width={GLOW_SIZE}
      height={GLOW_SIZE}
      style={{ position: 'absolute' }}
      pointerEvents="none">
      <Defs>
        <RadialGradient id={glowId} cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor={APP_ACCENT} stopOpacity={0.5} />
          <Stop offset="40%" stopColor={APP_ACCENT} stopOpacity={0.22} />
          <Stop offset="72%" stopColor={APP_ACCENT} stopOpacity={0.08} />
          <Stop offset="100%" stopColor={APP_ACCENT} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Circle cx={GLOW_SIZE / 2} cy={GLOW_SIZE / 2} r={GLOW_SIZE / 2} fill={`url(#${glowId})`} />
    </Svg>
  );
}

export function MainTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const activeRouteName = state.routes[state.index]?.name ?? '';
  const activeTabName = resolveActiveTabName(activeRouteName);

  return (
    <View
      style={{
        backgroundColor: APP_SURFACE,
        borderTopColor: APP_BORDER,
        borderTopWidth: 1,
        paddingBottom: Math.max(insets.bottom, 6),
        paddingTop: 4,
      }}>
      <View className="flex-row items-center justify-around px-2">
        {state.routes.map((route) => {
          if (!VISIBLE_TABS.has(route.name)) return null;

          const meta = TAB_META[route.name];
          if (!meta) return null;

          const focused = activeTabName === route.name;
          const { options } = descriptors[route.key];
          const color = focused ? APP_ACCENT : APP_TEXT_DIM;

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={focused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel ?? meta.label}
              onPress={() => {
                const event = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });
                if (!focused && !event.defaultPrevented) {
                  navigation.navigate(route.name, route.params);
                }
              }}
              className="min-w-[64px] items-center gap-0.5 active:opacity-80">
              <View
                style={{
                  height: GLOW_SIZE,
                  width: GLOW_SIZE,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                {focused ? <TabActiveGlow glowId={`tab-glow-${route.name}`} /> : null}
                <Ionicons
                  name={focused ? meta.iconActive : meta.icon}
                  size={20}
                  color={color}
                />
              </View>
              <Text
                className="text-[10px]"
                style={{ color, fontWeight: focused ? '700' : '500' }}>
                {meta.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
