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

export function buildReminderSchedule(records: MemoryRecord[]): ReminderScheduleItem[] {
  const now = Date.now();
  const items: ReminderScheduleItem[] = [];

  for (const record of records) {
    if (!isSchedulableRecord(record)) continue;

    const dueDate = parseDueDate(record);
    if (!dueDate) continue;

    const priority = record.priority ?? 'medium';
    const dayOffsets = DAY_OFFSETS_BY_PRIORITY[priority];

    for (const daysBefore of dayOffsets) {
      const triggerAt = subtractDays(startOfLocalDay(dueDate), daysBefore);
      if (triggerAt.getTime() <= now) continue;

      items.push({
        id: `asistente-reminder-${record.id}-d${daysBefore}`,
        recordId: record.id,
        triggerAt,
        title: 'Asistente',
        body: buildDayMessage(record, daysBefore),
      });
    }

    const oneHourBefore = new Date(dueDate.getTime() - 60 * 60 * 1000);
    if (oneHourBefore.getTime() > now && priority !== 'low') {
      items.push({
        id: `asistente-reminder-${record.id}-h1`,
        recordId: record.id,
        triggerAt: oneHourBefore,
        title: 'Asistente',
        body: `Vence en 1 hora: ${record.title}`,
      });
    }
  }

  return items;
}

export function getDueTodayRecords(records: MemoryRecord[], today: string): MemoryRecord[] {
  return records.filter((record) => {
    if (!isSchedulableRecord(record)) return false;
    return record.scheduledAt === today;
  });
}
