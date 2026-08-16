import Ionicons from '@react-native-vector-icons/ionicons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  type AppStateStatus,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { ScreenSafeArea } from '@/components/screen-safe-area';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/text-input';
import { PRIORITY_LABELS } from '@/constants/labels';
import { CATEGORY_OPTIONS, getCategoryIcon } from '@/constants/categories';
import {
  APP_ACCENT,
  APP_BORDER,
  APP_DANGER,
  APP_ON_ACCENT,
  APP_SURFACE,
  APP_SURFACE_SOFT,
  APP_TEXT_MUTED,
} from '@/constants/app-colors';
import { useScreenAccent } from '@/constants/screen-themes';
import { AgendaCalendar, useAgendaCalendarState } from '@/components/agenda-calendar';
import { ExpandableItemCard } from '@/components/expandable-item-card';
import { EventDetailsContent, TaskDetailsContent } from '@/components/item-details';
import { ScreenHeader } from '@/components/screen-header';
import { TasksHeader } from '@/components/tasks-header';
import { useAssistant } from '@/context/assistant-context';
import { useAuth } from '@/context/auth-context';
import { useDeviceCalendar } from '@/context/device-calendar-context';
import { useUserPreferences } from '@/context/user-preferences-context';
import { showAppAlert } from '@/services/app-dialog';
import { buildProgressReportHtml, sharePdfReport } from '@/services/report-export';
import type { CalendarEvent, TaskItem } from '@/types/assistant';
import type { RecordChange, UpdateRecordPayload } from '@/types/record-api';
import type { RecordType } from '@/types/record';
import { getRecordHistory } from '@/services/records/records-api';

type Priority = NonNullable<UpdateRecordPayload['priority']>;
import {
  buildChronologicalAgendaItems,
  filterTasksByDates,
  getTaskSubtitle,
  getTaskTimeLabel,
  hasExplicitTimeFromIso,
  isEventTimePast,
  isExpiringSoon,
  isOpenPendingTask,
  isOverduePendingTask,
  isTaskTimePast,
} from '@/utils/agenda-utils';
import {
  daysFromNowIso,
  enumerateDates,
  formatSelectedDatesLabel,
  formatShortDate,
  getPresetRange,
  isDateSelected,
  relativeDayLabel,
  todayIso,
} from '@/utils/date-utils';

type FilterType = 'all' | 'tasks' | 'events';
type QuickRange = 'today' | 'tomorrow' | 'week';

export default function AgendaScreen() {
  const { taskId, eventId } = useLocalSearchParams<{ taskId?: string; eventId?: string }>();
  const focusTaskId = typeof taskId === 'string' ? taskId : undefined;
  const focusEventId = typeof eventId === 'string' ? eventId : undefined;

  const { user } = useAuth();
  const { preferredName } = useUserPreferences();
  const { tasks, events, toggleTaskComplete, toggleEventComplete, deleteRecord, patchRecord, refreshRecords } = useAssistant();
  const { deviceCalendarEvents, refreshDeviceCalendar } = useDeviceCalendar();
  const { selectedDates, onChange } = useAgendaCalendarState(todayIso());
  const accent = useScreenAccent('agenda');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  const setSelectedDates = useCallback(
    (dates: string[]) => {
      onChange(dates.length > 0 ? dates : [todayIso()]);
    },
    [onChange],
  );

  const weekDates = useMemo(() => enumerateDates(getPresetRange('week')), []);
  const weekRangeLabel = useMemo(() => {
    if (weekDates.length === 0) return '';
    return `${formatShortDate(weekDates[0])} – ${formatShortDate(weekDates[weekDates.length - 1])}`;
  }, [weekDates]);

  const activeQuickRange = useMemo((): QuickRange | null => {
    const today = todayIso();
    const tomorrow = daysFromNowIso(1);
    const sorted = [...selectedDates].sort();

    if (sorted.length === 1 && sorted[0] === today) return 'today';
    if (sorted.length === 1 && sorted[0] === tomorrow) return 'tomorrow';
    if (
      weekDates.length > 0 &&
      sorted.length === weekDates.length &&
      weekDates.every((day, index) => day === sorted[index])
    ) {
      return 'week';
    }
    return null;
  }, [selectedDates, weekDates]);

  const applyQuickRange = useCallback(
    (range: QuickRange) => {
      if (range === 'today') {
        setSelectedDates([todayIso()]);
        return;
      }
      if (range === 'tomorrow') {
        setSelectedDates([daysFromNowIso(1)]);
        return;
      }
      setSelectedDates(enumerateDates(getPresetRange('week')));
    },
    [setSelectedDates],
  );

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      const prevState = appStateRef.current;
      appStateRef.current = nextState;

      if (prevState === 'background' && nextState === 'active') {
        setSelectedDates([todayIso()]);
        setFilterType('all');
      }
    });

    return () => subscription.remove();
  }, [setSelectedDates]);

  const allEvents = useMemo(
    () => [...events, ...deviceCalendarEvents],
    [events, deviceCalendarEvents],
  );

  const focusedTask = useMemo(
    () => (focusTaskId ? tasks.find((t) => t.id === focusTaskId) : undefined),
    [focusTaskId, tasks],
  );
  const focusedEvent = useMemo(
    () => (focusEventId ? allEvents.find((e) => e.id === focusEventId) : undefined),
    [allEvents, focusEventId],
  );

  const filteredTasks = useMemo(
    () => filterTasksByDates(tasks, selectedDates),
    [tasks, selectedDates],
  );

  const filteredEvents = useMemo(
    () => allEvents.filter((event) => isDateSelected(event.scheduledAt, selectedDates)),
    [allEvents, selectedDates],
  );

  const markedDates = useMemo(() => {
    const dates = new Set<string>();
    if (filterType !== 'events') {
      for (const task of tasks) {
        if (task.scheduledAt) dates.add(task.scheduledAt);
      }
    }
    if (filterType !== 'tasks') {
      for (const event of allEvents) {
        if (event.scheduledAt) dates.add(event.scheduledAt);
      }
    }
    return Array.from(dates);
  }, [tasks, allEvents, filterType]);

  const groupedDays = useMemo(() => {
    const dates = [...selectedDates].sort().reverse();
    const today = todayIso();
    return dates
      .map((date) => {
        const dayTasks =
          filterType === 'events'
            ? []
            : filteredTasks.filter((t) => {
                if (t.scheduledAt === date) return true;
                // Open pending (no date) surface under Hoy only.
                if (date === today && t.status === 'pending' && !t.scheduledAt) return true;
                return false;
              });
        return {
          date,
          label: relativeDayLabel(date),
          tasks: dayTasks,
          events: filterType !== 'tasks' ? filteredEvents.filter((e) => e.scheduledAt === date) : [],
        };
      })
      .filter((day) => day.tasks.length > 0 || day.events.length > 0);
  }, [selectedDates, filteredTasks, filteredEvents, filterType]);

  function confirmDeleteTask(id: string, title: string) {
    showAppAlert('Eliminar tarea', `¿Eliminar "${title}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => void deleteRecord(id) },
    ]);
  }

  function confirmDeleteEvent(id: string, title: string) {
    if (id.startsWith('device-')) {
      showAppAlert(
        'Evento del calendario',
        'Este evento viene del calendario del teléfono. Ábrelo en la app de Calendario para editarlo o eliminarlo.',
      );
      return;
    }
    showAppAlert('Eliminar evento', `¿Eliminar "${title}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => void deleteRecord(id) },
    ]);
  }

  async function handleRefresh() {
    setIsRefreshing(true);
    try {
      await Promise.all([refreshRecords(), refreshDeviceCalendar(true)]);
    } finally {
      setIsRefreshing(false);
    }
  }

  async function handleDownloadReports() {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const periodLabel = formatSelectedDatesLabel(selectedDates);
      const displayName = preferredName.trim() || user?.name || 'Usuario';
      const html = buildProgressReportHtml({
        displayName,
        periodLabel,
        tasks: filteredTasks,
        events: filteredEvents,
      });
      await sharePdfReport(`Reporte ${periodLabel}`, html);
    } finally {
      setIsExporting(false);
    }
  }

  if (focusedTask) {
    return (
      <ScreenSafeArea edges={['top']}>
        <ScreenHeader title="Detalle de tarea" subtitle={focusedTask.title} />
        <ScrollView
          contentContainerClassName="w-full max-w-3xl gap-3 self-center px-5 pb-28 pt-4"
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={APP_ACCENT}
              colors={[APP_ACCENT]}
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
      <ScreenSafeArea edges={['top']}>
        <ScreenHeader title="Detalle de evento" subtitle={focusedEvent.title} />
        <ScrollView
          contentContainerClassName="w-full max-w-3xl gap-3 self-center px-5 pb-28 pt-4"
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={APP_ACCENT}
              colors={[APP_ACCENT]}
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

  return (
    <ScreenSafeArea edges={['top']}>
      <TasksHeader />

      <ScrollView
        contentContainerClassName="w-full max-w-3xl gap-4 self-center px-5 pb-28 pt-2"
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={APP_ACCENT}
            colors={[APP_ACCENT]}
          />
        }>
        <View className="flex-row items-center gap-2.5">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Descargar reportes"
            disabled={isExporting}
            onPress={() => void handleDownloadReports()}
            className="min-h-[52px] flex-1 flex-row items-center justify-center gap-2 rounded-2xl active:opacity-85"
            style={{ backgroundColor: APP_ACCENT, opacity: isExporting ? 0.7 : 1 }}>
            {isExporting ? (
              <ActivityIndicator size="small" color={APP_ON_ACCENT} />
            ) : (
              <Ionicons name="download-outline" size={18} color={APP_ON_ACCENT} />
            )}
            <Text className="text-[15px] font-bold" style={{ color: APP_ON_ACCENT }}>
              {isExporting ? 'Generando...' : 'Descargar Reportes'}
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Filtros"
            accessibilityState={{ selected: filtersVisible }}
            onPress={() => setFiltersVisible((prev) => !prev)}
            className="min-h-[52px] flex-row items-center justify-center gap-2 rounded-2xl border px-4 active:opacity-85"
            style={{
              borderColor: filtersVisible ? APP_ACCENT : APP_BORDER,
              backgroundColor: filtersVisible ? accent.soft : APP_SURFACE,
            }}>
            <Ionicons
              name={filtersVisible ? 'options' : 'options-outline'}
              size={18}
              color={filtersVisible ? APP_ACCENT : '#FFFFFF'}
            />
            <Text
              className="text-[14px] font-semibold"
              style={{ color: filtersVisible ? APP_ACCENT : '#FFFFFF' }}>
              Filtros
            </Text>
          </Pressable>
        </View>

        <View className="flex-row gap-2">
          {(
            [
              { id: 'today', label: 'Hoy', icon: 'today-outline' },
              { id: 'tomorrow', label: 'Mañana', icon: 'sunny-outline' },
              { id: 'week', label: 'Esta Semana', icon: 'calendar-outline' },
            ] as const
          ).map((option) => {
            const selected = activeQuickRange === option.id;
            const subtitle = option.id === 'week' ? weekRangeLabel : null;
            return (
              <Pressable
                key={option.id}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={
                  subtitle
                    ? `Ver tareas de ${option.label}, del ${subtitle}`
                    : `Ver tareas de ${option.label}`
                }
                onPress={() => applyQuickRange(option.id)}
                className={`min-w-0 flex-1 flex-row items-center justify-center gap-1.5 rounded-xl border px-1.5 py-2 active:opacity-85 ${
                  selected ? '' : 'border-border bg-surface dark:border-border-dark dark:bg-surface-dark'
                }`}
                style={
                  selected
                    ? { borderColor: accent.main, backgroundColor: accent.soft }
                    : undefined
                }>
                <Ionicons
                  name={option.icon}
                  size={14}
                  color={selected ? accent.main : APP_TEXT_MUTED}
                />
                <View className="min-w-0 items-center">
                  <Text
                    className={`text-[12px] font-semibold ${
                      selected ? '' : 'text-subtle dark:text-subtle-dark'
                    }`}
                    numberOfLines={1}
                    style={selected ? { color: accent.main } : undefined}>
                    {option.label}
                  </Text>
                  {subtitle ? (
                    <Text
                      className="text-[9px] font-medium"
                      numberOfLines={1}
                      style={{ color: selected ? accent.main : APP_TEXT_MUTED, opacity: 0.85 }}>
                      {subtitle}
                    </Text>
                  ) : null}
                </View>
              </Pressable>
            );
          })}
        </View>

        {filtersVisible ? (
          <View className="gap-4">
            <AgendaCalendar
              selectedDates={selectedDates}
              markedDates={markedDates}
              onChange={setSelectedDates}
              accent={accent}
            />

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
                    color={filterType === f.id ? accent.main : APP_TEXT_MUTED}
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
          </View>
        ) : null}

        {groupedDays.length > 0 ? (
          <View className="gap-3">
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
          <View
            className="items-center gap-3 rounded-[28px] border border-dashed p-10"
            style={{ borderColor: accent.border }}>
            <Ionicons name="checkbox-outline" size={40} color={APP_ACCENT} />
            <Text className="text-center text-subtle dark:text-subtle-dark">
              {selectedDates.length === 1 && selectedDates[0] === todayIso()
                ? 'No hay nada para hoy. Habla con Kivo para crear tareas.'
                : 'No hay nada en estos días. Habla con Kivo para crear tareas.'}
            </Text>
          </View>
        )}
      </ScrollView>
    </ScreenSafeArea>
  );
}

type PatchFn = (id: string, payload: UpdateRecordPayload) => Promise<void>;

function DayGroup({
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
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  const orderedItems = useMemo(
    () => buildChronologicalAgendaItems(events, tasks),
    [events, tasks],
  );

  return (
    <View className="gap-3">
      {orderedItems.map((item) =>
        item.kind === 'event' ? (
          <AgendaEventCard
            key={item.event.id}
            event={item.event}
            now={now}
            onToggle={() => onToggleEvent(item.event.id)}
            onDelete={() => onDeleteEvent(item.event.id, item.event.title)}
            onPatch={onPatch}
            onSave={onSaved}
          />
        ) : (
          <AgendaTaskCard
            key={item.task.id}
            task={item.task}
            now={now}
            onToggle={() => onToggleTask(item.task.id)}
            onDelete={() => onDeleteTask(item.task.id, item.task.title)}
            onPatch={onPatch}
            onSave={onSaved}
          />
        ),
      )}
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
      hitSlop={8}
      className="h-6 w-6 items-center justify-center rounded-lg border-2"
      style={{
        borderColor: checked ? APP_ACCENT : 'rgba(255,255,255,0.28)',
        backgroundColor: checked ? APP_ACCENT : 'transparent',
      }}>
      {checked ? <Ionicons name="checkmark" size={14} color={APP_ON_ACCENT} /> : null}
    </Pressable>
  );
}

/* ─────────────────────────────────────── Event card ─────────────────────────────────────── */

function AgendaEventCard({
  event,
  defaultExpanded = false,
  now = Date.now(),
  onToggle,
  onDelete,
  onPatch,
  onSave,
}: {
  event: CalendarEvent;
  defaultExpanded?: boolean;
  now?: number;
  onToggle: () => void;
  onDelete: () => void;
  onPatch: PatchFn;
  onSave: () => void;
}) {
  const isCompleted = event.status === 'completed';
  const isPast = !isCompleted && isEventTimePast(event, now);
  const isDeviceEvent = event.source === 'device' || event.readOnly === true;
  const [editVisible, setEditVisible] = useState(false);
  const titleColor = isCompleted || isPast ? APP_TEXT_MUTED : '#FFFFFF';
  const timeColor = isCompleted || isPast ? APP_TEXT_MUTED : APP_ACCENT;

  return (
    <>
      <View className="flex-row items-start gap-2" style={{ opacity: isPast ? 0.58 : 1 }}>
        {isDeviceEvent ? (
          <View className="h-6 w-6 items-center justify-center">
            <Ionicons name="phone-portrait-outline" size={16} color={APP_TEXT_MUTED} />
          </View>
        ) : (
          <CompletionCheckbox checked={isCompleted} onToggle={onToggle} />
        )}

        <View className="flex-1">
          <ExpandableItemCard
            defaultExpanded={defaultExpanded}
            expandedContent={
              <View>
                <EventDetailsContent event={event} />
                {!isDeviceEvent ? <ChangeHistory recordId={event.id} /> : null}
                {!isDeviceEvent ? (
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
                ) : (
                  <Text className="mt-3 text-xs leading-5 text-subtle dark:text-subtle-dark">
                    Solo lectura · viene del calendario del teléfono
                  </Text>
                )}
              </View>
            }>
            <View className="flex-row items-center gap-3">
              <View className="w-14 items-center">
                <Text
                  className={`text-sm font-bold ${isCompleted ? 'line-through' : ''}`}
                  style={{ color: timeColor }}>
                  {event.time.split(' ')[0]}
                </Text>
              </View>
              <View className="h-10 w-10 items-center justify-center rounded-xl bg-muted dark:bg-muted-dark">
                <Ionicons
                  name={
                    isDeviceEvent
                      ? 'calendar-outline'
                      : (EVENT_TYPE_ICONS[event.type as keyof typeof EVENT_TYPE_ICONS] ??
                        'calendar-outline')
                  }
                  size={20}
                  color={isPast ? APP_TEXT_MUTED : '#7C3AED'}
                />
              </View>
              <View className="flex-1 gap-0.5">
                <Text
                  className={`text-[15px] font-semibold ${isCompleted ? 'line-through' : ''}`}
                  style={{ color: titleColor }}>
                  {event.title}
                </Text>
                <Text className="text-xs" style={{ color: APP_TEXT_MUTED }}>
                  {isDeviceEvent
                    ? `Calendario${event.calendarName ? ` · ${event.calendarName}` : ''}`
                      : event.type === 'meeting'
                        ? 'Cita'
                        : event.type === 'reminder'
                          ? 'Aviso'
                          : 'Evento'}
                  {isCompleted ? ' · Completado' : isPast ? ' · Pasada' : ''}
                </Text>
              </View>
            </View>
          </ExpandableItemCard>
        </View>
      </View>

      {!isDeviceEvent ? (
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
      ) : null}
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
  now = Date.now(),
}: {
  task: TaskItem;
  onToggle: () => void;
  onDelete: () => void;
  onPatch: PatchFn;
  onSave: () => void;
  defaultExpanded?: boolean;
  now?: number;
}) {
  const isCompleted = task.status === 'completed';
  const isPast = !isCompleted && isTaskTimePast(task, now);
  const isOpen = !isCompleted && isOpenPendingTask(task);
  const isOverdue = !isCompleted && isOverduePendingTask(task);
  const urgent = !isPast && !isOpen && !isOverdue && isExpiringSoon(task, now);
  const timeLabel = getTaskTimeLabel(task);
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [editVisible, setEditVisible] = useState(false);

  return (
    <>
      <View
        className="overflow-hidden rounded-2xl border px-4 py-3.5"
        style={{
          backgroundColor: APP_SURFACE_SOFT,
          borderColor: urgent
            ? 'rgba(196,181,253,0.45)'
            : isPast
              ? 'rgba(255,255,255,0.04)'
              : 'rgba(255,255,255,0.06)',
          opacity: isPast ? 0.58 : 1,
          shadowColor: urgent ? APP_ACCENT : 'transparent',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: urgent ? 0.55 : 0,
          shadowRadius: urgent ? 14 : 0,
          elevation: urgent ? 8 : 0,
        }}>
        {urgent || timeLabel || isPast || isOpen || isOverdue ? (
          <View className="mb-2.5 flex-row items-center justify-between gap-2">
            {urgent ? (
              <View
                className="flex-row items-center gap-1 rounded-full px-2.5 py-1"
                style={{ backgroundColor: 'rgba(248,113,113,0.14)' }}>
                <Ionicons name="alert" size={11} color={APP_DANGER} />
                <Text
                  className="text-[10px] font-bold uppercase tracking-wide"
                  style={{ color: APP_DANGER }}>
                  Vence pronto
                </Text>
              </View>
            ) : isOverdue ? (
              <View
                className="flex-row items-center gap-1 rounded-full px-2.5 py-1"
                style={{ backgroundColor: 'rgba(248,113,113,0.14)' }}>
                <Ionicons name="hourglass-outline" size={11} color={APP_DANGER} />
                <Text
                  className="text-[10px] font-bold uppercase tracking-wide"
                  style={{ color: APP_DANGER }}>
                  Atrasada
                </Text>
              </View>
            ) : isOpen ? (
              <View
                className="flex-row items-center gap-1 rounded-full px-2.5 py-1"
                style={{ backgroundColor: 'rgba(196,181,253,0.14)' }}>
                <Ionicons name="ellipse-outline" size={11} color={APP_ACCENT} />
                <Text
                  className="text-[10px] font-bold uppercase tracking-wide"
                  style={{ color: APP_ACCENT }}>
                  Sin fecha
                </Text>
              </View>
            ) : isPast ? (
              <View
                className="flex-row items-center gap-1 rounded-full px-2.5 py-1"
                style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
                <Ionicons name="time-outline" size={11} color={APP_TEXT_MUTED} />
                <Text
                  className="text-[10px] font-bold uppercase tracking-wide"
                  style={{ color: APP_TEXT_MUTED }}>
                  Pasada
                </Text>
              </View>
            ) : (
              <View />
            )}
            {timeLabel ? (
              <Text className="text-xs font-medium" style={{ color: APP_TEXT_MUTED }}>
                {timeLabel}
              </Text>
            ) : null}
          </View>
        ) : null}

        <View className="flex-row items-start gap-3">
          <View className="pt-0.5">
            <CompletionCheckbox checked={isCompleted} onToggle={onToggle} />
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded }}
            onPress={() => setExpanded((prev) => !prev)}
            className="min-w-0 flex-1 active:opacity-90">
            <View className="gap-0.5">
              <Text
                className={`text-[15px] font-semibold ${isCompleted ? 'line-through' : ''}`}
                style={{ color: isCompleted || isPast ? APP_TEXT_MUTED : '#FFFFFF' }}
                numberOfLines={2}>
                {task.title}
              </Text>
              <Text className="text-[12px]" style={{ color: APP_TEXT_MUTED }}>
                {getTaskSubtitle(task)}
                {isPast && !isCompleted ? ' · Pasada' : ''}
              </Text>
            </View>
          </Pressable>
        </View>

        {expanded ? (
          <View className="mt-3 gap-3 border-t border-border pt-3 dark:border-border-dark">
            <TaskDetailsContent task={task} />
            <ChangeHistory recordId={task.id} />
            <View className="flex-row gap-2">
              <Pressable
                accessibilityRole="button"
                onPress={() => setEditVisible(true)}
                className="flex-1 flex-row items-center justify-center gap-2 rounded-xl bg-surface py-2.5 dark:bg-surface-dark">
                <Ionicons name="pencil-outline" size={16} color={APP_ACCENT} />
                <Text className="text-sm font-semibold" style={{ color: APP_ACCENT }}>
                  Editar
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={onDelete}
                className="flex-1 flex-row items-center justify-center gap-2 rounded-xl bg-surface py-2.5 dark:bg-surface-dark">
                <Ionicons name="trash-outline" size={16} color="#EF4444" />
                <Text className="text-sm font-semibold text-red-500">Eliminar</Text>
              </Pressable>
            </View>
          </View>
        ) : null}
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
  { value: 'meeting', label: 'Cita', icon: 'people-outline' },
  { value: 'reminder', label: 'Aviso', icon: 'notifications-outline' },
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
  const [taskTime, setTaskTime] = useState(
    task.dueAtIso ? new Date(task.dueAtIso) : new Date(),
  );
  const [changeNote, setChangeNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const hasExplicitTime = Boolean(
    (task.time && task.time !== 'Sin hora') ||
      (task.dueAtIso && hasExplicitTimeFromIso(task.dueAtIso)),
  );

  // Reset when task changes
  useEffect(() => {
    setTitle(task.title);
    setDescription(task.description ?? '');
    setPriority((task.priority as Priority) ?? 'medium');
    setCategory(task.category ?? 'General');
    const base = task.dueAtIso ? new Date(task.dueAtIso) : new Date();
    setTaskDate(base);
    setTaskTime(base);
    setChangeNote('');
  }, [task]);

  async function handleSave() {
    if (!title.trim()) return;
    setIsSaving(true);
    try {
      // Only merge clock time when the task already had an explicit time.
      // Undated / day-only tasks keep the previous date-only save path.
      let nextDate: string;
      if (hasExplicitTime) {
        const combined = new Date(taskDate);
        combined.setHours(taskTime.getHours(), taskTime.getMinutes(), 0, 0);
        nextDate = combined.toISOString();
      } else {
        nextDate = taskDate.toISOString();
      }

      await onPatch(task.id, {
        title: title.trim(),
        description: description.trim() || null,
        priority,
        date: nextDate,
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

          {hasExplicitTime ? (
            <DatePickerField
              label="Hora de la tarea"
              date={taskTime}
              mode="time"
              onChange={setTaskTime}
            />
          ) : null}

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
