import Ionicons from '@react-native-vector-icons/ionicons';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

import type { ScreenAccent } from '@/constants/screen-themes';
import {
  enumerateDates,
  formatSelectedDatesLabel,
  getCalendarDays,
  mergeSelectedDates,
  MONTH_LABELS,
  normalizeRange,
  parseIsoDate,
  todayIso,
  WEEKDAY_LABELS,
} from '@/utils/date-utils';

export type VisibleMonth = {
  year: number;
  month: number;
};

const DEFAULT_ACCENT: ScreenAccent = {
  main: '#7C3AED',
  soft: 'rgba(124, 58, 237, 0.1)',
  border: 'rgba(124, 58, 237, 0.28)',
};

const ON_LIGHT_ACCENT = '#1A0B2E';
const ON_DARK_ACCENT = '#FFFFFF';

function onAccentTextColor(hex: string): string {
  const raw = hex.replace('#', '');
  if (raw.length < 6) return ON_DARK_ACCENT;
  const r = Number.parseInt(raw.slice(0, 2), 16);
  const g = Number.parseInt(raw.slice(2, 4), 16);
  const b = Number.parseInt(raw.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55 ? ON_LIGHT_ACCENT : ON_DARK_ACCENT;
}

type AgendaCalendarProps = {
  selectedDates: string[];
  markedDates?: string[];
  onChange: (dates: string[]) => void;
  onVisibleMonthChange?: (visibleMonth: VisibleMonth) => void;
  footerContent?: ReactNode;
  accent?: ScreenAccent;
};

export function AgendaCalendar({
  selectedDates,
  markedDates = [],
  onChange,
  onVisibleMonthChange,
  footerContent,
  accent = DEFAULT_ACCENT,
}: AgendaCalendarProps) {
  const [rangeAnchor, setRangeAnchor] = useState<string | null>(null);
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const initial = selectedDates[0] ?? todayIso();
    const date = parseIsoDate(initial);
    return { year: date.getFullYear(), month: date.getMonth() };
  });

  const label = useMemo(() => formatSelectedDatesLabel(selectedDates), [selectedDates]);
  const selectedSet = useMemo(() => new Set(selectedDates), [selectedDates]);
  const calendarDays = useMemo(
    () => getCalendarDays(visibleMonth.year, visibleMonth.month),
    [visibleMonth],
  );
  const markedSet = useMemo(() => new Set(markedDates), [markedDates]);
  const monthLabel = `${MONTH_LABELS[visibleMonth.month]} ${visibleMonth.year}`;

  useEffect(() => {
    onVisibleMonthChange?.(visibleMonth);
  }, [visibleMonth, onVisibleMonthChange]);

  function moveMonth(delta: number) {
    const next = new Date(visibleMonth.year, visibleMonth.month + delta, 1);
    setVisibleMonth({ year: next.getFullYear(), month: next.getMonth() });
  }

  function toggleDay(day: string) {
    const next = new Set(selectedDates);
    if (next.has(day)) {
      next.delete(day);
    } else {
      next.add(day);
    }
    onChange(Array.from(next).sort());
  }

  function handleDayPress(day: string) {
    if (rangeAnchor && rangeAnchor !== day) {
      const rangeDates = enumerateDates(normalizeRange(rangeAnchor, day));
      onChange(mergeSelectedDates(selectedDates, rangeDates));
      setRangeAnchor(null);
      return;
    }

    if (rangeAnchor === day) {
      setRangeAnchor(null);
      return;
    }

    toggleDay(day);
  }

  function handleDayLongPress(day: string) {
    setRangeAnchor(day);
  }

  function dayNumber(day: string): number {
    return parseIsoDate(day).getDate();
  }

  return (
    <View
      className="gap-4 rounded-[24px] border bg-surface p-4 dark:bg-surface-dark"
      style={{ borderColor: accent.border }}>
      <View className="flex-row items-center justify-between">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Mes anterior"
          onPress={() => moveMonth(-1)}
          className="h-10 w-10 items-center justify-center rounded-full bg-canvas active:opacity-80 dark:bg-canvas-dark">
          <Ionicons name="chevron-back" size={20} color={accent.main} />
        </Pressable>

        <View className="items-center">
          <Text className="text-base font-bold text-foreground dark:text-foreground-dark">
            {monthLabel}
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Mes siguiente"
          onPress={() => moveMonth(1)}
          className="h-10 w-10 items-center justify-center rounded-full bg-canvas active:opacity-80 dark:bg-canvas-dark">
          <Ionicons name="chevron-forward" size={20} color={accent.main} />
        </Pressable>
      </View>

      {rangeAnchor ? (
        <View
          className="flex-row items-center gap-2.5 rounded-2xl border px-3.5 py-3"
          style={{ borderColor: accent.border, backgroundColor: accent.soft }}>
          <View
            className="h-8 w-8 items-center justify-center rounded-full"
            style={{ backgroundColor: accent.main }}>
            <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
          </View>
          <Text className="flex-1 text-sm font-semibold" style={{ color: accent.main }}>
            Toca otro día para completar el rango
          </Text>
        </View>
      ) : (
        <View
          className="gap-2 rounded-2xl border px-3.5 py-3"
          style={{ borderColor: accent.border, backgroundColor: accent.soft }}>
          <View className="flex-row items-center gap-2">
            <Ionicons name="information-circle" size={18} color={accent.main} />
            <Text className="text-sm font-semibold text-foreground dark:text-foreground-dark">
              Cómo seleccionar fechas
            </Text>
          </View>
          <View className="gap-1.5">
            <View className="flex-row items-center gap-2">
              <View
                className="h-6 w-6 items-center justify-center rounded-lg"
                style={{ backgroundColor: accent.soft }}>
                <Ionicons name="finger-print-outline" size={14} color={accent.main} />
              </View>
              <Text className="flex-1 text-xs leading-5 text-subtle dark:text-subtle-dark">
                <Text className="font-semibold text-foreground dark:text-foreground-dark">Toque:</Text>{' '}
                elige o quita días sueltos
              </Text>
            </View>
            <View className="flex-row items-center gap-2">
              <View
                className="h-6 w-6 items-center justify-center rounded-lg"
                style={{ backgroundColor: accent.soft }}>
                <Ionicons name="hand-left-outline" size={14} color={accent.main} />
              </View>
              <Text className="flex-1 text-xs leading-5 text-subtle dark:text-subtle-dark">
                <Text className="font-semibold text-foreground dark:text-foreground-dark">
                  Mantén pulsado:
                </Text>{' '}
                luego toca otro día para un rango
              </Text>
            </View>
          </View>
        </View>
      )}

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

            const selected = selectedSet.has(day);
            const isRangeAnchor = rangeAnchor === day;
            const isTodayDate = day === todayIso();
            const hasItems = markedSet.has(day);
            const selectedTextColor = onAccentTextColor(accent.main);

            const dayStyle = selected
              ? {
                  backgroundColor: accent.main,
                  borderWidth: isTodayDate ? 2 : 0,
                  borderColor: isTodayDate ? '#FFFFFF' : undefined,
                }
              : isRangeAnchor
                ? {
                    borderWidth: 2,
                    borderStyle: 'dashed' as const,
                    borderColor: accent.main,
                    backgroundColor: accent.soft,
                  }
                : isTodayDate
                  ? {
                      borderWidth: 2,
                      borderColor: '#FFFFFF',
                      backgroundColor: 'rgba(255,255,255,0.12)',
                    }
                  : undefined;

            const dayTextColor = selected
              ? selectedTextColor
              : isTodayDate
                ? '#FFFFFF'
                : isRangeAnchor
                  ? accent.main
                  : undefined;

            return (
              <Pressable
                key={day}
                accessibilityRole="button"
                accessibilityLabel={`Seleccionar ${day}`}
                onPress={() => handleDayPress(day)}
                onLongPress={() => handleDayLongPress(day)}
                delayLongPress={280}
                className="aspect-square w-[14.285%] items-center justify-center p-0.5">
                <View
                  className="h-10 w-10 items-center justify-center rounded-full"
                  style={dayStyle}>
                  <Text
                    className={`text-sm font-bold ${
                      dayTextColor ? '' : 'text-foreground dark:text-foreground-dark'
                    }`}
                    style={dayTextColor ? { color: dayTextColor } : undefined}>
                    {dayNumber(day)}
                  </Text>
                  {isTodayDate ? (
                    <Text
                      className="text-[8px] font-extrabold uppercase leading-none"
                      style={{ color: selected ? selectedTextColor : '#FFFFFF' }}>
                      Hoy
                    </Text>
                  ) : null}
                  {hasItems ? (
                    <View
                      className="absolute bottom-0.5 h-1 w-1 rounded-full"
                      style={{
                        backgroundColor: selected
                          ? selectedTextColor
                          : isTodayDate
                            ? '#FFFFFF'
                            : accent.main,
                      }}
                    />
                  ) : null}
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>

      {footerContent}

      <View className="flex-row items-center gap-2 rounded-2xl bg-canvas px-3 py-2.5 dark:bg-canvas-dark">
        <Ionicons name="calendar-outline" size={16} color={accent.main} />
        <Text className="flex-1 text-xs font-medium text-subtle dark:text-subtle-dark">
          {label}
        </Text>
        {selectedDates.length > 0 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Borrar días seleccionados"
            onPress={() => {
              setRangeAnchor(null);
              onChange([]);
            }}
            className="flex-row items-center gap-1 rounded-full px-2.5 py-1 active:opacity-80"
            style={{ backgroundColor: accent.soft }}>
            <Ionicons name="close-circle-outline" size={14} color={accent.main} />
            <Text className="text-[11px] font-semibold" style={{ color: accent.main }}>
              Limpiar
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

export function useAgendaCalendarState(initialDates: string | string[] = todayIso()) {
  const [selectedDates, setSelectedDates] = useState<string[]>(() => {
    const dates = Array.isArray(initialDates) ? initialDates : [initialDates];
    return [...dates].sort();
  });
  return { selectedDates, onChange: setSelectedDates };
}

function getMonthDates(visibleMonth: VisibleMonth): string[] {
  return getCalendarDays(visibleMonth.year, visibleMonth.month).filter(
    (day): day is string => day !== null,
  );
}

function BulkActionButton({
  label,
  icon,
  onPress,
  active = false,
  accent,
}: {
  label: string;
  icon: string;
  onPress: () => void;
  active?: boolean;
  accent: ScreenAccent;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className={`flex-1 flex-row items-center justify-center gap-1.5 rounded-xl border py-2.5 ${
        active ? '' : 'border-border bg-surface dark:border-border-dark dark:bg-surface-dark'
      }`}
      style={
        active
          ? { borderColor: accent.main, backgroundColor: accent.soft }
          : undefined
      }>
      <Ionicons name={icon as never} size={14} color={active ? accent.main : '#6B6475'} />
      <Text
        className={`text-xs font-semibold ${
          active ? '' : 'text-subtle dark:text-subtle-dark'
        }`}
        style={active ? { color: accent.main } : undefined}>
        {label}
      </Text>
    </Pressable>
  );
}

export function CalendarBulkActions({
  selectedDates,
  visibleMonth,
  onChange,
  accent = DEFAULT_ACCENT,
}: {
  selectedDates: string[];
  visibleMonth: VisibleMonth;
  onChange: (dates: string[]) => void;
  accent?: ScreenAccent;
}) {
  const selectedSet = useMemo(() => new Set(selectedDates), [selectedDates]);
  const monthDates = useMemo(() => getMonthDates(visibleMonth), [visibleMonth]);
  const monthSet = useMemo(() => new Set(monthDates), [monthDates]);
  const allMonthSelected =
    monthDates.length > 0 && monthDates.every((day) => selectedSet.has(day));
  const monthLabel = `${MONTH_LABELS[visibleMonth.month].slice(0, 3)}`;

  function clearSelection() {
    onChange([]);
  }

  function selectTodayOnly() {
    onChange([todayIso()]);
  }

  function toggleVisibleMonth() {
    if (allMonthSelected) {
      onChange(selectedDates.filter((day) => !monthSet.has(day)));
      return;
    }
    onChange(mergeSelectedDates(selectedDates, monthDates));
  }

  return (
    <View className="gap-2">
      <Text className="text-xs font-semibold uppercase text-subtle dark:text-subtle-dark">
        Acciones rápidas · {selectedDates.length} día{selectedDates.length === 1 ? '' : 's'}
      </Text>
      <View className="flex-row gap-2">
        <BulkActionButton
          label="Limpiar"
          icon="close-circle-outline"
          onPress={clearSelection}
          active={selectedDates.length === 0}
          accent={accent}
        />
        <BulkActionButton
          label="Solo hoy"
          icon="today-outline"
          onPress={selectTodayOnly}
          active={selectedDates.length === 1 && selectedDates[0] === todayIso()}
          accent={accent}
        />
        <BulkActionButton
          label={allMonthSelected ? `Quitar ${monthLabel}` : `Mes ${monthLabel}`}
          icon={allMonthSelected ? 'remove-circle-outline' : 'calendar-outline'}
          onPress={toggleVisibleMonth}
          active={allMonthSelected}
          accent={accent}
        />
      </View>
    </View>
  );
}
