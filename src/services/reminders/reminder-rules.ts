import type { Priority } from '@/types/assistant';
import type { MemoryRecord } from '@/types/record';
import { todayIso } from '@/utils/date-utils';

export type ReminderAlertLevel = 'alarm' | 'notification';

export type ReminderNotificationKind = 'critical' | 'reminder' | 'daily-summary';

export type ReminderScheduleItem = {
  id: string;
  recordId: string;
  triggerAt: Date;
  title: string;
  body: string;
  alertLevel: ReminderAlertLevel;
  kind: ReminderNotificationKind;
};

const DAY_OFFSETS_BY_PRIORITY: Record<Priority, number[]> = {
  high: [7, 3, 1, 0],
  medium: [3, 1, 0],
  low: [1, 0],
};

export const EXACT_ALERT_ID_PREFIX = 'kivo-exact-';
export const OFFSET_ALERT_ID_PREFIX = 'asistente-reminder-';
export const DAILY_SUMMARY_ID = 'kivo-summary-daily';
export const SNOOZE_ALERT_ID_PREFIX = 'kivo-snooze-';

/** Soft day reminders fire at this local time (early risers plan their day from here). */
export const SOFT_DAY_NOTIFICATION_HOUR = 5;
export const SOFT_DAY_NOTIFICATION_MINUTE = 0;

/** Daily assistant digest — same early window as soft day reminders. */
export const DAILY_SUMMARY_HOUR = 5;
export const DAILY_SUMMARY_MINUTE = 0;

/** Backend default times when the user did not mention a specific clock time. */
const IMPLICIT_DAY_TIMES = [
  { hour: 9, minute: 0 },
  { hour: SOFT_DAY_NOTIFICATION_HOUR, minute: SOFT_DAY_NOTIFICATION_MINUTE },
  { hour: 0, minute: 0 },
];

function isImplicitDayTime(date: Date): boolean {
  return IMPLICIT_DAY_TIMES.some(
    (slot) =>
      date.getHours() === slot.hour &&
      date.getMinutes() === slot.minute &&
      date.getSeconds() === 0,
  );
}

function softDayNotificationTime(date: Date): Date {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    SOFT_DAY_NOTIFICATION_HOUR,
    SOFT_DAY_NOTIFICATION_MINUTE,
    0,
    0,
  );
}

/** ISO date-only (YYYY-MM-DD) has no explicit clock time. */
export function hasExplicitTime(record: MemoryRecord): boolean {
  const iso = record.dueAtIso?.trim();
  if (iso) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false;

    if (iso.includes('T')) {
      const parsed = new Date(iso);
      if (!Number.isNaN(parsed.getTime())) {
        if (isImplicitDayTime(parsed)) return false;
        return parsed.getHours() !== 0 || parsed.getMinutes() !== 0 || parsed.getSeconds() !== 0;
      }
    }
  }

  return Boolean(record.time?.trim() && record.time !== 'Sin hora');
}

function parseDueDate(record: MemoryRecord): Date | null {
  if (record.dueAtIso) {
    const parsed = new Date(record.dueAtIso);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }

  if (!record.scheduledAt) return null;

  const [year, month, day] = record.scheduledAt.split('-').map(Number);
  if (!year || !month || !day) return null;

  const due = new Date(
    year,
    month - 1,
    day,
    SOFT_DAY_NOTIFICATION_HOUR,
    SOFT_DAY_NOTIFICATION_MINUTE,
    0,
    0,
  );
  return Number.isNaN(due.getTime()) ? null : due;
}

/** Due moment when the record includes an explicit clock time (meetings, timed tasks). */
function parseExactDueDate(record: MemoryRecord): Date | null {
  if (!hasExplicitTime(record)) return null;

  if (record.dueAtIso) {
    const parsed = new Date(record.dueAtIso);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }

  return null;
}

function formatExactTimeLabel(date: Date): string {
  return date.toLocaleTimeString('es', { hour: 'numeric', minute: '2-digit' });
}

function buildExactTimeMessage(record: MemoryRecord, triggerAt: Date): string {
  const timeLabel = formatExactTimeLabel(triggerAt);
  if (record.type === 'meeting') return `Reunión a las ${timeLabel}`;
  if (record.type === 'reminder') return `¡Es la hora! ${record.title}`;
  return `Pendiente a las ${timeLabel}: ${record.title}`;
}

function startOfLocalDay(date: Date): Date {
  return softDayNotificationTime(date);
}

function subtractDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() - days);
  return next;
}

function buildDayMessage(record: MemoryRecord, daysBefore: number): string {
  if (daysBefore === 7) return `Faltan 7 días: ${record.title}`;
  if (daysBefore === 3) return `Faltan 3 días: ${record.title}`;
  if (daysBefore === 1) return `Mañana: ${record.title}`;
  if (record.type === 'reminder') return `Hoy: ${record.title}`;
  return `Hoy vence: ${record.title}`;
}

function isSchedulableRecord(record: MemoryRecord): boolean {
  if (record.status === 'completed') return false;
  return record.type === 'task' || record.type === 'reminder' || record.type === 'meeting';
}

function isCriticalRecord(record: MemoryRecord): boolean {
  return (record.priority ?? 'medium') === 'high';
}

function resolveKind(
  record: MemoryRecord,
  alertLevel: ReminderAlertLevel,
): ReminderNotificationKind {
  if (alertLevel === 'alarm' || isCriticalRecord(record)) return 'critical';
  return 'reminder';
}

function buildOffsetReminders(
  record: MemoryRecord,
  dueDate: Date,
  now: number,
  skipTodayOffset: boolean,
): ReminderScheduleItem[] {
  const items: ReminderScheduleItem[] = [];
  const priority = record.priority ?? 'medium';
  const dayOffsets = DAY_OFFSETS_BY_PRIORITY[priority];

  for (const daysBefore of dayOffsets) {
    if (skipTodayOffset && daysBefore === 0) continue;

    const triggerAt = subtractDays(startOfLocalDay(dueDate), daysBefore);
    if (triggerAt.getTime() <= now) continue;

    const alertLevel: ReminderAlertLevel =
      daysBefore === 0 && isCriticalRecord(record) ? 'alarm' : 'notification';

    items.push({
      id: `${OFFSET_ALERT_ID_PREFIX}${record.id}-d${daysBefore}`,
      recordId: record.id,
      triggerAt,
      title: resolveKind(record, alertLevel) === 'critical' ? 'Alerta crítica' : 'Kivo',
      body: buildDayMessage(record, daysBefore),
      alertLevel,
      kind: resolveKind(record, alertLevel),
    });
  }

  const oneHourBefore = new Date(dueDate.getTime() - 60 * 60 * 1000);
  if (oneHourBefore.getTime() > now && priority !== 'low' && hasExplicitTime(record)) {
    const alertLevel: ReminderAlertLevel = isCriticalRecord(record) ? 'alarm' : 'notification';
    items.push({
      id: `${OFFSET_ALERT_ID_PREFIX}${record.id}-h1`,
      recordId: record.id,
      triggerAt: oneHourBefore,
      title: resolveKind(record, alertLevel) === 'critical' ? 'Alerta crítica' : 'Kivo',
      body: `En 1 hora: ${record.title}`,
      alertLevel,
      kind: resolveKind(record, alertLevel),
    });
  }

  return items;
}

function buildExactTimeReminder(record: MemoryRecord, now: number): ReminderScheduleItem | null {
  const triggerAt = parseExactDueDate(record);
  if (!triggerAt || triggerAt.getTime() <= now) return null;

  const alertLevel: ReminderAlertLevel = 'alarm';
  const kind = resolveKind(record, alertLevel);

  return {
    id: `${EXACT_ALERT_ID_PREFIX}${record.id}`,
    recordId: record.id,
    triggerAt,
    title: kind === 'critical' ? 'Alerta crítica' : record.title,
    body: buildExactTimeMessage(record, triggerAt),
    alertLevel,
    kind,
  };
}

export type DailySummaryStats = {
  meetingsToday: number;
  tasksToday: number;
  highPriorityToday: number;
  lines: string[];
};

export function buildDailySummaryStats(
  records: MemoryRecord[],
  todayIso: string,
  extras?: { deviceMeetingsToday?: number },
): DailySummaryStats {
  const dueToday = getDueTodayRecords(records, todayIso);
  const meetingsToday =
    dueToday.filter((item) => item.type === 'meeting').length +
    Math.max(0, extras?.deviceMeetingsToday ?? 0);
  const tasksToday = dueToday.filter(
    (item) => item.type === 'task' || item.type === 'reminder',
  ).length;
  const highPriorityToday = dueToday.filter((item) => isCriticalRecord(item)).length;

  const lines: string[] = [];
  if (meetingsToday > 0) {
    lines.push(
      `${meetingsToday} ${meetingsToday === 1 ? 'reunión programada' : 'reuniones programadas'} hoy`,
    );
  }
  if (tasksToday > 0) {
    lines.push(
      `${tasksToday} ${tasksToday === 1 ? 'tarea pendiente' : 'tareas pendientes'} para hoy`,
    );
  }
  if (highPriorityToday > 0) {
    lines.push(
      `${highPriorityToday} ${highPriorityToday === 1 ? 'asunto urgente' : 'asuntos urgentes'} requieren atención`,
    );
  }
  if (lines.length === 0) {
    lines.push('No tienes pendientes críticos. Buen momento para planear.');
  }

  return { meetingsToday, tasksToday, highPriorityToday, lines };
}

function nextDailySummaryTrigger(from = new Date()): Date {
  const trigger = new Date(
    from.getFullYear(),
    from.getMonth(),
    from.getDate(),
    DAILY_SUMMARY_HOUR,
    DAILY_SUMMARY_MINUTE,
    0,
    0,
  );
  if (trigger.getTime() <= from.getTime()) {
    trigger.setDate(trigger.getDate() + 1);
  }
  return trigger;
}

export function buildDailySummaryScheduleItem(
  records: MemoryRecord[],
  todayIso: string,
  now = new Date(),
): ReminderScheduleItem {
  const stats = buildDailySummaryStats(records, todayIso);
  return {
    id: DAILY_SUMMARY_ID,
    recordId: 'daily-summary',
    triggerAt: nextDailySummaryTrigger(now),
    title: 'Resumen del día',
    body: stats.lines.join(' · '),
    alertLevel: 'notification',
    kind: 'daily-summary',
  };
}

export function buildReminderSchedule(
  records: MemoryRecord[],
  options?: { includeDailySummary?: boolean; todayIso?: string },
): ReminderScheduleItem[] {
  const now = Date.now();
  const items: ReminderScheduleItem[] = [];

  for (const record of records) {
    if (!isSchedulableRecord(record)) continue;

    const exactDue = parseExactDueDate(record);
    const dueDate = exactDue ?? parseDueDate(record);
    if (!dueDate) continue;

    const exactItem = buildExactTimeReminder(record, now);
    if (exactItem) {
      items.push(exactItem);
    }

    items.push(...buildOffsetReminders(record, dueDate, now, Boolean(exactItem)));
  }

  if (options?.includeDailySummary !== false) {
    const day = options?.todayIso ?? todayIso();
    items.push(buildDailySummaryScheduleItem(records, day, new Date(now)));
  }

  return items;
}

export function getDueTodayRecords(records: MemoryRecord[], today: string): MemoryRecord[] {
  return records.filter((record) => {
    if (!isSchedulableRecord(record)) return false;
    return record.scheduledAt === today;
  });
}

export function getCriticalRecordsForAlerts(
  records: MemoryRecord[],
  todayIso: string,
): MemoryRecord[] {
  return records.filter((record) => {
    if (!isSchedulableRecord(record)) return false;
    if (!isCriticalRecord(record)) return false;
    if (record.scheduledAt && record.scheduledAt < todayIso) return true;
    return record.scheduledAt === todayIso;
  });
}
