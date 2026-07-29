import type { CalendarEvent, Priority, TaskItem } from '@/types/assistant';
import { todayIso } from '@/utils/date-utils';

export type FocusLaterItem = {
  id: string;
  title: string;
  subtitle: string;
  icon: 'videocam-outline' | 'document-text-outline' | 'color-palette-outline' | 'checkbox-outline';
  kind: 'task' | 'event';
  sortKey: string;
};

function parseTimeToMinutes(time?: string): number | null {
  if (!time) return null;
  const match = time.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

function formatDueLabel(task: TaskItem): string {
  if (task.dueLabel) return task.dueLabel;
  if (task.dueAtIso) {
    const date = new Date(task.dueAtIso);
    if (!Number.isNaN(date.getTime())) {
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `Antes de las ${hours}:${minutes}`;
    }
  }
  return 'Sin hora definida';
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

export function getFocusTask(tasks: TaskItem[], today = todayIso()): TaskItem | null {
  const todayPending = getTodayPendingTasks(tasks, today);
  return (
    todayPending.find((task) => task.priority === 'high') ??
    todayPending[0] ??
    tasks.find((task) => task.status === 'pending' && task.priority === 'high') ??
    null
  );
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
      const timePart = task.dueAtIso
        ? (() => {
            const date = new Date(task.dueAtIso);
            if (Number.isNaN(date.getTime())) return null;
            return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
          })()
        : null;

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

/** Rough free minutes left in a 09:00–18:00 work window after today's meetings. */
export function estimateFreeMinutes(events: CalendarEvent[], today = todayIso()): number {
  const workStart = 9 * 60;
  const workEnd = 18 * 60;
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const windowStart = Math.max(workStart, nowMinutes);
  if (windowStart >= workEnd) return 0;

  const meetings = events
    .filter((event) => event.scheduledAt === today && (event.type === 'meeting' || event.source === 'device'))
    .map((event) => {
      const start = parseTimeToMinutes(event.time) ?? workStart;
      const endFromTime = parseTimeToMinutes(event.endTime);
      const end = endFromTime ?? start + (event.durationMinutes ?? 60);
      return { start, end: Math.max(end, start + 15) };
    })
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
