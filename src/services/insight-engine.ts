import type { CalendarEvent, ReminderItem, TaskItem } from '@/types/assistant';
import type { MemoryRecord } from '@/types/record';
import type { InsightItem } from '@/types/insight';
import { buildSpendingWeekComparison } from '@/services/finance-analytics';
import { getDueTodayRecords } from '@/services/reminders/reminder-rules';
import { todayIso } from '@/utils/date-utils';

type BuildInsightsInput = {
  tasks: TaskItem[];
  events: CalendarEvent[];
  reminders: ReminderItem[];
  records: MemoryRecord[];
};

export function buildInsights({ tasks, events, reminders, records }: BuildInsightsInput): InsightItem[] {
  const insights: InsightItem[] = [];
  const today = todayIso();
  const dueToday = getDueTodayRecords(records, today);

  if (dueToday.length > 0 && insights.length < 4) {
    const focusRecord = dueToday[0];
    const isEvent = focusRecord?.type === 'meeting' || focusRecord?.type === 'reminder';

    insights.push({
      id: 'due-today',
      type: 'due_today',
      title:
        dueToday.length === 1
          ? 'Tienes 1 cosa pendiente para hoy.'
          : `Tienes ${dueToday.length} cosas pendientes para hoy.`,
      subtitle: focusRecord?.title,
      action: 'agenda',
      targetId: focusRecord?.id,
      targetKind: isEvent ? 'event' : 'task',
    });
  }

  const urgentToday = tasks.filter(
    (task) =>
      task.status === 'pending' &&
      task.priority === 'high' &&
      task.scheduledAt === today,
  );

  if (urgentToday.length > 0) {
    const focusTask = urgentToday[0];
    const label =
      urgentToday.length === 1
        ? 'Tienes 1 tarea urgente hoy.'
        : `Tienes ${urgentToday.length} tareas urgentes hoy.`;
    insights.push({
      id: 'urgent-tasks',
      type: 'urgent_tasks',
      title: label,
      subtitle: focusTask?.title,
      action: 'agenda',
      targetId: focusTask?.id,
      targetKind: 'task',
    });
  }

  const todayMeetings = events.filter(
    (event) => event.scheduledAt === today && event.type === 'meeting',
  );

  if (todayMeetings.length > 0) {
    const nextMeeting = todayMeetings[0];
    insights.push({
      id: `meeting-${nextMeeting.id}`,
      type: 'upcoming_meeting',
      title: `Tienes una reunión a las ${nextMeeting.time}.`,
      subtitle: nextMeeting.title,
      action: 'agenda',
      targetId: nextMeeting.id,
      targetKind: 'event',
    });
  }

  const spending = buildSpendingWeekComparison(records);
  if (spending.percentChange !== null && spending.previousWeekExpense > 0) {
    const direction = spending.percentChange > 0 ? 'más' : 'menos';
    const magnitude = Math.abs(spending.percentChange);
    insights.push({
      id: 'spending-week',
      type: 'spending_alert',
      title: `Gastaste un ${magnitude}% ${direction} que la semana pasada.`,
      action: 'finances',
    });
  }

  const topReminder = reminders[0];
  if (topReminder && insights.length < 4) {
    insights.push({
      id: `reminder-${topReminder.id}`,
      type: 'reminder',
      title: topReminder.title,
      subtitle: topReminder.timeLabel,
      action: 'agenda',
      targetId: topReminder.id,
      targetKind: 'task',
    });
  }

  const completedThisWeek = tasks.filter((task) => task.status === 'completed').length;
  if (completedThisWeek >= 3 && insights.length < 4) {
    insights.push({
      id: 'positive-week',
      type: 'positive',
      title: `Completaste ${completedThisWeek} tareas recientemente.`,
      subtitle: 'Buen ritmo, sigue así.',
      action: 'agenda',
    });
  }

  return insights.slice(0, 4);
}
