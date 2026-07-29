import Ionicons from '@react-native-vector-icons/ionicons';
import type { ComponentProps } from 'react';
import { Pressable, Text, View } from 'react-native';

import type { InsightItem, InsightType } from '@/types/insight';

type InsightIconName = ComponentProps<typeof Ionicons>['name'];

const INSIGHT_ICONS: Record<InsightType, InsightIconName> = {
  urgent_tasks: 'flame-outline',
  upcoming_meeting: 'calendar-outline',
  reminder: 'notifications-outline',
  due_today: 'today-outline',
  spending_alert: 'wallet-outline',
  free_time: 'sunny-outline',
  positive: 'sparkles-outline',
};

const INSIGHT_ACCENT: Record<InsightType, string> = {
  urgent_tasks: 'border-danger/30 bg-danger/5',
  upcoming_meeting: 'border-brand/30 bg-surface-soft',
  reminder: 'border-brand/20 bg-surface-soft',
  due_today: 'border-brand/30 bg-surface-soft',
  spending_alert: 'border-brand/30 bg-surface-soft',
  free_time: 'border-brand/20 bg-surface-soft',
  positive: 'border-brand/20 bg-surface-soft',
};

type InsightCardProps = {
  insight: InsightItem;
  onPress?: (insight: InsightItem) => void;
};

export function InsightCard({ insight, onPress }: InsightCardProps) {
  const icon = INSIGHT_ICONS[insight.type];
  const accent = INSIGHT_ACCENT[insight.type];

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => onPress?.(insight)}
      disabled={!onPress}
      className={`flex-row items-start gap-3 rounded-2xl border p-4 active:opacity-85 dark:bg-surface-soft-dark ${accent}`}>
      <View className="h-10 w-10 items-center justify-center rounded-xl bg-surface dark:bg-surface-dark">
        <Ionicons name={icon} size={20} color="#C4B5FD" />
      </View>
      <View className="flex-1 gap-0.5">
        <Text className="text-[15px] font-semibold leading-5 text-foreground dark:text-foreground-dark">
          {insight.title}
        </Text>
        {insight.subtitle ? (
          <Text className="text-sm text-subtle dark:text-subtle-dark">{insight.subtitle}</Text>
        ) : null}
      </View>
      {onPress ? <Ionicons name="chevron-forward" size={18} color="#8A8A8A" /> : null}
    </Pressable>
  );
}
