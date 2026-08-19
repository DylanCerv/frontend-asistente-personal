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

const APPROACHING_WINDOW_MINUTES = 60;

type ClockTimedItem = {
  status?: 'pending' | 'completed';
  scheduledAt?: string;
  dueAtIso?: string;
  time?: string;
};

function parseClockTime(time: string): { hours: number; minutes: number } | null {
  const match = time.trim().match(/^(\d{1,2}):(\d{2})/);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return { hours, minutes };
}

/** Epoch ms for an item with a real clock time. Soft day-only defaults return null. */
export function getExplicitDueMs(item: ClockTimedItem): number | null {
  if (item.dueAtIso && hasExplicitTimeFromIso(item.dueAtIso)) {
    const dueMs = new Date(item.dueAtIso).getTime();
    if (!Number.isNaN(dueMs)) return dueMs;
  }

  if (!item.scheduledAt || !item.time) return null;
  const clock = parseClockTime(item.time);
  if (!clock) return null;
  if (clock.minutes === 0 && (clock.hours === 0 || clock.hours === 5)) return null;

  const [year, month, day] = item.scheduledAt.split('-').map(Number);
  if (!year || !month || !day) return null;
  const due = new Date(year, month - 1, day, clock.hours, clock.minutes, 0, 0);
  return Number.isNaN(due.getTime()) ? null : due.getTime();
}

/** Whole minutes remaining until due. Null if untimed or already past. */
export function getMinutesUntilDue(item: ClockTimedItem, now = Date.now()): number | null {
  const dueMs = getExplicitDueMs(item);
  if (dueMs == null) return null;
  const remainingMs = dueMs - now;
  if (remainingMs < 0) return null;
  return Math.ceil(remainingMs / 60_000);
}

export function formatApproachingBadge(minutesUntil: number): string {
  if (minutesUntil <= 0) return 'Ahora';
  return `En ${minutesUntil}m`;
}

/** Pending item whose clock time is within the next hour — task, meeting, reminder, etc. */
export function isExpiringSoon(item: ClockTimedItem, now = Date.now()): boolean {
  if (item.status === 'completed') return false;
  if (!item.scheduledAt || item.scheduledAt !== todayIso()) return false;
  const minutesUntil = getMinutesUntilDue(item, now);
  return minutesUntil != null && minutesUntil <= APPROACHING_WINDOW_MINUTES;
}

export function unionById<T extends { id: string }>(items: T[], extra: T[]): T[] {
  if (extra.length === 0) return items;
  const seen = new Set(items.map((item) => item.id));
  const merged = [...items];
  for (const item of extra) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    merged.push(item);
  }
  return merged;
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
  const implicitHours = new Set([0, 5]);
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
    return `Pendiente · ${task.category}${task.project ? ` · ${task.project}` : ''}`;
  }
  const dayLabel = isToday(task.scheduledAt)
    ? 'Hoy'
    : isTomorrow(task.scheduledAt)
      ? 'Mañana'
      : formatShortDate(task.scheduledAt);
  const projectPart = task.project ? ` · ${task.project}` : '';
  return `${dayLabel} • ${task.category}${projectPart}`;
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

/** Pending Kivo event whose calendar day already passed. Device events are excluded. */
export function isOverduePendingEvent(event: CalendarEvent, today = todayIso()): boolean {
  if (event.source === 'device' || event.readOnly === true) return false;
  return Boolean(event.status === 'pending' && event.scheduledAt && event.scheduledAt < today);
}

export function countOverdueItems(
  tasks: TaskItem[],
  events: CalendarEvent[],
  today = todayIso(),
): number {
  let count = 0;
  for (const task of tasks) {
    if (isOverduePendingTask(task, today)) count += 1;
  }
  for (const event of events) {
    if (isOverduePendingEvent(event, today)) count += 1;
  }
  return count;
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
      // Day-only soft defaults (05:00 / 00:00) are not "past by clock".
      const parsed = new Date(item.dueAtIso);
      const implicitHours = new Set([0, 5]);
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

type AgendaSortEntry = {
  approaching?: boolean;
  completed: boolean;
  sortAt: number;
  title: string;
};

/** Approaching first, then pending, then completed; chronological within each group. */
function compareAgendaEntries(a: AgendaSortEntry, b: AgendaSortEntry): number {
  const aSoon = a.approaching === true;
  const bSoon = b.approaching === true;
  if (aSoon !== bSoon) return aSoon ? -1 : 1;
  if (a.completed !== b.completed) return a.completed ? 1 : -1;
  if (a.sortAt !== b.sortAt) return a.sortAt - b.sortAt;
  return a.title.localeCompare(b.title, 'es');
}

/** Pending first, then completed; chronological within each group. */
export function sortAgendaTasks(tasks: TaskItem[]): TaskItem[] {
  return [...tasks].sort((a, b) =>
    compareAgendaEntries(
      { completed: a.status === 'completed', sortAt: scheduleSortKey(a), title: a.title },
      { completed: b.status === 'completed', sortAt: scheduleSortKey(b), title: b.title },
    ),
  );
}

export function sortAgendaEvents(events: CalendarEvent[]): CalendarEvent[] {
  return [...events].sort((a, b) =>
    compareAgendaEntries(
      { completed: a.status === 'completed', sortAt: scheduleSortKey(a), title: a.title },
      { completed: b.status === 'completed', sortAt: scheduleSortKey(b), title: b.title },
    ),
  );
}

type AgendaListItem =
  | { kind: 'event'; sortAt: number; event: CalendarEvent }
  | { kind: 'task'; sortAt: number; task: TaskItem };

/** Merge events + tasks: approaching first, then pending, then completed. */
export function buildChronologicalAgendaItems(
  events: CalendarEvent[],
  tasks: TaskItem[],
  now = Date.now(),
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

  return items.sort((a, b) =>
    compareAgendaEntries(
      {
        approaching: a.kind === 'event' ? isExpiringSoon(a.event, now) : isExpiringSoon(a.task, now),
        completed: a.kind === 'event' ? a.event.status === 'completed' : a.task.status === 'completed',
        sortAt: a.sortAt,
        title: a.kind === 'event' ? a.event.title : a.task.title,
      },
      {
        approaching: b.kind === 'event' ? isExpiringSoon(b.event, now) : isExpiringSoon(b.task, now),
        completed: b.kind === 'event' ? b.event.status === 'completed' : b.task.status === 'completed',
        sortAt: b.sortAt,
        title: b.kind === 'event' ? b.event.title : b.task.title,
      },
    ),
  );
}
