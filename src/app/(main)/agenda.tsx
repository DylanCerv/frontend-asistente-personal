import Ionicons from '@react-native-vector-icons/ionicons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal, Platform, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { ScreenSafeArea } from '@/components/screen-safe-area';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/text-input';
import { PRIORITY_LABELS } from '@/constants/labels';
import { CATEGORY_OPTIONS, getCategoryIcon } from '@/constants/categories';
import { useScreenAccent } from '@/constants/screen-themes';
import { AgendaCalendar, useAgendaCalendarState } from '@/components/agenda-calendar';
import { ScreenAccentBar } from '@/components/screen-accent-bar';
import { ExpandableItemCard } from '@/components/expandable-item-card';
import { EventDetailsContent, TaskDetailsContent } from '@/components/item-details';
import { ScreenHeader } from '@/components/screen-header';
import { useAssistant } from '@/context/assistant-context';
import { showAppAlert } from '@/services/app-dialog';
import type { CalendarEvent, TaskItem } from '@/types/assistant';
import type { RecordChange, UpdateRecordPayload } from '@/types/record-api';
import type { RecordType } from '@/types/record';
import { getRecordHistory } from '@/services/records/records-api';

type Priority = NonNullable<UpdateRecordPayload['priority']>;
import { filterTasksByDates } from '@/utils/agenda-utils';
import {
  formatSelectedDatesLabel,
  isDateSelected,
  relativeDayLabel,
} from '@/utils/date-utils';

type FilterType = 'all' | 'tasks' | 'events';

export default function AgendaScreen() {
  const { taskId, eventId } = useLocalSearchParams<{ taskId?: string; eventId?: string }>();
  const focusTaskId = typeof taskId === 'string' ? taskId : undefined;
  const focusEventId = typeof eventId === 'string' ? eventId : undefined;

  const { tasks, events, toggleTaskComplete, toggleEventComplete, deleteRecord, patchRecord, refreshRecords } = useAssistant();
  const { selectedDates, onChange } = useAgendaCalendarState();
  const accent = useScreenAccent('agenda');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const focusedTask = useMemo(
    () => (focusTaskId ? tasks.find((t) => t.id === focusTaskId) : undefined),
    [focusTaskId, tasks],
  );
  const focusedEvent = useMemo(
    () => (focusEventId ? events.find((e) => e.id === focusEventId) : undefined),
    [events, focusEventId],
  );

  const filteredTasks = useMemo(
    () => filterTasksByDates(tasks, selectedDates),
    [tasks, selectedDates],
  );

  const filteredEvents = useMemo(
    () => events.filter((event) => isDateSelected(event.scheduledAt, selectedDates)),
    [events, selectedDates],
  );

  const markedDates = useMemo(() => {
    const dates = new Set<string>();
    if (filterType !== 'events') {
      for (const task of tasks) {
        if (task.scheduledAt) dates.add(task.scheduledAt);
      }
    }
    if (filterType !== 'tasks') {
      for (const event of events) {
        if (event.scheduledAt) dates.add(event.scheduledAt);
      }
    }
    return Array.from(dates);
  }, [tasks, events, filterType]);

  const groupedDays = useMemo(() => {
    const dates = [...selectedDates].sort().reverse();
    return dates
      .map((date) => ({
        date,
        label: relativeDayLabel(date),
        tasks: filterType !== 'events' ? filteredTasks.filter((t) => t.scheduledAt === date) : [],
        events: filterType !== 'tasks' ? filteredEvents.filter((e) => e.scheduledAt === date) : [],
      }))
      .filter((day) => day.tasks.length > 0 || day.events.length > 0);
  }, [selectedDates, filteredTasks, filteredEvents, filterType]);

  function confirmDeleteTask(id: string, title: string) {
    showAppAlert('Eliminar tarea', `¿Eliminar "${title}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => void deleteRecord(id) },
    ]);
  }

  function confirmDeleteEvent(id: string, title: string) {
    showAppAlert('Eliminar evento', `¿Eliminar "${title}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => void deleteRecord(id) },
    ]);
  }

  async function handleRefresh() {
    setIsRefreshing(true);
    try {
      await refreshRecords();
    } finally {
      setIsRefreshing(false);
    }
  }

  if (focusedTask) {
    return (
      <ScreenSafeArea>
        <ScreenHeader title="Detalle de tarea" subtitle={focusedTask.title} />
        <ScrollView
          contentContainerClassName="w-full max-w-3xl gap-3 self-center px-6 pb-36 pt-4"
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor="#7C3AED"
              colors={['#7C3AED']}
            />
          }>
          <AgendaTaskCard
            task={focusedTask}
            defaultExpanded
            onToggle={() => toggleTaskComplete(focusedTask.id)}
            onDelete={() => confirmDeleteTask(focusedTask.id, focusedTask.title)}
            onPatch={patchRecord}
            onSave={refreshRecords}
          />
        </ScrollView>
      </ScreenSafeArea>
    );
  }

  if (focusedEvent) {
    return (
      <ScreenSafeArea>
        <ScreenHeader title="Detalle de evento" subtitle={focusedEvent.title} />
        <ScrollView
          contentContainerClassName="w-full max-w-3xl gap-3 self-center px-6 pb-36 pt-4"
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor="#7C3AED"
              colors={['#7C3AED']}
            />
          }>
          <AgendaEventCard
            event={focusedEvent}
            defaultExpanded
            onToggle={() => toggleEventComplete(focusedEvent.id)}
            onDelete={() => confirmDeleteEvent(focusedEvent.id, focusedEvent.title)}
            onPatch={patchRecord}
            onSave={refreshRecords}
          />
        </ScrollView>
      </ScreenSafeArea>
    );
  }

  const totalShown =
    (filterType !== 'events' ? filteredTasks.length : 0) +
    (filterType !== 'tasks' ? filteredEvents.length : 0);

  return (
    <ScreenSafeArea>
      <ScreenHeader
        title="Agenda"
        subtitle={`${formatSelectedDatesLabel(selectedDates)} · ${totalShown} ítems`}
        accent={accent}
      />
      <ScreenAccentBar accent={accent} />
      <ScrollView
        contentContainerClassName="w-full max-w-3xl gap-6 self-center px-6 pb-36 pt-4"
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={accent.main}
            colors={[accent.main]}
          />
        }>
        <AgendaCalendar
          selectedDates={selectedDates}
          markedDates={markedDates}
          onChange={onChange}
          accent={accent}
        />

        {/* Type filter */}
        <View className="flex-row gap-2">
          {(
            [
              { id: 'all', label: 'Todo', icon: 'list-outline' },
              { id: 'tasks', label: 'Tareas', icon: 'checkmark-circle-outline' },
              { id: 'events', label: 'Eventos', icon: 'calendar-outline' },
            ] as const
          ).map((f) => (
            <Pressable
              key={f.id}
              accessibilityRole="button"
              onPress={() => setFilterType(f.id)}
              className={`flex-1 flex-row items-center justify-center gap-1.5 rounded-xl border py-2.5 ${
                filterType === f.id
                  ? ''
                  : 'border-border bg-surface dark:border-border-dark dark:bg-surface-dark'
              }`}
              style={
                filterType === f.id
                  ? { borderColor: accent.main, backgroundColor: accent.soft }
                  : undefined
              }>
              <Ionicons
                name={f.icon}
                size={14}
                color={filterType === f.id ? accent.main : '#6B6475'}
              />
              <Text
                className={`text-sm font-semibold ${
                  filterType === f.id ? '' : 'text-subtle dark:text-subtle-dark'
                }`}
                style={filterType === f.id ? { color: accent.main } : undefined}>
                {f.label}
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
                onToggleEvent={toggleEventComplete}
                onDeleteTask={confirmDeleteTask}
                onDeleteEvent={confirmDeleteEvent}
                onPatch={patchRecord}
                onSaved={refreshRecords}
              />
            ))}
          </View>
        ) : (
          <View className="items-center gap-3 rounded-[28px] border border-dashed p-10" style={{ borderColor: accent.border }}>
            <Ionicons name="calendar-outline" size={40} color={accent.main} />
            <Text className="text-center text-subtle dark:text-subtle-dark">
              {selectedDates.length === 0
                ? 'Selecciona al menos un día en el calendario.'
                : selectedDates.length === 1
                  ? 'No hay nada en este día. Habla con Kivo para crear tareas o eventos.'
                  : 'No hay nada en estos días. Habla con Kivo para crear tareas o eventos.'}
            </Text>
          </View>
        )}
      </ScrollView>
    </ScreenSafeArea>
  );
}

type PatchFn = (id: string, payload: UpdateRecordPayload) => Promise<void>;

function DayGroup({
  label,
  tasks,
  events,
  onToggleTask,
  onToggleEvent,
  onDeleteTask,
  onDeleteEvent,
  onPatch,
  onSaved,
}: {
  label: string;
  tasks: TaskItem[];
  events: CalendarEvent[];
  onToggleTask: (taskId: string) => void;
  onToggleEvent: (eventId: string) => void;
  onDeleteTask: (taskId: string, title: string) => void;
  onDeleteEvent: (eventId: string, title: string) => void;
  onPatch: PatchFn;
  onSaved: () => void;
}) {
  return (
    <View className="gap-3">
      <Text className="text-lg font-semibold text-foreground dark:text-foreground-dark">
        {label}
      </Text>
      {events.map((event) => (
        <AgendaEventCard
          key={event.id}
          event={event}
          onToggle={() => onToggleEvent(event.id)}
          onDelete={() => onDeleteEvent(event.id, event.title)}
          onPatch={onPatch}
          onSave={onSaved}
        />
      ))}
      {tasks.map((task) => (
        <AgendaTaskCard
          key={task.id}
          task={task}
          onToggle={() => onToggleTask(task.id)}
          onDelete={() => onDeleteTask(task.id, task.title)}
          onPatch={onPatch}
          onSave={onSaved}
        />
      ))}
    </View>
  );
}

/* ─────────────────────────────────────── Shared icons ───────────────────────────────────── */

const EVENT_TYPE_ICONS = {
  meeting: 'people-outline',
  event: 'star-outline',
  reminder: 'notifications-outline',
} as const;

function CompletionCheckbox({
  checked,
  onToggle,
}: {
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      onPress={onToggle}
      className={`mt-4 h-6 w-6 items-center justify-center rounded-lg border-2 ${
        checked
          ? 'border-brand bg-brand dark:border-brand-dark dark:bg-brand-dark'
          : 'border-border dark:border-border-dark'
      }`}>
      {checked ? <Ionicons name="checkmark" size={14} color="#FFFFFF" /> : null}
    </Pressable>
  );
}

/* ─────────────────────────────────────── Event card ─────────────────────────────────────── */

function AgendaEventCard({
  event,
  defaultExpanded = false,
  onToggle,
  onDelete,
  onPatch,
  onSave,
}: {
  event: CalendarEvent;
  defaultExpanded?: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onPatch: PatchFn;
  onSave: () => void;
}) {
  const isCompleted = event.status === 'completed';
  const [editVisible, setEditVisible] = useState(false);

  return (
    <>
      <View className="flex-row items-start gap-2">
        <CompletionCheckbox checked={isCompleted} onToggle={onToggle} />

        <View className="flex-1">
          <ExpandableItemCard
            defaultExpanded={defaultExpanded}
            expandedContent={
              <View>
                <EventDetailsContent event={event} />
                <ChangeHistory recordId={event.id} />
                <View className="mt-3 flex-row gap-2">
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => setEditVisible(true)}
                    className="flex-1 flex-row items-center justify-center gap-2 rounded-xl bg-surface-soft py-2.5 dark:bg-surface-soft-dark">
                    <Ionicons name="pencil-outline" size={16} color="#7C3AED" />
                    <Text className="text-sm font-semibold text-brand dark:text-brand-dark">
                      Editar
                    </Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    onPress={onDelete}
                    className="flex-1 flex-row items-center justify-center gap-2 rounded-xl bg-surface-soft py-2.5 dark:bg-surface-soft-dark">
                    <Ionicons name="trash-outline" size={16} color="#EF4444" />
                    <Text className="text-sm font-semibold text-red-500">Eliminar</Text>
                  </Pressable>
                </View>
              </View>
            }>
            <View className="flex-row items-center gap-3">
              <View className="w-14 items-center">
                <Text
                  className={`text-sm font-bold ${
                    isCompleted
                      ? 'text-subtle line-through dark:text-subtle-dark'
                      : 'text-brand dark:text-brand-dark'
                  }`}>
                  {event.time.split(' ')[0]}
                </Text>
              </View>
              <View className="h-10 w-10 items-center justify-center rounded-xl bg-muted dark:bg-muted-dark">
                <Ionicons
                  name={EVENT_TYPE_ICONS[event.type as keyof typeof EVENT_TYPE_ICONS] ?? 'calendar-outline'}
                  size={20}
                  color="#7C3AED"
                />
              </View>
              <View className="flex-1 gap-0.5">
                <Text
                  className={`text-[15px] font-semibold ${
                    isCompleted
                      ? 'text-subtle line-through dark:text-subtle-dark'
                      : 'text-foreground dark:text-foreground-dark'
                  }`}>
                  {event.title}
                </Text>
                <Text className="text-xs text-subtle dark:text-subtle-dark">
                  {event.type === 'meeting' ? 'Reunión' : event.type === 'reminder' ? 'Recordatorio' : 'Evento'}
                  {isCompleted ? ' · Completado' : ''}
                </Text>
              </View>
            </View>
          </ExpandableItemCard>
        </View>
      </View>

      <EditEventModal
        visible={editVisible}
        event={event}
        onPatch={onPatch}
        onClose={() => setEditVisible(false)}
        onSaved={() => {
          setEditVisible(false);
          onSave();
        }}
      />
    </>
  );
}

/* ─────────────────────────────────────── Task card ─────────────────────────────────────── */

function AgendaTaskCard({
  task,
  onToggle,
  onDelete,
  onPatch,
  onSave,
  defaultExpanded = false,
}: {
  task: TaskItem;
  onToggle: () => void;
  onDelete: () => void;
  onPatch: PatchFn;
  onSave: () => void;
  defaultExpanded?: boolean;
}) {
  const isCompleted = task.status === 'completed';
  const [editVisible, setEditVisible] = useState(false);

  return (
    <>
      <View className="flex-row items-start gap-2">
        <CompletionCheckbox checked={isCompleted} onToggle={onToggle} />

        <View className="flex-1">
          <ExpandableItemCard
            defaultExpanded={defaultExpanded}
            expandedContent={
              <View>
                <TaskDetailsContent task={task} />
                <ChangeHistory recordId={task.id} />
                <View className="mt-3 flex-row gap-2">
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => setEditVisible(true)}
                    className="flex-1 flex-row items-center justify-center gap-2 rounded-xl bg-surface-soft py-2.5 dark:bg-surface-soft-dark">
                    <Ionicons name="pencil-outline" size={16} color="#7C3AED" />
                    <Text className="text-sm font-semibold text-brand dark:text-brand-dark">
                      Editar
                    </Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    onPress={onDelete}
                    className="flex-1 flex-row items-center justify-center gap-2 rounded-xl bg-surface-soft py-2.5 dark:bg-surface-soft-dark">
                    <Ionicons name="trash-outline" size={16} color="#EF4444" />
                    <Text className="text-sm font-semibold text-red-500">Eliminar</Text>
                  </Pressable>
                </View>
              </View>
            }>
            <View className="flex-row items-center gap-3">
              <View className="h-10 w-10 items-center justify-center rounded-xl bg-muted dark:bg-muted-dark">
                <Ionicons
                  name={getCategoryIcon(task.category) as never}
                  size={20}
                  color="#7C3AED"
                />
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
        </View>
      </View>

      <EditTaskModal
        visible={editVisible}
        task={task}
        onPatch={onPatch}
        onClose={() => setEditVisible(false)}
        onSaved={() => {
          setEditVisible(false);
          onSave();
        }}
      />
    </>
  );
}

/* ─────────────────────────────────────── Change history ─────────────────────────────────── */

function ChangeHistory({ recordId }: { recordId: string }) {
  const [history, setHistory] = useState<RecordChange[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const load = useCallback(async () => {
    if (loaded) return;
    setLoading(true);
    try {
      const data = await getRecordHistory(recordId);
      setHistory(data);
      setLoaded(true);
    } catch {
      // Silently ignore history errors
    } finally {
      setLoading(false);
    }
  }, [recordId, loaded]);

  function handleToggle() {
    if (!expanded && !loaded) void load();
    setExpanded((v) => !v);
  }

  if (!expanded && history.length === 0 && !loaded) {
    return (
      <Pressable
        accessibilityRole="button"
        onPress={handleToggle}
        className="mt-3 flex-row items-center gap-1.5">
        <Ionicons name="time-outline" size={14} color="#6B6475" />
        <Text className="text-xs text-subtle dark:text-subtle-dark">Ver historial de cambios</Text>
      </Pressable>
    );
  }

  return (
    <View className="mt-3">
      <Pressable
        accessibilityRole="button"
        onPress={handleToggle}
        className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-1.5">
          <Ionicons name="time-outline" size={14} color="#6B6475" />
          <Text className="text-xs font-semibold text-subtle dark:text-subtle-dark">
            Historial de cambios {history.length > 0 ? `(${history.length})` : ''}
          </Text>
        </View>
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={14} color="#6B6475" />
      </Pressable>

      {expanded ? (
        <View className="mt-2 gap-2">
          {loading ? (
            <Text className="text-xs text-subtle dark:text-subtle-dark">Cargando...</Text>
          ) : history.length === 0 ? (
            <Text className="text-xs text-subtle dark:text-subtle-dark">
              Sin historial de cambios.
            </Text>
          ) : (
            history.map((entry, idx) => (
              <View
                key={entry.id}
                className="rounded-xl border border-border bg-canvas p-3 dark:border-border-dark dark:bg-canvas-dark">
                <View className="flex-row items-start justify-between gap-2">
                  <View className="h-5 w-5 items-center justify-center rounded-full bg-brand dark:bg-brand-dark">
                    <Text className="text-[10px] font-bold text-white">{history.length - idx}</Text>
                  </View>
                  <Text className="flex-1 text-xs text-subtle dark:text-subtle-dark">
                    {new Date(entry.changed_at).toLocaleDateString('es', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
                {entry.change_note ? (
                  <Text className="mt-1 text-xs text-foreground dark:text-foreground-dark">
                    {entry.change_note}
                  </Text>
                ) : (
                  <Text className="mt-1 text-xs italic text-subtle dark:text-subtle-dark">
                    Sin nota de cambio
                  </Text>
                )}
              </View>
            ))
          )}
        </View>
      ) : null}
    </View>
  );
}

/* ─────────────────────────────────────── Shared options ─────────────────────────────────── */

const PRIORITY_OPTIONS: { value: Priority; label: string }[] = [
  { value: 'low', label: 'Baja' },
  { value: 'medium', label: 'Media' },
  { value: 'high', label: 'Alta' },
];

const EVENT_TYPE_OPTIONS: { value: RecordType; label: string; icon: string }[] = [
  { value: 'meeting', label: 'Reunión', icon: 'people-outline' },
  { value: 'reminder', label: 'Recordatorio', icon: 'notifications-outline' },
];

function DatePickerField({
  label,
  date,
  mode,
  onChange,
}: {
  label: string;
  date: Date;
  mode: 'date' | 'time' | 'datetime';
  onChange: (d: Date) => void;
}) {
  const [show, setShow] = useState(false);

  const formatted =
    mode === 'time'
      ? date.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })
      : date.toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <View className="gap-1.5">
      <Text className="text-sm font-semibold text-foreground dark:text-foreground-dark">
        {label}
      </Text>
      <Pressable
        accessibilityRole="button"
        onPress={() => setShow(true)}
        className="flex-row items-center gap-2 rounded-xl border border-border bg-surface px-4 py-3 dark:border-border-dark dark:bg-surface-dark">
        <Ionicons
          name={mode === 'time' ? 'time-outline' : 'calendar-outline'}
          size={16}
          color="#7C3AED"
        />
        <Text className="flex-1 text-sm text-foreground dark:text-foreground-dark">
          {formatted}
        </Text>
        <Ionicons name="chevron-down" size={14} color="#6B6475" />
      </Pressable>
      {show ? (
        <DateTimePicker
          value={date}
          mode={mode}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(_, selected) => {
            setShow(Platform.OS === 'ios');
            if (selected) onChange(selected);
          }}
        />
      ) : null}
    </View>
  );
}

function OptionPills<T extends string>({
  label,
  options,
  value,
  onSelect,
}: {
  label: string;
  options: { value: T; label: string; icon?: string }[];
  value: T;
  onSelect: (v: T) => void;
}) {
  return (
    <View className="gap-2">
      <Text className="text-sm font-semibold text-foreground dark:text-foreground-dark">
        {label}
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="flex-row gap-2">
          {options.map((opt) => (
            <Pressable
              key={opt.value}
              accessibilityRole="button"
              onPress={() => onSelect(opt.value)}
              className={`flex-row items-center gap-1.5 rounded-xl border px-3 py-2 ${
                value === opt.value
                  ? 'border-brand bg-surface-soft dark:border-brand-dark dark:bg-surface-soft-dark'
                  : 'border-border bg-surface dark:border-border-dark dark:bg-surface-dark'
              }`}>
              {opt.icon ? (
                <Ionicons
                  name={opt.icon as never}
                  size={14}
                  color={value === opt.value ? '#7C3AED' : '#6B6475'}
                />
              ) : null}
              <Text
                className={`text-sm font-semibold ${
                  value === opt.value
                    ? 'text-brand dark:text-brand-dark'
                    : 'text-subtle dark:text-subtle-dark'
                }`}>
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

/* ─────────────────────────────────────── EditTaskModal ─────────────────────────────────── */

function EditTaskModal({
  visible,
  task,
  onPatch,
  onClose,
  onSaved,
}: {
  visible: boolean;
  task: TaskItem;
  onPatch: PatchFn;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? '');
  const [priority, setPriority] = useState<Priority>((task.priority as Priority) ?? 'medium');
  const [category, setCategory] = useState(task.category ?? 'General');
  const [taskDate, setTaskDate] = useState(
    task.dueAtIso ? new Date(task.dueAtIso) : new Date(),
  );
  const [changeNote, setChangeNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Reset when task changes
  useEffect(() => {
    setTitle(task.title);
    setDescription(task.description ?? '');
    setPriority((task.priority as Priority) ?? 'medium');
    setCategory(task.category ?? 'General');
    setTaskDate(task.dueAtIso ? new Date(task.dueAtIso) : new Date());
    setChangeNote('');
  }, [task]);

  async function handleSave() {
    if (!title.trim()) return;
    setIsSaving(true);
    try {
      await onPatch(task.id, {
        title: title.trim(),
        description: description.trim() || null,
        priority,
        date: taskDate.toISOString(),
        data: { category },
        note: changeNote.trim() || null,
      });
      onSaved();
    } catch (error) {
      showAppAlert('No se pudo guardar', error instanceof Error ? error.message : 'Inténtalo de nuevo.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <ScreenSafeArea>
        <View className="flex-row items-center justify-between border-b border-border px-5 py-4 dark:border-border-dark">
          <Text className="text-lg font-bold text-foreground dark:text-foreground-dark">
            Editar tarea
          </Text>
          <Pressable accessibilityRole="button" onPress={onClose} className="p-2">
            <Ionicons name="close" size={24} color="#6B6475" />
          </Pressable>
        </View>

        <ScrollView contentContainerClassName="gap-5 p-5 pb-10">
          <Input label="Título" value={title} onChangeText={setTitle} autoCapitalize="sentences" />
          <Input
            label="Descripción (opcional)"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            autoCapitalize="sentences"
          />

          <OptionPills
            label="Prioridad"
            options={PRIORITY_OPTIONS}
            value={priority}
            onSelect={setPriority}
          />

          <OptionPills
            label="Categoría"
            options={CATEGORY_OPTIONS.map((c) => ({
              value: c,
              label: c,
              icon: getCategoryIcon(c),
            }))}
            value={category}
            onSelect={setCategory}
          />

          <DatePickerField
            label="Fecha de la tarea"
            date={taskDate}
            mode="date"
            onChange={setTaskDate}
          />

          <Input
            label="Nota del cambio (opcional)"
            placeholder="¿Por qué se modificó? Ej. Se adelantó la reunión"
            value={changeNote}
            onChangeText={setChangeNote}
            multiline
            numberOfLines={2}
            autoCapitalize="sentences"
          />

          <Button label={isSaving ? 'Guardando...' : 'Guardar cambios'} onPress={handleSave} />
        </ScrollView>
      </ScreenSafeArea>
    </Modal>
  );
}

/* ─────────────────────────────────────── EditEventModal ─────────────────────────────────── */

function EditEventModal({
  visible,
  event,
  onPatch,
  onClose,
  onSaved,
}: {
  visible: boolean;
  event: CalendarEvent;
  onPatch: PatchFn;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(event.title);
  const [description, setDescription] = useState(event.description ?? '');
  const [location, setLocation] = useState(event.location ?? '');
  const [eventType, setEventType] = useState<RecordType>(
    (event.type === 'meeting' ? 'meeting' : 'reminder') as RecordType,
  );
  const [eventDate, setEventDate] = useState(
    event.dueAtIso ? new Date(event.dueAtIso) : new Date(),
  );
  const [eventTime, setEventTime] = useState(
    event.dueAtIso ? new Date(event.dueAtIso) : new Date(),
  );
  const [changeNote, setChangeNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setTitle(event.title);
    setDescription(event.description ?? '');
    setLocation(event.location ?? '');
    setEventType((event.type === 'meeting' ? 'meeting' : 'reminder') as RecordType);
    const base = event.dueAtIso ? new Date(event.dueAtIso) : new Date();
    setEventDate(base);
    setEventTime(base);
    setChangeNote('');
  }, [event]);

  async function handleSave() {
    if (!title.trim()) return;
    setIsSaving(true);
    try {
      // Combine date + time into one ISO string
      const combined = new Date(eventDate);
      combined.setHours(eventTime.getHours(), eventTime.getMinutes(), 0, 0);

      await onPatch(event.id, {
        type: eventType,
        title: title.trim(),
        description: description.trim() || null,
        date: combined.toISOString(),
        data: { location: location.trim() || undefined },
        note: changeNote.trim() || null,
      });
      onSaved();
    } catch (error) {
      showAppAlert('No se pudo guardar', error instanceof Error ? error.message : 'Inténtalo de nuevo.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <ScreenSafeArea>
        <View className="flex-row items-center justify-between border-b border-border px-5 py-4 dark:border-border-dark">
          <Text className="text-lg font-bold text-foreground dark:text-foreground-dark">
            Editar evento
          </Text>
          <Pressable accessibilityRole="button" onPress={onClose} className="p-2">
            <Ionicons name="close" size={24} color="#6B6475" />
          </Pressable>
        </View>

        <ScrollView contentContainerClassName="gap-5 p-5 pb-10">
          <Input label="Título" value={title} onChangeText={setTitle} autoCapitalize="sentences" />
          <Input
            label="Descripción (opcional)"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            autoCapitalize="sentences"
          />

          <Input
            label="Ubicación (opcional)"
            value={location}
            onChangeText={setLocation}
            placeholder="Sala de reuniones, Zoom, etc."
            autoCapitalize="sentences"
          />

          <OptionPills
            label="Tipo de evento"
            options={EVENT_TYPE_OPTIONS}
            value={eventType}
            onSelect={setEventType}
          />

          <DatePickerField
            label="Fecha del evento"
            date={eventDate}
            mode="date"
            onChange={setEventDate}
          />

          <DatePickerField
            label="Hora del evento"
            date={eventTime}
            mode="time"
            onChange={setEventTime}
          />

          <Input
            label="Nota del cambio (opcional)"
            placeholder="¿Por qué se modificó? Ej. Se reprogramó por el cliente"
            value={changeNote}
            onChangeText={setChangeNote}
            multiline
            numberOfLines={2}
            autoCapitalize="sentences"
          />

          <Button label={isSaving ? 'Guardando...' : 'Guardar cambios'} onPress={handleSave} />
        </ScrollView>
      </ScreenSafeArea>
    </Modal>
  );
}
