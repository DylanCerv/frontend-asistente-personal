import type { CalendarEvent, TaskItem } from '@/types/assistant';
import type { MemoryRecord } from '@/types/record';
import {
  endOfWeek,
  isDateInRange,
  isDateSelected,
  startOfWeek,
  todayIso,
  type DateRange,
} from '@/utils/date-utils';

export type PendingTaskSummary = {
  id: string;
  title: string;
  priority: TaskItem['priority'];
  category: string;
  scheduledAt: string;
};

export type ProgressReport = {
  range: DateRange;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  progressPercent: number;
  highPriorityPending: number;
  mediumPriorityPending: number;
  lowPriorityPending: number;
  dueTodayPending: number;
  overduePending: number;
  completedInRange: number;
  upcomingEvents: number;
  eventsInRange: number;
  financeRecords: number;
  pendingTaskList: PendingTaskSummary[];
  completedTaskList: PendingTaskSummary[];
};

function taskDate(task: TaskItem): string {
  return task.scheduledAt?.slice(0, 10) ?? task.dueDate?.slice(0, 10) ?? '';
}

function eventDate(event: CalendarEvent): string {
  return event.scheduledAt?.slice(0, 10) ?? event.date?.slice(0, 10) ?? '';
}

function toSummary(task: TaskItem): PendingTaskSummary {
  return {
    id: task.id,
    title: task.title,
    priority: task.priority,
    category: task.category,
    scheduledAt: taskDate(task),
  };
}

export function buildProgressReport(
  tasks: TaskItem[],
  events: CalendarEvent[],
  records: MemoryRecord[],
  range?: DateRange,
  reference = todayIso(),
): ProgressReport {
  const activeRange = range ?? { start: startOfWeek(reference), end: endOfWeek(reference) };
  return buildProgressReportFromFiltered(
    tasks,
    events,
    records,
    activeRange,
    reference,
    (date) => isDateInRange(date, activeRange),
  );
}

export function buildProgressReportOnDates(
  tasks: TaskItem[],
  events: CalendarEvent[],
  records: MemoryRecord[],
  selectedDates: string[],
  reference = todayIso(),
): ProgressReport {
  const sortedDates = [...selectedDates].sort();
  const activeRange =
    sortedDates.length > 0
      ? { start: sortedDates[0], end: sortedDates[sortedDates.length - 1] }
      : { start: reference, end: reference };

  return buildProgressReportFromFiltered(
    tasks,
    events,
    records,
    activeRange,
    reference,
    (date) => isDateSelected(date, selectedDates),
  );
}

function buildProgressReportFromFiltered(
  tasks: TaskItem[],
  events: CalendarEvent[],
  records: MemoryRecord[],
  activeRange: DateRange,
  reference: string,
  matchesDate: (date: string) => boolean,
): ProgressReport {
  const tasksInRange = tasks.filter((task) => {
    const date = taskDate(task);
    return date ? matchesDate(date) : false;
  });

  const eventsInRange = events.filter((event) => {
    const date = eventDate(event);
    return date ? matchesDate(date) : false;
  });

  const completedTasks = tasksInRange.filter((task) => task.status === 'completed');
  const pendingTasks = tasksInRange.filter((task) => task.status === 'pending');
  const totalTasks = tasksInRange.length;
  const progressPercent =
    totalTasks === 0 ? 0 : Math.round((completedTasks.length / totalTasks) * 100);

  const allPending = tasks.filter((task) => task.status === 'pending');

  const dueTodayPending = allPending.filter((task) => taskDate(task) === reference).length;
  const overduePending = allPending.filter((task) => {
    const due = taskDate(task);
    return Boolean(due && due < reference);
  }).length;

  const upcomingEvents = events.filter((event) => {
    const day = eventDate(event);
    return Boolean(day && day >= reference);
  }).length;

  const financeRecords = records.filter((record) => {
    if (record.type !== 'expense' && record.type !== 'income') return false;
    const date = record.scheduledAt ?? record.createdAt?.slice(0, 10);
    return date ? matchesDate(date) : false;
  }).length;

  return {
    range: activeRange,
    totalTasks,
    completedTasks: completedTasks.length,
    pendingTasks: pendingTasks.length,
    progressPercent,
    highPriorityPending: pendingTasks.filter((task) => task.priority === 'high').length,
    mediumPriorityPending: pendingTasks.filter((task) => task.priority === 'medium').length,
    lowPriorityPending: pendingTasks.filter((task) => task.priority === 'low').length,
    dueTodayPending,
    overduePending,
    completedInRange: completedTasks.length,
    upcomingEvents,
    eventsInRange: eventsInRange.length,
    financeRecords,
    pendingTaskList: pendingTasks.map(toSummary),
    completedTaskList: completedTasks.map(toSummary),
  };
}
