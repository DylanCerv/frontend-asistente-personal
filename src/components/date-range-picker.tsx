import Ionicons from '@react-native-vector-icons/ionicons';
import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import {
  formatRangeLabel,
  getCalendarDays,
  getPresetRange,
  MONTH_LABELS,
  normalizeRange,
  parseIsoDate,
  todayIso,
  type DateRange,
  WEEKDAY_LABELS,
} from '@/utils/date-utils';

export type RangePreset = 'day' | 'week' | 'month' | 'custom';

const PRESETS: { id: RangePreset; label: string }[] = [
  { id: 'day', label: 'Día' },
  { id: 'week', label: 'Semana' },
  { id: 'month', label: 'Mes' },
  { id: 'custom', label: 'Rango' },
];

function rangeForPreset(preset: RangePreset, customRange: DateRange): DateRange {
  const today = todayIso();
  if (preset === 'day') return { start: today, end: today };
  if (preset === 'week') return getPresetRange('week', today);
  if (preset === 'month') return getPresetRange('month', today);
  return customRange;
}

type DateRangePickerProps = {
  preset: RangePreset;
  range: DateRange;
  onChange: (preset: RangePreset, range: DateRange) => void;
};

export function DateRangePicker({ preset, range, onChange }: DateRangePickerProps) {
  const [customRange, setCustomRange] = useState<DateRange>(range);
  const [draftStart, setDraftStart] = useState<string | null>(range.start);
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const date = parseIsoDate(range.start);
    return { year: date.getFullYear(), month: date.getMonth() };
  });

  const label = useMemo(() => formatRangeLabel(range), [range]);
  const calendarDays = useMemo(
    () => getCalendarDays(visibleMonth.year, visibleMonth.month),
    [visibleMonth],
  );
  const monthLabel = `${MONTH_LABELS[visibleMonth.month]} ${visibleMonth.year}`;

  function selectPreset(next: RangePreset) {
    if (next === 'custom') {
      const nextRange = rangeForPreset('custom', customRange);
      onChange('custom', nextRange);
      return;
    }
    onChange(next, rangeForPreset(next, customRange));
  }

  function moveMonth(delta: number) {
    const next = new Date(visibleMonth.year, visibleMonth.month + delta, 1);
    setVisibleMonth({ year: next.getFullYear(), month: next.getMonth() });
  }

  function selectCalendarDay(day: string) {
    if (!draftStart || customRange.start !== customRange.end) {
      const next = { start: day, end: day };
      setDraftStart(day);
      setCustomRange(next);
      onChange('custom', next);
      return;
    }

    const next = normalizeRange(draftStart, day);
    setDraftStart(null);
    setCustomRange(next);
    onChange('custom', next);
  }

  function isSelected(day: string): boolean {
    return day === range.start || day === range.end;
  }

  function isInRange(day: string): boolean {
    return day > range.start && day < range.end;
  }

  function dayNumber(day: string): number {
    return parseIsoDate(day).getDate();
  }

  return (
    <View className="gap-3">
      <View className="flex-row gap-2 rounded-2xl border border-border bg-surface p-1 dark:border-border-dark dark:bg-surface-dark">
        {PRESETS.map((item) => (
          <Pressable
            key={item.id}
            accessibilityRole="button"
            onPress={() => selectPreset(item.id)}
            className={`flex-1 items-center rounded-xl py-2.5 ${
              preset === item.id ? 'bg-brand dark:bg-brand-dark' : ''
            }`}>
            <Text
              className={`text-sm font-semibold ${
                preset === item.id ? 'text-white' : 'text-subtle dark:text-subtle-dark'
              }`}>
              {item.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <View className="flex-row items-center gap-2">
        <Ionicons name="calendar-outline" size={16} color="#7C3AED" />
        <Text className="flex-1 text-sm text-subtle dark:text-subtle-dark">{label}</Text>
      </View>

      {preset === 'custom' ? (
        <View className="gap-4 rounded-[24px] border border-border bg-surface p-4 dark:border-border-dark dark:bg-surface-dark">
          <View className="flex-row items-center justify-between">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Mes anterior"
              onPress={() => moveMonth(-1)}
              className="h-10 w-10 items-center justify-center rounded-full bg-canvas active:opacity-80 dark:bg-canvas-dark">
              <Ionicons name="chevron-back" size={20} color="#7C3AED" />
            </Pressable>

            <View className="items-center gap-0.5">
              <Text className="text-base font-bold text-foreground dark:text-foreground-dark">
                {monthLabel}
              </Text>
              <Text className="text-xs text-subtle dark:text-subtle-dark">
                Toca inicio y fin del rango
              </Text>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Mes siguiente"
              onPress={() => moveMonth(1)}
              className="h-10 w-10 items-center justify-center rounded-full bg-canvas active:opacity-80 dark:bg-canvas-dark">
              <Ionicons name="chevron-forward" size={20} color="#7C3AED" />
            </Pressable>
          </View>

          <View className="gap-2">
            <View className="flex-row">
              {WEEKDAY_LABELS.slice(1).concat(WEEKDAY_LABELS[0]).map((weekday) => (
                <Text
                  key={weekday}
                  className="flex-1 text-center text-[11px] font-semibold uppercase text-subtle dark:text-subtle-dark">
                  {weekday}
                </Text>
              ))}
            </View>

            <View className="flex-row flex-wrap">
              {calendarDays.map((day, index) => {
                if (!day) {
                  return <View key={`empty-${index}`} className="aspect-square w-[14.285%]" />;
                }

                const selected = isSelected(day);
                const inRange = isInRange(day);
                const isTodayDate = day === todayIso();

                return (
                  <Pressable
                    key={day}
                    accessibilityRole="button"
                    accessibilityLabel={`Seleccionar ${day}`}
                    onPress={() => selectCalendarDay(day)}
                    className="aspect-square w-[14.285%] items-center justify-center p-0.5">
                    <View
                      className={`h-9 w-9 items-center justify-center rounded-full ${
                        selected
                          ? 'bg-brand dark:bg-brand-dark'
                          : inRange
                            ? 'bg-surface-soft dark:bg-surface-soft-dark'
                            : isTodayDate
                              ? 'border border-brand/40 bg-canvas dark:bg-canvas-dark'
                              : ''
                      }`}>
                      <Text
                        className={`text-sm font-semibold ${
                          selected
                            ? 'text-white'
                            : inRange || isTodayDate
                              ? 'text-brand dark:text-brand-dark'
                              : 'text-foreground dark:text-foreground-dark'
                        }`}>
                        {dayNumber(day)}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View className="flex-row items-center gap-2 rounded-2xl bg-canvas px-3 py-2.5 dark:bg-canvas-dark">
            <Ionicons name="calendar-outline" size={16} color="#7C3AED" />
            <Text className="flex-1 text-xs font-medium text-subtle dark:text-subtle-dark">
              {label}
            </Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

export function useDateRangeState(initialPreset: RangePreset = 'week') {
  const initialRange = rangeForPreset(initialPreset, { start: todayIso(), end: todayIso() });
  const [preset, setPreset] = useState<RangePreset>(initialPreset);
  const [range, setRange] = useState<DateRange>(initialRange);

  function onChange(nextPreset: RangePreset, nextRange: DateRange) {
    setPreset(nextPreset);
    setRange(nextRange);
  }

  return { preset, range, onChange };
}
