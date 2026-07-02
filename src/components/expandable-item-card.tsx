import Ionicons from '@react-native-vector-icons/ionicons';
import { useState, type ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

type ExpandableItemCardProps = {
  children: ReactNode;
  expandedContent: ReactNode;
  defaultExpanded?: boolean;
};

export function ExpandableItemCard({
  children,
  expandedContent,
  defaultExpanded = false,
}: ExpandableItemCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <View className="overflow-hidden rounded-[24px] border border-border bg-surface dark:border-border-dark dark:bg-surface-dark">
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        onPress={() => setExpanded((prev) => !prev)}
        className="active:opacity-90">
        <View className="flex-row items-center gap-2 p-4 pr-3">
          <View className="flex-1">{children}</View>
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color="#6B6475"
          />
        </View>
      </Pressable>

      {expanded ? (
        <View className="gap-3 border-t border-border px-4 pb-4 pt-3 dark:border-border-dark">
          {expandedContent}
        </View>
      ) : null}
    </View>
  );
}

type DetailRowProps = {
  label: string;
  value: string;
  icon?:
    | 'document-text-outline'
    | 'calendar-outline'
    | 'folder-outline'
    | 'flag-outline'
    | 'checkbox-outline'
    | 'time-outline'
    | 'stopwatch-outline'
    | 'pricetag-outline'
    | 'bookmark-outline'
    | 'location-outline';
};

export function DetailRow({ label, value, icon }: DetailRowProps) {
  return (
    <View className="flex-row items-start gap-3">
      {icon ? (
        <Ionicons name={icon} size={16} color="#7C3AED" style={{ marginTop: 2 }} />
      ) : null}
      <View className="flex-1 gap-0.5">
        <Text className="text-xs text-subtle dark:text-subtle-dark">{label}</Text>
        <Text className="text-sm text-foreground dark:text-foreground-dark">{value}</Text>
      </View>
    </View>
  );
}
