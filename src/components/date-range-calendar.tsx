import Ionicons from '@react-native-vector-icons/ionicons';
import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import type { DateRange } from '@/types/assistant';
import {
  MONTH_LABELS,
  WEEKDAY_LABELS,
  daysAgoIso,
  formatShortDate,
  getCalendarDays,
  isDateInRange,
  isToday,
  normalizeRange,
  parseIsoDate,
  todayIso,
} from '@/utils/date-utils';

type DateRangeCalendarProps = {
  range: DateRange;
  onChange: (range: DateRange) => void;
};

export function DateRangeCalendar({ range, onChange }: DateRangeCalendarProps) {
  const initial = parseIsoDate(range.start);
  const [visibleYear, setVisibleYear] = useState(initial.getFullYear());
  const [visibleMonth, setVisibleMonth] = useState(initial.getMonth());
  const [selectingEnd, setSelectingEnd] = useState(false);

  const days = useMemo(
    () => getCalendarDays(visibleYear, visibleMonth),
    [visibleYear, visibleMonth],
  );

  function goToPreviousMonth() {
    if (visibleMonth === 0) {
      setVisibleMonth(11);
      setVisibleYear((year) => year - 1);
      return;
    }
    setVisibleMonth((month) => month - 1);
  }

  function goToNextMonth() {
    if (visibleMonth === 11) {
      setVisibleMonth(0);
      setVisibleYear((year) => year + 1);
      return;
    }
    setVisibleMonth((month) => month + 1);
  }

  function handleDayPress(iso: string) {
    if (!selectingEnd) {
      onChange({ start: iso, end: iso });
      setSelectingEnd(true);
      return;
    }

    onChange(normalizeRange(range.start, iso));
    setSelectingEnd(false);
  }

  function isStart(iso: string) {
    return iso === range.start;
  }

  function isEnd(iso: string) {
    return iso === range.end;
  }

  function isInRange(iso: string) {
    return isDateInRange(iso, range) && !isStart(iso) && !isEnd(iso);
  }

  return (
    <View className="gap-4 rounded-[28px] border border-border bg-surface p-5 dark:border-border-dark dark:bg-surface-dark">
      <View className="flex-row items-center justify-between">
        <Pressable
          accessibilityRole="button"
          onPress={goToPreviousMonth}
          className="h-10 w-10 items-center justify-center rounded-xl bg-muted active:opacity-80 dark:bg-muted-dark">
          <Ionicons name="chevron-back" size={20} color="#7C3AED" />
        </Pressable>

        <Text className="text-lg font-bold text-foreground dark:text-foreground-dark">
          {MONTH_LABELS[visibleMonth]} {visibleYear}
        </Text>

        <Pressable
          accessibilityRole="button"
          onPress={goToNextMonth}
          className="h-10 w-10 items-center justify-center rounded-xl bg-muted active:opacity-80 dark:bg-muted-dark">
          <Ionicons name="chevron-forward" size={20} color="#7C3AED" />
        </Pressable>
      </View>

      <View className="flex-row">
        {WEEKDAY_LABELS.map((label) => (
          <View key={label} className="flex-1 items-center py-1">
            <Text className="text-xs font-semibold text-subtle dark:text-subtle-dark">{label}</Text>
          </View>
        ))}
      </View>

      <View className="flex-row flex-wrap">
        {days.map((iso, index) => {
          if (!iso) {
            return <View key={`empty-${index}`} className="w-[14.28%] aspect-square" />;
          }

          const selected = isStart(iso) || isEnd(iso);
          const inRange = isInRange(iso);
          const today = isToday(iso);

          return (
            <Pressable
              key={iso}
              accessibilityRole="button"
              onPress={() => handleDayPress(iso)}
              className="w-[14.28%] items-center justify-center py-1">
              <View
                className={`h-10 w-10 items-center justify-center rounded-full ${
                  selected
                    ? 'bg-brand dark:bg-brand-dark'
                    : inRange
                      ? 'bg-surface-soft dark:bg-surface-soft-dark'
                      : today
                        ? 'border border-brand dark:border-brand-dark'
                        : ''
                }`}>
                <Text
                  className={`text-sm font-semibold ${
                    selected
                      ? 'text-white'
                      : 'text-foreground dark:text-foreground-dark'
                  }`}>
                  {parseIsoDate(iso).getDate()}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      <View className="flex-row items-center justify-between rounded-2xl bg-canvas px-4 py-3 dark:bg-canvas-dark">
        <View>
          <Text className="text-xs text-subtle dark:text-subtle-dark">Desde</Text>
          <Text className="text-sm font-semibold text-foreground dark:text-foreground-dark">
            {formatShortDate(range.start)}
          </Text>
        </View>
        <Ionicons name="arrow-forward" size={16} color="#6B6475" />
        <View className="items-end">
          <Text className="text-xs text-subtle dark:text-subtle-dark">Hasta</Text>
          <Text className="text-sm font-semibold text-foreground dark:text-foreground-dark">
            {formatShortDate(range.end)}
          </Text>
        </View>
      </View>

      <Text className="text-center text-xs text-subtle dark:text-subtle-dark">
        Toca un día para iniciar el rango y otro para terminarlo.
      </Text>
    </View>
  );
}

export function DateRangeQuickPresets({
  onSelect,
}: {
  onSelect: (range: DateRange) => void;
}) {
  const today = todayIso();

  const presets = [
    { label: 'Últimos 7 días', range: { start: daysAgoIso(6), end: today } },
    { label: 'Últimos 30 días', range: { start: daysAgoIso(29), end: today } },
    { label: 'Últimos 3 meses', range: { start: daysAgoIso(90), end: today } },
    { label: 'Último año', range: { start: daysAgoIso(365), end: today } },
  ];

  return (
    <View className="flex-row flex-wrap gap-2">
      {presets.map((preset) => (
        <Pressable
          key={preset.label}
          accessibilityRole="button"
          onPress={() => onSelect(preset.range)}
          className="rounded-full border border-border bg-surface px-3 py-2 active:opacity-80 dark:border-border-dark dark:bg-surface-dark">
          <Text className="text-xs font-semibold text-brand dark:text-brand-dark">{preset.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}
