import type { TaskItem } from '@/types/assistant';
import type { DateRange } from '@/utils/date-utils';
import { isDateInRange } from '@/utils/date-utils';

export function filterTasksByRange(tasks: TaskItem[], range: DateRange): TaskItem[] {
  return tasks.filter((task) => isDateInRange(task.scheduledAt, range));
}
