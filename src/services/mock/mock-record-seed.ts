import { INITIAL_EVENTS, INITIAL_FINANCE, INITIAL_TASKS } from '@/constants/mock-data';
import type { CalendarEvent, TaskItem } from '@/types/assistant';
import type { ApiRecord } from '@/types/record-api';
import type { MemoryRecord } from '@/types/record';
import { todayIso } from '@/utils/date-utils';

const MOCK_USER_ID = '00000000-0000-4000-8000-000000000001';

function isoDateTimeFromDay(isoDay: string, hour = 12): string {
  return `${isoDay}T${String(hour).padStart(2, '0')}:00:00.000Z`;
}

function taskToApiRecord(task: TaskItem): ApiRecord {
  const now = new Date().toISOString();
  return {
    id: task.id,
    user_id: MOCK_USER_ID,
    job_id: null,
    type: 'task',
    title: task.title,
    description: task.description ?? null,
    priority: task.priority,
    date: isoDateTimeFromDay(task.scheduledAt, 15),
    client: null,
    project: null,
    amount: null,
    currency: null,
    data: {
      status: task.status,
      category: task.category,
      tags: task.tags,
      completedAt: task.completedAt,
    },
    created_at: task.createdAt ?? now,
    updated_at: now,
  };
}

function eventToApiRecord(event: CalendarEvent): ApiRecord {
  const now = new Date().toISOString();
  const type = event.type === 'meeting' ? 'meeting' : 'reminder';

  return {
    id: event.id,
    user_id: MOCK_USER_ID,
    job_id: null,
    type,
    title: event.title,
    description: null,
    priority: 'medium',
    date: isoDateTimeFromDay(event.scheduledAt, 14),
    client: null,
    project: null,
    amount: null,
    currency: null,
    data: {
      time: event.time,
      location: event.location,
    },
    created_at: now,
    updated_at: now,
  };
}

function financeToApiRecord(record: MemoryRecord): ApiRecord {
  const now = new Date().toISOString();
  return {
    id: record.id,
    user_id: MOCK_USER_ID,
    job_id: null,
    type: record.type as 'expense' | 'income',
    title: record.title,
    description: record.description ?? null,
    priority: null,
    date: isoDateTimeFromDay(record.scheduledAt ?? todayIso()),
    client: record.client ?? null,
    project: record.project ?? null,
    amount: record.amount ?? null,
    currency: record.currency ?? 'USD',
    data: {
      category: record.category,
    },
    created_at: record.createdAt ?? now,
    updated_at: now,
  };
}

export function buildSeedApiRecords(): ApiRecord[] {
  return [
    ...INITIAL_TASKS.map(taskToApiRecord),
    ...INITIAL_EVENTS.map(eventToApiRecord),
    ...INITIAL_FINANCE.map(financeToApiRecord),
  ];
}

export function createApiRecordFromMemory(record: MemoryRecord, userId = MOCK_USER_ID): ApiRecord {
  const now = new Date().toISOString();
  return {
    id: record.id,
    user_id: userId,
    job_id: null,
    type: record.type,
    title: record.title,
    description: record.description ?? null,
    priority: record.priority ?? null,
    date: record.scheduledAt ? isoDateTimeFromDay(record.scheduledAt) : null,
    client: record.client ?? null,
    project: record.project ?? null,
    amount: record.amount ?? null,
    currency: record.currency ?? null,
    data: {
      status: record.status,
      category: record.category,
      tags: record.tags,
      completedAt: record.completedAt,
      time: record.time,
      location: record.location,
    },
    created_at: record.createdAt ?? now,
    updated_at: now,
  };
}
