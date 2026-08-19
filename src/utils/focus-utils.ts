import type { CalendarEvent, Priority, TaskItem } from '@/types/assistant';
import { countOverdueItems, getMinutesUntilDue, getTaskTimeLabel } from '@/utils/agenda-utils';
import { todayIso } from '@/utils/date-utils';

export type FocusLaterItem = {
  id: string;
  title: string;
  subtitle: string;
  icon: 'videocam-outline' | 'document-text-outline' | 'color-palette-outline' | 'checkbox-outline';
  kind: 'task' | 'event';
  sortKey: string;
};

export type FocusDashboardKpi = {
  key: string;
  label: string;
  value: string;
  hint?: string;
};

export type FocusTimedBlock = {
  id: string;
  title: string;
  timeLabel: string;
  minutesUntil: number;
  durationMinutes: number;
  kind: 'task' | 'event';
};

export type FocusDayStats = {
  completedToday: number;
  totalToday: number;
  pendingToday: number;
  overdueCount: number;
  flexibleCount: number;
  flexibleEstimatedMinutes: number;
  openCount: number;
  hasTimedBlocks: boolean;
  freeMinutes: number | null;
  nextTimed: FocusTimedBlock | null;
  progressPercent: number;
  kpis: FocusDashboardKpi[];
  insight: string;
};

const DEFAULT_ESTIMATE: Record<Priority, number> = {
  high: 45,
  medium: 30,
  low: 15,
};

function parseTimeToMinutes(time?: string): number | null {
  if (!time) return null;
  const match = time.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

/** Short duration label — always lowercase m/h (never rely on CSS uppercase). */
export function formatMinutesShort(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (rest === 0) return `${hours}h`;
  return `${hours}h ${rest}m`;
}

function formatDueLabel(task: TaskItem): string {
  if (task.dueLabel) return task.dueLabel;
  const timeLabel = getTaskTimeLabel(task);
  if (timeLabel) return `Antes de las ${timeLabel}`;
  if (task.scheduledAt) return 'Hoy · sin hora fija';
  return 'Sin fecha · flexible';
}

function priorityLabel(priority: Priority): string {
  if (priority === 'high') return 'Prioridad Alta';
  if (priority === 'medium') return 'Prioridad Media';
  return 'Prioridad Baja';
}

function taskIcon(category: string): FocusLaterItem['icon'] {
  const normalized = category.toLowerCase();
  if (normalized.includes('diseño') || normalized.includes('brand') || normalized.includes('creativ')) {
    return 'color-palette-outline';
  }
  return 'document-text-outline';
}

function estimateTaskMinutes(task: TaskItem): number {
  if (task.estimatedMinutes && task.estimatedMinutes > 0) return task.estimatedMinutes;
  return DEFAULT_ESTIMATE[task.priority];
}

/** Events with a real clock time that block the calendar. */
export function getTimedEventsToday(
  events: CalendarEvent[],
  today = todayIso(),
): CalendarEvent[] {
  return events.filter((event) => {
    if (event.scheduledAt !== today) return false;
    if (event.status === 'completed') return false;
    const start = parseTimeToMinutes(event.time);
    return start != null;
  });
}

export function getGreetingLabel(date = new Date()): string {
  const hour = date.getHours();
  if (hour < 12) return 'Buenos días';
  if (hour < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

export function getTodayPendingTasks(tasks: TaskItem[], today = todayIso()): TaskItem[] {
  return tasks
    .filter((task) => {
      if (task.status !== 'pending') return false;
      if (!task.scheduledAt) return true; // open pending
      return task.scheduledAt === today; // day-only / dated → only that day
    })
    .sort((a, b) => {
      const priorityRank = { high: 0, medium: 1, low: 2 } as const;
      const byPriority = priorityRank[a.priority] - priorityRank[b.priority];
      if (byPriority !== 0) return byPriority;
      return (a.dueAtIso ?? a.title).localeCompare(b.dueAtIso ?? b.title);
    });
}

/**
 * First checklist task you can do in a gap (no clock time), then any pending.
 * Prefer this over priority-only “AHORA” heroes that ignore chronology.
 */
export function getFocusTask(
  tasks: TaskItem[],
  today = todayIso(),
  options?: { excludeIds?: string[] },
): TaskItem | null {
  const checklist = getFocusChecklistTasks(tasks, {
    today,
    excludeIds: options?.excludeIds,
    limit: 1,
  });
  if (checklist[0]) return checklist[0];

  const todayPending = getTodayPendingTasks(tasks, today);
  return (
    todayPending.find((task) => !getTaskTimeLabel(task)) ??
    todayPending[0] ??
    tasks.find((task) => task.status === 'pending' && !task.scheduledAt) ??
    null
  );
}

/** Flexible / day-only tasks suitable for Focus between timed blocks. */
export function getFocusChecklistTasks(
  tasks: TaskItem[],
  options?: {
    today?: string;
    excludeIds?: string[];
    limit?: number;
  },
): TaskItem[] {
  const today = options?.today ?? todayIso();
  const exclude = new Set(options?.excludeIds ?? []);
  const limit = options?.limit ?? 3;
  const priorityRank = { high: 0, medium: 1, low: 2 } as const;

  return getTodayPendingTasks(tasks, today)
    .filter((task) => {
      if (exclude.has(task.id)) return false;
      // Timed tasks belong on the chronological timeline, not the checklist.
      return getTaskTimeLabel(task) == null;
    })
    .sort((a, b) => {
      const byPriority = priorityRank[a.priority] - priorityRank[b.priority];
      if (byPriority !== 0) return byPriority;
      return a.title.localeCompare(b.title, 'es');
    })
    .slice(0, limit);
}

export function getFocusTaskDueLabel(task: TaskItem): string {
  return formatDueLabel(task);
}

export function getLaterItems(
  tasks: TaskItem[],
  events: CalendarEvent[],
  focusTaskId: string | null,
  today = todayIso(),
  limit = 3,
): FocusLaterItem[] {
  const eventItems: FocusLaterItem[] = events
    .filter((event) => event.scheduledAt === today && event.status === 'pending')
    .map((event) => ({
      id: event.id,
      title: event.title,
      subtitle: [
        event.time,
        event.source === 'device'
          ? event.calendarName || 'Calendario'
          : event.location || (event.type === 'meeting' ? 'Cita' : undefined),
      ]
        .filter(Boolean)
        .join(' • '),
      icon: event.type === 'meeting' || event.source === 'device' ? 'videocam-outline' : 'checkbox-outline',
      kind: 'event' as const,
      sortKey: `${String(parseTimeToMinutes(event.time) ?? 9999).padStart(4, '0')}-${event.id}`,
    }));

  const taskItems: FocusLaterItem[] = tasks
    .filter(
      (task) =>
        task.status === 'pending' &&
        task.scheduledAt === today &&
        task.id !== focusTaskId,
    )
    .map((task) => {
      const timePart = getTaskTimeLabel(task);

      return {
        id: task.id,
        title: task.title,
        subtitle: [timePart, priorityLabel(task.priority)].filter(Boolean).join(' • '),
        icon: taskIcon(task.category),
        kind: 'task' as const,
        sortKey: `${String(parseTimeToMinutes(timePart ?? undefined) ?? 9999).padStart(4, '0')}-${task.id}`,
      };
    });

  return [...eventItems, ...taskItems].sort((a, b) => a.sortKey.localeCompare(b.sortKey)).slice(0, limit);
}

/**
 * Free minutes left in a 09:00–18:00 window after today's timed blocks only.
 * Day-only tasks must never subtract from this number.
 */
export function estimateFreeMinutes(events: CalendarEvent[], today = todayIso()): number {
  const workStart = 9 * 60;
  const workEnd = 18 * 60;
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const windowStart = Math.max(workStart, nowMinutes);
  if (windowStart >= workEnd) return 0;

  const meetings = getTimedEventsToday(events, today)
    .map((event) => {
      const start = parseTimeToMinutes(event.time);
      if (start == null) return null;
      const endFromTime = parseTimeToMinutes(event.endTime);
      const end = endFromTime ?? start + (event.durationMinutes ?? 60);
      return { start, end: Math.max(end, start + 15) };
    })
    .filter((slot): slot is { start: number; end: number } => slot != null)
    .filter((slot) => slot.end > windowStart && slot.start < workEnd)
    .sort((a, b) => a.start - b.start);

  let free = 0;
  let cursor = windowStart;

  for (const meeting of meetings) {
    const meetingStart = Math.max(meeting.start, windowStart);
    if (meetingStart > cursor) {
      free += meetingStart - cursor;
    }
    cursor = Math.max(cursor, Math.min(meeting.end, workEnd));
  }

  if (cursor < workEnd) {
    free += workEnd - cursor;
  }

  return Math.max(0, free);
}

/**
 * Next upcoming clock-timed activity today: meetings/events AND tasks with explicit time.
 */
export function getNextTimedBlock(
  events: CalendarEvent[],
  today = todayIso(),
  now = new Date(),
  tasks: TaskItem[] = [],
): FocusTimedBlock | null {
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const nowMs = now.getTime();
  const fromEvents: FocusTimedBlock[] = [];
  const fromTasks: FocusTimedBlock[] = [];

  for (const event of getTimedEventsToday(events, today)) {
    const start = parseTimeToMinutes(event.time);
    const minutesUntil =
      getMinutesUntilDue(event, nowMs) ?? (start != null ? start - nowMinutes : null);
    if (minutesUntil == null || minutesUntil < 0) continue;
    const endFromTime = parseTimeToMinutes(event.endTime);
    fromEvents.push({
      id: event.id,
      title: event.title,
      timeLabel: event.endTime ? `${event.time}–${event.endTime}` : event.time,
      minutesUntil,
      durationMinutes:
        endFromTime != null && start != null
          ? Math.max(15, endFromTime - start)
          : (event.durationMinutes ?? 60),
      kind: 'event',
    });
  }

  for (const task of tasks) {
    if (task.status !== 'pending' || task.scheduledAt !== today) continue;
    const timeLabel = getTaskTimeLabel(task);
    if (!timeLabel) continue;
    const start = parseTimeToMinutes(timeLabel);
    const minutesUntil =
      getMinutesUntilDue(task, nowMs) ?? (start != null ? start - nowMinutes : null);
    if (minutesUntil == null || minutesUntil < 0) continue;
    fromTasks.push({
      id: task.id,
      title: task.title,
      timeLabel,
      minutesUntil,
      durationMinutes: estimateTaskMinutes(task),
      kind: 'task',
    });
  }

  return [...fromEvents, ...fromTasks].sort((a, b) => a.minutesUntil - b.minutesUntil)[0] ?? null;
}

export function getDayProgressPercent(tasks: TaskItem[], today = todayIso()): number {
  const todays = tasks.filter((task) => task.scheduledAt === today);
  if (todays.length === 0) return 0;
  const completed = todays.filter((task) => task.status === 'completed').length;
  return Math.round((completed / todays.length) * 100);
}

export function getOptimizedTimePercent(freeMinutes: number): number {
  const workdayMinutes = 9 * 60;
  const used = Math.max(0, workdayMinutes - freeMinutes);
  return Math.min(100, Math.round((used / workdayMinutes) * 100));
}

export function getAssistantSuggestion(
  freeMinutes: number,
  laterItems: FocusLaterItem[],
): { freeMinutes: number; actionText: string } {
  if (freeMinutes <= 0) {
    return {
      freeMinutes: 0,
      actionText: 'Tu agenda está llena. Prioriza lo urgente y deja el resto para después.',
    };
  }

  const nextItem = laterItems[0];
  if (nextItem) {
    return {
      freeMinutes,
      actionText: `Puedes avanzar ${nextItem.title.toLowerCase()}.`,
    };
  }

  return {
    freeMinutes,
    actionText: 'Úsalos para adelantar una tarea pendiente.',
  };
}

function buildInsight(
  stats: Omit<FocusDayStats, 'kpis' | 'insight'>,
  checklistTask: TaskItem | null,
): string {
  const { nextTimed, flexibleCount, openCount, pendingToday } = stats;

  if (nextTimed && nextTimed.minutesUntil <= 30) {
    return `Próxima actividad en ${formatMinutesShort(nextTimed.minutesUntil)} — Focus corto o posponer.`;
  }

  if (nextTimed && checklistTask) {
    return `${formatMinutesShort(nextTimed.minutesUntil)} hasta tu próxima actividad → ideal para Focus en “${checklistTask.title}”.`;
  }

  if (nextTimed) {
    return `Próxima actividad en ${formatMinutesShort(nextTimed.minutesUntil)} (${nextTimed.timeLabel}).`;
  }

  if (flexibleCount > 0 || openCount > 0) {
    const count = Math.max(flexibleCount, openCount);
    return `Sin citas con hora; ${count} ${count === 1 ? 'tarea pendiente' : 'tareas pendientes'} — elige una y enfoca.`;
  }

  if (pendingToday === 0) {
    return 'Nada pendiente por ahora. Buen momento para planear.';
  }

  return 'Revisa tu prioridad y arranca una sesión Focus.';
}

function buildKpis(stats: Omit<FocusDayStats, 'kpis' | 'insight'>): FocusDashboardKpi[] {
  return [
    {
      key: 'progress',
      label: 'Hoy',
      value: `${stats.completedToday}/${stats.totalToday}`,
      hint:
        stats.totalToday > 0
          ? `${stats.progressPercent}% hechas`
          : 'sin actividades',
    },
    {
      key: 'next',
      label: 'Próxima',
      value: stats.nextTimed
        ? stats.nextTimed.minutesUntil <= 0
          ? 'ahora'
          : formatMinutesShort(stats.nextTimed.minutesUntil)
        : '—',
      hint: stats.nextTimed ? stats.nextTimed.title : 'sin hora',
    },
  ];
}

/**
 * Tasks that count toward today's progress:
 * - dated for today (pending or completed)
 * - open pending (no date — shown under Hoy in the app)
 */
export function getTodayScopeTasks(tasks: TaskItem[], today = todayIso()): TaskItem[] {
  return tasks.filter((task) => {
    if (task.scheduledAt === today) return true;
    return task.status === 'pending' && !task.scheduledAt;
  });
}

/** Events scheduled for today (meetings, reminders, device calendar). */
export function getTodayScopeEvents(
  events: CalendarEvent[],
  today = todayIso(),
): CalendarEvent[] {
  return events.filter((event) => event.scheduledAt === today);
}

/** Dashboard snapshot for Focus KPIs and insight. */
export function buildFocusDayStats(
  tasks: TaskItem[],
  events: CalendarEvent[],
  today = todayIso(),
  checklistTask: TaskItem | null = null,
  now = new Date(),
): FocusDayStats {
  const timed = getTimedEventsToday(events, today);
  const hasTimedBlocks = timed.length > 0;
  const freeMinutes = hasTimedBlocks ? estimateFreeMinutes(events, today) : null;
  const nextTimed = getNextTimedBlock(events, today, now, tasks);

  const todayTasks = getTodayScopeTasks(tasks, today);
  const todayEvents = getTodayScopeEvents(events, today);

  const completedTasks = todayTasks.filter((task) => task.status === 'completed').length;
  const completedEvents = todayEvents.filter((event) => event.status === 'completed').length;
  const completedToday = completedTasks + completedEvents;
  const totalToday = todayTasks.length + todayEvents.length;

  const datedToday = tasks.filter((task) => task.scheduledAt === today);
  const pendingDatedToday = datedToday.filter((task) => task.status === 'pending');
  const openPending = tasks.filter((task) => task.status === 'pending' && !task.scheduledAt);

  const flexibleToday = [
    ...pendingDatedToday.filter((task) => !getTaskTimeLabel(task)),
    ...openPending,
  ];
  const flexibleCount = flexibleToday.length;
  const flexibleEstimatedMinutes = flexibleToday.reduce(
    (sum, task) => sum + estimateTaskMinutes(task),
    0,
  );

  const pendingToday = getTodayPendingTasks(tasks, today).length;
  const overdueCount = countOverdueItems(tasks, events, today);
  const progressPercent =
    totalToday === 0 ? 0 : Math.round((completedToday / totalToday) * 100);

  const base = {
    completedToday,
    totalToday,
    pendingToday,
    overdueCount,
    flexibleCount,
    flexibleEstimatedMinutes,
    openCount: openPending.length,
    hasTimedBlocks,
    freeMinutes,
    nextTimed,
    progressPercent,
  };

  return {
    ...base,
    kpis: buildKpis(base),
    insight: buildInsight(base, checklistTask),
  };
}
