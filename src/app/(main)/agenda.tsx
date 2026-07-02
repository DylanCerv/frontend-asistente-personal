import Ionicons from '@react-native-vector-icons/ionicons';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { ScreenSafeArea } from '@/components/screen-safe-area';

import { PRIORITY_LABELS } from '@/constants/labels';
import { ExpandableItemCard } from '@/components/expandable-item-card';
import { EventDetailsContent, TaskDetailsContent } from '@/components/item-details';
import { ScreenHeader } from '@/components/screen-header';
import { useAssistant } from '@/context/assistant-context';
import type { CalendarEvent, TaskItem } from '@/types/assistant';
import { filterTasksByRange } from '@/utils/agenda-utils';
import {
  enumerateDates,
  formatRangeLabel,
  getPresetRange,
  isDateInRange,
  relativeDayLabel,
  todayIso,
} from '@/utils/date-utils';

type ViewMode = 'day' | 'week' | 'month';

const VIEW_MODES: { id: ViewMode; label: string }[] = [
  { id: 'day', label: 'Día' },
  { id: 'week', label: 'Semana' },
  { id: 'month', label: 'Mes' },
];

export default function AgendaScreen() {
  const { tasks, events, toggleTaskComplete } = useAssistant();
  const [viewMode, setViewMode] = useState<ViewMode>('week');

  const activeRange = useMemo(() => {
    const today = todayIso();
    if (viewMode === 'day') return { start: today, end: today };
    if (viewMode === 'week') return getPresetRange('week', today);
    return getPresetRange('month', today);
  }, [viewMode]);

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

  return (
    <ScreenSafeArea>
      <ScreenHeader
        title="Agenda"
        subtitle={`${formatRangeLabel(activeRange)} · ${filteredTasks.length} tareas · ${filteredEvents.length} eventos`}
      />
      <ScrollView contentContainerClassName="w-full max-w-3xl gap-6 self-center px-6 pb-36 pt-4">
        <View className="flex-row gap-2 rounded-2xl border border-border bg-surface p-1 dark:border-border-dark dark:bg-surface-dark">
          {VIEW_MODES.map((mode) => (
            <Pressable
              key={mode.id}
              accessibilityRole="button"
              onPress={() => setViewMode(mode.id)}
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

        {groupedDays.length > 0 ? (
          <View className="gap-5">
            {groupedDays.map((day) => (
              <DayGroup
                key={day.date}
                label={day.label}
                tasks={day.tasks}
                events={day.events}
                onToggleTask={toggleTaskComplete}
              />
            ))}
          </View>
        ) : (
          <View className="items-center gap-3 rounded-[28px] border border-dashed border-border p-10 dark:border-border-dark">
            <Ionicons name="calendar-outline" size={40} color="#6B6475" />
            <Text className="text-center text-subtle dark:text-subtle-dark">
              No hay nada en este periodo. Habla con tu asistente para crear tareas o reuniones.
            </Text>
          </View>
        )}
      </ScrollView>
    </ScreenSafeArea>
  );
}

function DayGroup({
  label,
  tasks,
  events,
  onToggleTask,
}: {
  label: string;
  tasks: TaskItem[];
  events: CalendarEvent[];
  onToggleTask: (taskId: string) => void;
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
        <AgendaTaskCard key={task.id} task={task} onToggle={() => onToggleTask(task.id)} />
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

function AgendaTaskCard({ task, onToggle }: { task: TaskItem; onToggle: () => void }) {
  const isCompleted = task.status === 'completed';

  return (
    <View className="flex-row items-start gap-2">
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: isCompleted }}
        onPress={onToggle}
        className={`mt-4 h-6 w-6 items-center justify-center rounded-lg border-2 ${
          isCompleted
            ? 'border-brand bg-brand dark:border-brand-dark dark:bg-brand-dark'
            : 'border-border dark:border-border-dark'
        }`}>
        {isCompleted ? <Ionicons name="checkmark" size={14} color="#FFFFFF" /> : null}
      </Pressable>

      <View className="flex-1">
        <ExpandableItemCard expandedContent={<TaskDetailsContent task={task} />}>
          <View className="flex-row items-center gap-3">
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
      </View>
    </View>
  );
}
