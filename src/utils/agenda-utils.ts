import type { CalendarEvent, TaskItem } from '@/types/assistant';
import type { DateRange } from '@/utils/date-utils';
import {
  formatShortDate,
  isDateInRange,
  isDateSelected,
  isToday,
  isTomorrow,
  todayIso,
} from '@/utils/date-utils';
import { formatTimeLabel } from '@/utils/record-mappers';

export function filterTasksByRange(tasks: TaskItem[], range: DateRange): TaskItem[] {
  return tasks.filter(
    (task) => task.scheduledAt != null && isDateInRange(task.scheduledAt, range),
  );
}

export function filterTasksByDates(tasks: TaskItem[], selectedDates: string[]): TaskItem[] {
  if (selectedDates.length === 0) return [];
  const today = todayIso();
  const includesToday = selectedDates.includes(today);

  return tasks.filter((task) => {
    if (task.scheduledAt && isDateSelected(task.scheduledAt, selectedDates)) return true;
    // Open (no date) hang under Hoy until completed. Day-only stay on their day only.
    if (includesToday && task.status === 'pending' && !task.scheduledAt) return true;
    return false;
  });
}

/** Pending tasks whose clock time is within the next hour (not all high-priority today). */
export function isExpiringSoon(task: TaskItem, now = Date.now()): boolean {
  if (task.status === 'completed') return false;
  if (!task.scheduledAt) return false;
  if (isScheduledTimePast({ dueAtIso: task.dueAtIso, scheduledAt: task.scheduledAt }, now)) {
    return false;
  }

  const today = todayIso();
  // Past calendar days stay under "Atrasada", not this badge.
  if (task.scheduledAt < today) return false;
  if (task.scheduledAt !== today) return false;

  if (!task.dueAtIso || !hasExplicitTimeFromIso(task.dueAtIso)) return false;

  const dueMs = new Date(task.dueAtIso).getTime();
  if (Number.isNaN(dueMs)) return false;

  const minutesUntil = (dueMs - now) / 60_000;
  return minutesUntil >= 0 && minutesUntil <= 60;
}

export function getTaskTimeLabel(task: TaskItem): string | null {
  if (!task.dueAtIso) return null;
  // Hide soft-day / day-only defaults — they are not a real clock time from the user.
  if (!hasExplicitTimeFromIso(task.dueAtIso)) return null;
  const label = formatTimeLabel(task.dueAtIso);
  return label || null;
}

export function hasExplicitTimeFromIso(iso: string): boolean {
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso.trim())) return false;
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return false;
  const implicitHours = new Set([0, 5, 9]);
  if (
    parsed.getMinutes() === 0 &&
    parsed.getSeconds() === 0 &&
    implicitHours.has(parsed.getHours())
  ) {
    return false;
  }
  return true;
}

export function getTaskSubtitle(task: TaskItem): string {
  if (task.status === 'completed' && task.completedAt) {
    const completedDay = task.completedAt.slice(0, 10);
    const dayLabel = isToday(completedDay)
      ? 'Hoy'
      : isTomorrow(completedDay)
        ? 'Mañana'
        : formatShortDate(completedDay);
    return `Completada · ${dayLabel} · ${task.category}`;
  }

  if (!task.scheduledAt) {
    return `Pendiente · ${task.category}`;
  }
  const dayLabel = isToday(task.scheduledAt)
    ? 'Hoy'
    : isTomorrow(task.scheduledAt)
      ? 'Mañana'
      : formatShortDate(task.scheduledAt);
  return `${dayLabel} • ${task.category}`;
}

/** Undated open tasks — stay active until completed manually. */
export function isOpenPendingTask(task: TaskItem): boolean {
  return task.status === 'pending' && !task.scheduledAt;
}

/** Day was set and already passed, still pending. */
export function isOverduePendingTask(task: TaskItem, today = todayIso()): boolean {
  return Boolean(
    task.status === 'pending' && task.scheduledAt && task.scheduledAt < today,
  );
}

export function filterTasksByQuery(tasks: TaskItem[], query: string): TaskItem[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return tasks;
  return tasks.filter(
    (task) =>
      task.title.toLowerCase().includes(normalized) ||
      task.category.toLowerCase().includes(normalized) ||
      (task.description?.toLowerCase().includes(normalized) ?? false),
  );
}

type TimedItem = {
  dueAtIso?: string;
  scheduledAt?: string;
};

/** True when the item's scheduled moment is already behind the current time. */
export function isScheduledTimePast(item: TimedItem, now = Date.now()): boolean {
  if (item.dueAtIso) {
    const timestamp = new Date(item.dueAtIso).getTime();
    if (!Number.isNaN(timestamp)) {
      // Day-only soft defaults (05:00 / 09:00 / 00:00) are not "past by clock".
      const parsed = new Date(item.dueAtIso);
      const implicitHours = new Set([0, 5, 9]);
      const isSoftDay =
        parsed.getMinutes() === 0 &&
        parsed.getSeconds() === 0 &&
        implicitHours.has(parsed.getHours());
      if (!isSoftDay) return timestamp < now;
    }
  }

  // Date-only / soft-day items become "atrasada" after the calendar day ends.
  return Boolean(item.scheduledAt && item.scheduledAt < todayIso());
}

export function isTaskTimePast(task: TaskItem, now = Date.now()): boolean {
  return isScheduledTimePast(
    { dueAtIso: task.dueAtIso, scheduledAt: task.scheduledAt },
    now,
  );
}

export function isEventTimePast(event: CalendarEvent, now = Date.now()): boolean {
  return isScheduledTimePast(
    { dueAtIso: event.dueAtIso, scheduledAt: event.scheduledAt },
    now,
  );
}

function scheduleSortKey(item: TimedItem): number {
  if (item.dueAtIso) {
    const timestamp = new Date(item.dueAtIso).getTime();
    if (!Number.isNaN(timestamp)) return timestamp;
  }
  // Date-only items sort after timed ones on the same day, then by title later.
  if (item.scheduledAt) {
    const dayStart = new Date(`${item.scheduledAt}T23:59:59`).getTime();
    if (!Number.isNaN(dayStart)) return dayStart;
  }
  return Number.POSITIVE_INFINITY;
}

/** Strict chronological order by scheduled time. */
export function sortAgendaTasks(tasks: TaskItem[]): TaskItem[] {
  return [...tasks].sort((a, b) => {
    const byTime = scheduleSortKey(a) - scheduleSortKey(b);
    if (byTime !== 0) return byTime;
    return a.title.localeCompare(b.title, 'es');
  });
}

export function sortAgendaEvents(events: CalendarEvent[]): CalendarEvent[] {
  return [...events].sort((a, b) => {
    const byTime = scheduleSortKey(a) - scheduleSortKey(b);
    if (byTime !== 0) return byTime;
    return a.title.localeCompare(b.title, 'es');
  });
}

type AgendaListItem =
  | { kind: 'event'; sortAt: number; event: CalendarEvent }
  | { kind: 'task'; sortAt: number; task: TaskItem };

/** Merge events + tasks into one chronological timeline. */
export function buildChronologicalAgendaItems(
  events: CalendarEvent[],
  tasks: TaskItem[],
): AgendaListItem[] {
  const items: AgendaListItem[] = [
    ...events.map((event) => ({
      kind: 'event' as const,
      sortAt: scheduleSortKey(event),
      event,
    })),
    ...tasks.map((task) => ({
      kind: 'task' as const,
      sortAt: scheduleSortKey(task),
      task,
    })),
  ];

  return items.sort((a, b) => {
    if (a.sortAt !== b.sortAt) return a.sortAt - b.sortAt;
    const aTitle = a.kind === 'event' ? a.event.title : a.task.title;
    const bTitle = b.kind === 'event' ? b.event.title : b.task.title;
    return aTitle.localeCompare(bTitle, 'es');
  });
}
