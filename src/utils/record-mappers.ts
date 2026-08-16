import type { CalendarEvent, ReminderItem, TaskItem } from '@/types/assistant';
import type { ApiRecord, UpdateRecordPayload } from '@/types/record-api';
import type { MemoryRecord } from '@/types/record';
import { normalizeTaskCategory } from '@/constants/categories';
import { relativeDayLabel, toIsoDate, todayIso } from '@/utils/date-utils';

function readString(data: Record<string, unknown>, key: string): string | undefined {
  const value = data[key];
  return typeof value === 'string' ? value : undefined;
}

function readStringArray(data: Record<string, unknown>, key: string): string[] {
  const value = data[key];
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string');
}

export function toScheduledAt(date: string | null | undefined): string | null {
  if (!date) return null;
  const trimmed = date.trim();
  // Date-only values have no timezone; keep the calendar day as stored.
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return trimmed.slice(0, 10);
  // TIMESTAMPTZ comes back as UTC; convert to the device's local calendar day.
  return toIsoDate(parsed);
}

export function formatTimeLabel(date: string | null | undefined): string {
  if (!date) return '';
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toLocaleTimeString('es', { hour: 'numeric', minute: '2-digit' });
}

export function apiRecordToMemory(record: ApiRecord): MemoryRecord {
  const data = record.data ?? {};
  const status = readString(data, 'status');
  const category = readString(data, 'category');
  const location = readString(data, 'location');

  return {
    id: record.id,
    type: record.type,
    title: record.title ?? 'Sin título',
    description: record.description ?? undefined,
    priority: record.priority ?? undefined,
    status: status === 'completed' ? 'completed' : 'pending',
    scheduledAt: toScheduledAt(record.date) ?? undefined,
    dueAtIso: record.date ?? undefined,
    dueLabel: record.date ? relativeDayLabel(toScheduledAt(record.date)!) : undefined,
    category: normalizeTaskCategory(category),
    location,
    client: record.client ?? undefined,
    project: record.project ?? undefined,
    amount: record.amount ?? undefined,
    currency: record.currency ?? undefined,
    time: formatTimeLabel(record.date),
    tags: readStringArray(data, 'tags'),
    createdAt: record.created_at,
    completedAt: readString(data, 'completedAt'),
  };
}

export function memoryRecordToTask(record: MemoryRecord): TaskItem | null {
  if (record.type !== 'task') return null;

  return {
    id: record.id,
    title: record.title,
    description: record.description,
    dueLabel: record.dueLabel,
    dueAtIso: record.dueAtIso,
    scheduledAt: record.scheduledAt,
    completedAt: record.completedAt,
    createdAt: record.createdAt,
    priority: record.priority ?? 'medium',
    status: record.status === 'completed' ? 'completed' : 'pending',
    category: normalizeTaskCategory(record.category),
    tags: record.tags ?? [],
  };
}

export function memoryRecordToEvent(record: MemoryRecord): CalendarEvent | null {
  if (record.type !== 'meeting' && record.type !== 'reminder') {
    return null;
  }

  const scheduledAt = record.scheduledAt ?? todayIso();
  const eventType = record.type === 'meeting' ? 'meeting' : 'reminder';

  return {
    id: record.id,
    title: record.title,
    description: record.description,
    date: scheduledAt,
    scheduledAt,
    dueAtIso: record.dueAtIso,
    time: record.time || 'Sin hora',
    type: eventType,
    status: record.status === 'completed' ? 'completed' : 'pending',
    location: record.location,
  };
}

export function buildRemindersFromRecords(records: MemoryRecord[]): ReminderItem[] {
  return records
    .filter((record) => record.type === 'reminder' || record.type === 'task')
    .filter((record) => record.status !== 'completed')
    .slice(0, 5)
    .map((record) => ({
      id: record.id,
      title: record.title,
      timeLabel: record.dueLabel ?? record.time,
    }));
}

/**
 * Status toggle patch. Open-ended tasks (no date) get anchored to the
 * completion day so they appear in that day's history.
 */
export function buildRecordStatusPatch(
  record: ApiRecord,
  status: 'pending' | 'completed',
): UpdateRecordPayload {
  const data = { ...(record.data ?? {}) };
  data.status = status;

  if (status === 'completed') {
    data.completedAt = new Date().toISOString();

    if (!record.date) {
      data.wasOpenEnded = true;
      // Soft-day 05:00 local → UTC ISO (Z). Offset forms like -05:00 fail
      // default Zod datetime validation on the API.
      const now = new Date();
      const day = toIsoDate(now);
      const [year, month, dayNum] = day.split('-').map(Number);
      const softLocal = new Date(year, month - 1, dayNum, 5, 0, 0, 0);
      return {
        data,
        date: softLocal.toISOString(),
      };
    }

    return { data };
  }

  delete data.completedAt;

  // Re-open: restore open-ended state if it was stamped only for completion history.
  // Explicit false/null so backend merge overwrites previous values.
  if (data.wasOpenEnded === true) {
    data.wasOpenEnded = false;
    data.completedAt = null;
    return { data, date: null };
  }

  data.completedAt = null;
  return { data };
}
