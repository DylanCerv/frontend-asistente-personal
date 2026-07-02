import Ionicons from '@react-native-vector-icons/ionicons';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DateRangeCalendar, DateRangeQuickPresets } from '@/components/date-range-calendar';
import { ExpandableItemCard } from '@/components/expandable-item-card';
import { EventDetailsContent, TaskDetailsContent } from '@/components/item-details';
import { PRIORITY_LABELS } from '@/constants/mock-data';
import { useAssistant } from '@/context/assistant-context';
import { filterTasksByRange } from '@/services/report-analytics';
import type { CalendarEvent, DateRange, TaskItem } from '@/types/assistant';
import {
  enumerateDates,
  formatRangeLabel,
  getPresetRange,
  isDateInRange,
  relativeDayLabel,
  todayIso,
} from '@/utils/date-utils';

type ViewMode = 'day' | 'week' | 'month' | 'range';

const VIEW_MODES: { id: ViewMode; label: string }[] = [
  { id: 'day', label: 'Día' },
  { id: 'week', label: 'Semana' },
  { id: 'month', label: 'Mes' },
  { id: 'range', label: 'Rango' },
];

export default function AgendaScreen() {
  const { tasks, events } = useAssistant();
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [customRange, setCustomRange] = useState<DateRange>(getPresetRange('month', todayIso()));
  const [showRangeCalendar, setShowRangeCalendar] = useState(false);

  const activeRange = useMemo(() => {
    const today = todayIso();
    if (viewMode === 'day') return { start: today, end: today };
    if (viewMode === 'week') return getPresetRange('week', today);
    if (viewMode === 'month') return getPresetRange('month', today);
    return customRange;
  }, [viewMode, customRange]);

  const filteredTasks = useMemo(
    () => filterTasksByRange(tasks, activeRange),
    [tasks, activeRange],
  );

  const filteredEvents = useMemo(
    () => events.filter((event) => isDateInRange(event.scheduledAt, activeRange)),
    [events, activeRange],
  );

  const groupedDays = useMemo(() => {
    const dates = enumerateDates(activeRange).reverse();
    return dates
      .map((date) => ({
        date,
        label: relativeDayLabel(date),
        tasks: filteredTasks.filter((task) => task.scheduledAt === date),
        events: filteredEvents.filter((event) => event.scheduledAt === date),
      }))
      .filter((day) => day.tasks.length > 0 || day.events.length > 0);
  }, [activeRange, filteredTasks, filteredEvents]);

  function handleViewModeChange(mode: ViewMode) {
    setViewMode(mode);
    setShowRangeCalendar(mode === 'range');
  }

  return (
    <SafeAreaView className="flex-1 bg-canvas dark:bg-canvas-dark">
      <ScrollView contentContainerClassName="w-full max-w-3xl gap-6 self-center px-6 pb-36 pt-3">
        <View className="gap-1">
          <Text className="text-[30px] font-bold text-foreground dark:text-foreground-dark">
            Agenda
          </Text>
          <Text className="text-[15px] text-subtle dark:text-subtle-dark">
            Vista temporal — cuándo ocurren tus tareas y eventos
          </Text>
          <Text className="text-sm text-subtle dark:text-subtle-dark">
            {formatRangeLabel(activeRange)} · {filteredTasks.length} tareas ·{' '}
            {filteredEvents.length} eventos
          </Text>
        </View>

        <View className="flex-row gap-2 rounded-2xl border border-border bg-surface p-1 dark:border-border-dark dark:bg-surface-dark">
          {VIEW_MODES.map((mode) => (
            <Pressable
              key={mode.id}
              accessibilityRole="button"
              onPress={() => handleViewModeChange(mode.id)}
              className={`flex-1 items-center rounded-xl py-2.5 ${
                viewMode === mode.id ? 'bg-brand dark:bg-brand-dark' : ''
              }`}>
              <Text
                className={`text-sm font-semibold ${
                  viewMode === mode.id ? 'text-white' : 'text-subtle dark:text-subtle-dark'
                }`}>
                {mode.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {viewMode === 'range' ? (
          <View className="gap-4">
            <DateRangeQuickPresets
              onSelect={(range) => {
                setCustomRange(range);
                setShowRangeCalendar(false);
              }}
            />
            {showRangeCalendar ? (
              <DateRangeCalendar range={customRange} onChange={setCustomRange} />
            ) : (
              <Pressable
                accessibilityRole="button"
                onPress={() => setShowRangeCalendar(true)}
                className="flex-row items-center justify-center gap-2 rounded-2xl border border-dashed border-brand/40 bg-surface-soft py-3 active:opacity-80 dark:bg-surface-soft-dark">
                <Ionicons name="calendar-outline" size={18} color="#7C3AED" />
                <Text className="text-sm font-semibold text-brand dark:text-brand-dark">
                  Abrir calendario de rango
                </Text>
              </Pressable>
            )}
          </View>
        ) : null}

        {groupedDays.length > 0 ? (
          <View className="gap-5">
            {groupedDays.map((day) => (
              <DayGroup key={day.date} label={day.label} tasks={day.tasks} events={day.events} />
            ))}
          </View>
        ) : (
          <View className="items-center gap-3 rounded-[28px] border border-dashed border-border p-10 dark:border-border-dark">
            <Ionicons name="calendar-outline" size={40} color="#6B6475" />
            <Text className="text-center text-subtle dark:text-subtle-dark">
              No hay nada en este rango. Amplía el filtro o crea algo con tu asistente.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function DayGroup({
  label,
  tasks,
  events,
}: {
  label: string;
  tasks: TaskItem[];
  events: CalendarEvent[];
}) {
  return (
    <View className="gap-3">
      <Text className="text-lg font-semibold text-foreground dark:text-foreground-dark">
        {label}
      </Text>
      {events.map((event) => (
        <AgendaEventCard key={event.id} event={event} />
      ))}
      {tasks.map((task) => (
        <AgendaTaskCard key={task.id} task={task} />
      ))}
    </View>
  );
}

function AgendaEventCard({ event }: { event: CalendarEvent }) {
  const typeIcons = {
    meeting: 'people-outline',
    event: 'star-outline',
    reminder: 'notifications-outline',
  } as const;

  return (
    <ExpandableItemCard expandedContent={<EventDetailsContent event={event} />}>
      <View className="flex-row items-center gap-3">
        <View className="w-14 items-center">
          <Text className="text-sm font-bold text-brand dark:text-brand-dark">
            {event.time.split(' ')[0]}
          </Text>
        </View>
        <View className="h-10 w-10 items-center justify-center rounded-xl bg-muted dark:bg-muted-dark">
          <Ionicons
            name={typeIcons[event.type as keyof typeof typeIcons] ?? 'calendar-outline'}
            size={20}
            color="#7C3AED"
          />
        </View>
        <View className="flex-1 gap-0.5">
          <Text className="text-[15px] font-semibold text-foreground dark:text-foreground-dark">
            {event.title}
          </Text>
          <Text className="text-xs text-subtle dark:text-subtle-dark">Evento</Text>
        </View>
      </View>
    </ExpandableItemCard>
  );
}

function AgendaTaskCard({ task }: { task: TaskItem }) {
  const isCompleted = task.status === 'completed';

  return (
    <ExpandableItemCard expandedContent={<TaskDetailsContent task={task} />}>
      <View className="flex-row items-center gap-3">
        <View
          className={`h-8 w-8 items-center justify-center rounded-lg ${
            isCompleted ? 'bg-brand dark:bg-brand-dark' : 'border-2 border-border dark:border-border-dark'
          }`}>
          {isCompleted ? <Ionicons name="checkmark" size={16} color="#FFFFFF" /> : null}
        </View>
        <View className="flex-1 gap-0.5">
          <Text
            className={`text-[15px] font-semibold ${
              isCompleted
                ? 'text-subtle line-through dark:text-subtle-dark'
                : 'text-foreground dark:text-foreground-dark'
            }`}>
            {task.title}
          </Text>
          <Text className="text-xs text-subtle dark:text-subtle-dark">
            Tarea · {task.category} · {PRIORITY_LABELS[task.priority]}
          </Text>
        </View>
      </View>
    </ExpandableItemCard>
  );
}
