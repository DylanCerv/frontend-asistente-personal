import type { TaskItem } from '@/types/assistant';
import type { DateRange } from '@/utils/date-utils';
import { isDateInRange, isDateSelected } from '@/utils/date-utils';

export function filterTasksByRange(tasks: TaskItem[], range: DateRange): TaskItem[] {
  return tasks.filter((task) => isDateInRange(task.scheduledAt, range));
}

export function filterTasksByDates(tasks: TaskItem[], selectedDates: string[]): TaskItem[] {
  if (selectedDates.length === 0) return [];
  return tasks.filter((task) => isDateSelected(task.scheduledAt, selectedDates));
}
