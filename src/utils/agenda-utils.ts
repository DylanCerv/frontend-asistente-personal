import type { TaskItem } from '@/types/assistant';
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
  return tasks.filter((task) => isDateInRange(task.scheduledAt, range));
}

export function filterTasksByDates(tasks: TaskItem[], selectedDates: string[]): TaskItem[] {
  if (selectedDates.length === 0) return [];
  return tasks.filter((task) => isDateSelected(task.scheduledAt, selectedDates));
}

/** Pending tasks that are overdue or high-priority due today. */
export function isExpiringSoon(task: TaskItem): boolean {
  if (task.status === 'completed') return false;
  const today = todayIso();
  if (task.scheduledAt < today) return true;
  return task.scheduledAt === today && task.priority === 'high';
}

export function getTaskTimeLabel(task: TaskItem): string | null {
  if (!task.dueAtIso) return null;
  const label = formatTimeLabel(task.dueAtIso);
  return label || null;
}

export function getTaskSubtitle(task: TaskItem): string {
  const dayLabel = isToday(task.scheduledAt)
    ? 'Hoy'
    : isTomorrow(task.scheduledAt)
      ? 'Mañana'
      : formatShortDate(task.scheduledAt);
  return `${dayLabel} • ${task.category}`;
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
