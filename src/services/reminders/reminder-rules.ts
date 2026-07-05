import type { Priority } from '@/types/assistant';
import type { MemoryRecord } from '@/types/record';

export type ReminderScheduleItem = {
  id: string;
  recordId: string;
  triggerAt: Date;
  title: string;
  body: string;
};

const DAY_OFFSETS_BY_PRIORITY: Record<Priority, number[]> = {
  high: [7, 3, 1, 0],
  medium: [3, 1, 0],
  low: [1, 0],
};

const EXACT_ALERT_ID_PREFIX = 'kivo-exact-';
const OFFSET_ALERT_ID_PREFIX = 'asistente-reminder-';

/** ISO date-only (YYYY-MM-DD) has no explicit clock time. */
export function hasExplicitTime(record: MemoryRecord): boolean {
  const iso = record.dueAtIso?.trim();
  if (iso) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false;

    if (iso.includes('T')) {
      const parsed = new Date(iso);
      if (!Number.isNaN(parsed.getTime())) {
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

  const due = new Date(year, month - 1, day, 9, 0, 0, 0);
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
  if (record.type === 'reminder') return `Recordatorio a las ${timeLabel}`;
  return `Pendiente a las ${timeLabel}`;
}

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 9, 0, 0, 0);
}

function subtractDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() - days);
  return next;
}

function buildDayMessage(record: MemoryRecord, daysBefore: number): string {
  if (daysBefore === 7) return `Faltan 7 días: ${record.title}`;
  if (daysBefore === 3) return `Faltan 3 días: ${record.title}`;
  if (daysBefore === 1) return `Mañana vence: ${record.title}`;
  return `Vence hoy: ${record.title}`;
}

function isSchedulableRecord(record: MemoryRecord): boolean {
  if (record.status === 'completed') return false;
  return record.type === 'task' || record.type === 'reminder' || record.type === 'meeting';
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

    items.push({
      id: `${OFFSET_ALERT_ID_PREFIX}${record.id}-d${daysBefore}`,
      recordId: record.id,
      triggerAt,
      title: 'Kivo',
      body: buildDayMessage(record, daysBefore),
    });
  }

  const oneHourBefore = new Date(dueDate.getTime() - 60 * 60 * 1000);
  if (oneHourBefore.getTime() > now && priority !== 'low') {
    items.push({
      id: `${OFFSET_ALERT_ID_PREFIX}${record.id}-h1`,
      recordId: record.id,
      triggerAt: oneHourBefore,
      title: 'Kivo',
      body: `Vence en 1 hora: ${record.title}`,
    });
  }

  return items;
}

function buildExactTimeReminder(record: MemoryRecord, now: number): ReminderScheduleItem | null {
  const triggerAt = parseExactDueDate(record);
  if (!triggerAt || triggerAt.getTime() <= now) return null;

  return {
    id: `${EXACT_ALERT_ID_PREFIX}${record.id}`,
    recordId: record.id,
    triggerAt,
    title: record.title,
    body: buildExactTimeMessage(record, triggerAt),
  };
}

export function buildReminderSchedule(records: MemoryRecord[]): ReminderScheduleItem[] {
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

    items.push(
      ...buildOffsetReminders(record, dueDate, now, Boolean(exactItem)),
    );
  }

  return items;
}

export function getDueTodayRecords(records: MemoryRecord[], today: string): MemoryRecord[] {
  return records.filter((record) => {
    if (!isSchedulableRecord(record)) return false;
    return record.scheduledAt === today;
  });
}
