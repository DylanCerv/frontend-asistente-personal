import { getDueTodayRecords } from '@/services/reminders/reminder-rules';
import type { MemoryRecord } from '@/types/record';
import { formatShortDate, todayIso } from '@/utils/date-utils';

import {
  WIDGET_DEEP_LINK,
  WIDGET_MAX_ITEMS,
  type WidgetTodayItem,
  type WidgetTodayItemKind,
  type WidgetTodayPayload,
} from './widget-types';

function mapRecordKind(record: MemoryRecord): WidgetTodayItemKind {
  if (record.type === 'meeting') return 'meeting';
  if (record.type === 'reminder') return 'reminder';
  return 'task';
}

function sortScore(record: MemoryRecord): number {
  if (record.type === 'meeting') return 0;
  if (record.priority === 'high') return 1;
  if (record.type === 'reminder') return 2;
  return 3;
}

function compareTodayRecords(a: MemoryRecord, b: MemoryRecord): number {
  const scoreDiff = sortScore(a) - sortScore(b);
  if (scoreDiff !== 0) return scoreDiff;

  const timeA = a.time && a.time !== 'Sin hora' ? a.time : '99:99';
  const timeB = b.time && b.time !== 'Sin hora' ? b.time : '99:99';
  return timeA.localeCompare(timeB);
}

function mapRecordToWidgetItem(record: MemoryRecord): WidgetTodayItem {
  const time = record.time && record.time !== 'Sin hora' ? record.time : undefined;

  return {
    id: record.id,
    title: record.title,
    time,
    kind: mapRecordKind(record),
    priority: record.priority === 'high' ? 'high' : 'normal',
  };
}

export function buildTodayWidgetPayload(records: MemoryRecord[]): WidgetTodayPayload {
  const today = todayIso();
  const todayRecords = getDueTodayRecords(records, today).sort(compareTodayRecords);
  const visibleRecords = todayRecords.slice(0, WIDGET_MAX_ITEMS);
  const overflowCount = Math.max(0, todayRecords.length - WIDGET_MAX_ITEMS);

  const headline =
    todayRecords.length === 0
      ? 'Nada pendiente hoy'
      : todayRecords.length === 1
        ? '1 cosa para hoy'
        : `${todayRecords.length} cosas para hoy`;

  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    dateLabel: `Hoy, ${formatShortDate(today)}`,
    headline,
    items: visibleRecords.map(mapRecordToWidgetItem),
    overflowCount,
    emptyMessage: todayRecords.length === 0 ? 'Habla para organizar tu día' : undefined,
    enabled: true,
    deepLink: WIDGET_DEEP_LINK,
  };
}

export function buildDisabledWidgetPayload(): WidgetTodayPayload {
  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    dateLabel: '',
    headline: 'Widget desactivado',
    items: [],
    overflowCount: 0,
    emptyMessage: 'Actívalo en Perfil → Accesos rápidos',
    enabled: false,
    deepLink: WIDGET_DEEP_LINK,
  };
}

export function buildSignedOutWidgetPayload(): WidgetTodayPayload {
  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    dateLabel: '',
    headline: 'Kivo',
    items: [],
    overflowCount: 0,
    emptyMessage: 'Inicia sesión para ver tu día',
    enabled: false,
    deepLink: WIDGET_DEEP_LINK,
  };
}
