import { getDueTodayRecords } from '@/services/reminders/reminder-rules';
import type { CalendarEvent, TaskItem } from '@/types/assistant';
import type { MemoryRecord } from '@/types/record';
import { addDays, formatShortDate, todayIso } from '@/utils/date-utils';
import {
  buildFocusDayStats,
  getFocusChecklistTasks,
  getFocusTaskDueLabel,
  getTodayScopeEvents,
} from '@/utils/focus-utils';
import { memoryRecordToTask } from '@/utils/record-mappers';

import {
  WIDGET_DEEP_LINK_AGENDA,
  WIDGET_DEEP_LINK_CAPTURE,
  WIDGET_DEEP_LINK_FOCUS,
  WIDGET_DEEP_LINK_REPORT,
  WIDGET_MAX_ITEMS,
  type WidgetCapturePayload,
  type WidgetFocusPointsPayload,
  type WidgetHomePayload,
  type WidgetPriorityItem,
  type WidgetPriorityPayload,
  type WidgetTodayItem,
  type WidgetTodayItemKind,
  type WidgetTodayPayload,
} from './widget-types';

/** Max flexible tasks shown in the "No olvides de" widget list. */
const PRIORITY_WIDGET_MAX_ITEMS = 8;

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
  const timeA = a.time && a.time !== 'Sin hora' ? a.time : null;
  const timeB = b.time && b.time !== 'Sin hora' ? b.time : null;

  if (timeA && timeB) {
    const byTime = timeA.localeCompare(timeB);
    if (byTime !== 0) return byTime;
  } else if (timeA && !timeB) {
    return -1;
  } else if (!timeA && timeB) {
    return 1;
  }

  const scoreDiff = sortScore(a) - sortScore(b);
  if (scoreDiff !== 0) return scoreDiff;

  return a.title.localeCompare(b.title);
}

function compareWidgetTodayItems(a: WidgetTodayItem, b: WidgetTodayItem): number {
  const timeA = a.time ?? null;
  const timeB = b.time ?? null;

  if (timeA && timeB) {
    const byTime = timeA.localeCompare(timeB);
    if (byTime !== 0) return byTime;
  } else if (timeA && !timeB) {
    return -1;
  } else if (!timeA && timeB) {
    return 1;
  }

  const kindRank = (kind: WidgetTodayItemKind) =>
    kind === 'meeting' ? 0 : kind === 'reminder' ? 1 : 2;
  const byKind = kindRank(a.kind) - kindRank(b.kind);
  if (byKind !== 0) return byKind;

  return a.title.localeCompare(b.title, 'es');
}

function mapRecordToWidgetItem(record: MemoryRecord): WidgetTodayItem {
  const time = record.time && record.time !== 'Sin hora' ? record.time : undefined;

  return {
    id: record.id,
    title: record.title,
    time,
    kind: mapRecordKind(record),
    priority: record.priority === 'high' ? 'high' : 'normal',
    source: 'kivo',
  };
}

function mapCalendarEventToWidgetItem(event: CalendarEvent): WidgetTodayItem {
  const time = event.time && event.time !== 'Sin hora' ? event.time : undefined;

  return {
    id: event.id,
    title: event.title,
    time,
    kind: 'meeting',
    priority: 'normal',
    source: event.source === 'device' ? 'device' : 'kivo',
  };
}

function recordsToTasks(records: MemoryRecord[]): TaskItem[] {
  return records.map(memoryRecordToTask).filter((task): task is TaskItem => task !== null);
}

function countCompletedInRange(tasks: TaskItem[], startIso: string, endIso: string): number {
  return tasks.filter((task) => {
    if (task.status !== 'completed') return false;
    const completedOn = task.completedAt?.slice(0, 10) ?? task.scheduledAt;
    if (!completedOn) return false;
    return completedOn >= startIso && completedOn <= endIso;
  }).length;
}

function formatPointsValue(points: number): string {
  if (points >= 1000) {
    const thousands = points / 1000;
    const rounded = Math.round(thousands * 10) / 10;
    return `${rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toFixed(1)}k`;
  }
  return String(points);
}

/** @deprecated Sorting helper kept for tests / callers that still sort MemoryRecords. */
export function sortTodayRecordsForWidget(records: MemoryRecord[]): MemoryRecord[] {
  return [...records].sort(compareTodayRecords);
}

export function buildTodayWidgetPayload(
  records: MemoryRecord[],
  deviceEvents: CalendarEvent[] = [],
): WidgetTodayPayload {
  const today = todayIso();
  const fromRecords = getDueTodayRecords(records, today).map(mapRecordToWidgetItem);
  const fromDevice = getTodayScopeEvents(deviceEvents, today)
    .filter((event) => event.status !== 'completed')
    .map(mapCalendarEventToWidgetItem);

  const seenIds = new Set(fromRecords.map((item) => item.id));
  const merged = [
    ...fromRecords,
    ...fromDevice.filter((item) => !seenIds.has(item.id)),
  ].sort(compareWidgetTodayItems);

  const visibleItems = merged.slice(0, WIDGET_MAX_ITEMS);
  const overflowCount = Math.max(0, merged.length - WIDGET_MAX_ITEMS);

  const headline =
    merged.length === 0
      ? 'Nada pendiente hoy'
      : merged.length === 1
        ? '1 cosa para hoy'
        : `${merged.length} cosas para hoy`;

  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    dateLabel: `Hoy, ${formatShortDate(today)}`,
    headline,
    items: visibleItems,
    overflowCount,
    emptyMessage: merged.length === 0 ? 'Habla para organizar tu día' : undefined,
    enabled: true,
    deepLink: WIDGET_DEEP_LINK_AGENDA,
  };
}

export function buildPriorityWidgetPayload(
  tasks: TaskItem[],
  deviceEvents: CalendarEvent[] = [],
): WidgetPriorityPayload {
  const checklist = getFocusChecklistTasks(tasks, { limit: PRIORITY_WIDGET_MAX_ITEMS });
  const stats = buildFocusDayStats(tasks, deviceEvents);
  const progressPercent = stats.progressPercent;
  const progressLabel = `${stats.completedToday}/${stats.totalToday}`;

  const items: WidgetPriorityItem[] = checklist.map((task) => ({
    id: task.id,
    title: task.title,
    dueLabel: getFocusTaskDueLabel(task),
  }));

  if (items.length === 0) {
    return {
      label: 'No olvides de',
      title: 'Nada urgente',
      dueLabel: 'Sin tareas pendientes',
      items: [],
      progressPercent,
      progressLabel,
      emptyMessage: 'Habla para organizar tu día',
      deepLink: WIDGET_DEEP_LINK_FOCUS,
    };
  }

  return {
    label: 'No olvides de',
    title: items[0].title,
    dueLabel: items[0].dueLabel,
    items,
    progressPercent,
    progressLabel,
    deepLink: WIDGET_DEEP_LINK_FOCUS,
  };
}

export function buildCaptureWidgetPayload(): WidgetCapturePayload {
  return {
    title: 'Captura rápida',
    subtitle: 'TOCA PARA GRABAR',
    deepLink: WIDGET_DEEP_LINK_CAPTURE,
  };
}

export function buildFocusPointsWidgetPayload(tasks: TaskItem[]): WidgetFocusPointsPayload {
  const today = todayIso();
  const currentStart = addDays(today, -6);
  const previousEnd = addDays(today, -7);
  const previousStart = addDays(today, -13);

  const currentCompleted = countCompletedInRange(tasks, currentStart, today);
  const previousCompleted = countCompletedInRange(tasks, previousStart, previousEnd);
  const points = currentCompleted * 100;
  const progressPercent = buildFocusDayStats(tasks, []).progressPercent;

  let deltaLabel = '—';
  let deltaPositive = true;

  if (previousCompleted === 0 && currentCompleted > 0) {
    deltaLabel = '+100%';
    deltaPositive = true;
  } else if (previousCompleted > 0) {
    const delta = Math.round(((currentCompleted - previousCompleted) / previousCompleted) * 100);
    deltaLabel = `${delta > 0 ? '+' : ''}${delta}%`;
    deltaPositive = delta >= 0;
  } else if (currentCompleted === 0) {
    deltaLabel = '0%';
    deltaPositive = true;
  }

  return {
    valueLabel: formatPointsValue(points),
    label: 'Focus Points',
    deltaLabel,
    deltaPositive,
    progressPercent,
    emptyMessage: currentCompleted === 0 ? 'Completa tareas para sumar puntos' : undefined,
    deepLink: WIDGET_DEEP_LINK_REPORT,
  };
}

function baseCapture(): WidgetCapturePayload {
  return buildCaptureWidgetPayload();
}

export function buildHomeWidgetsPayload(
  records: MemoryRecord[],
  deviceEvents: CalendarEvent[] = [],
): WidgetHomePayload {
  const tasks = recordsToTasks(records);
  const updatedAt = new Date().toISOString();

  return {
    version: 2,
    updatedAt,
    enabled: true,
    signedIn: true,
    today: buildTodayWidgetPayload(records, deviceEvents),
    priority: buildPriorityWidgetPayload(tasks, deviceEvents),
    capture: baseCapture(),
    focusPoints: buildFocusPointsWidgetPayload(tasks),
  };
}

export function buildDisabledWidgetPayload(): WidgetTodayPayload {
  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    dateLabel: 'Hoy',
    headline: 'Tu agenda',
    items: [],
    overflowCount: 0,
    emptyMessage: 'Activa widgets en Perfil',
    enabled: false,
    deepLink: WIDGET_DEEP_LINK_AGENDA,
  };
}

export function buildSignedOutWidgetPayload(): WidgetTodayPayload {
  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    dateLabel: 'Hoy',
    headline: 'Tu día en Kivo',
    items: [],
    overflowCount: 0,
    emptyMessage: 'Inicia sesión para sincronizar',
    enabled: false,
    deepLink: WIDGET_DEEP_LINK_AGENDA,
  };
}

/** Shown when the widget is on the home screen but the app has not synced yet. */
export function buildNeedsSyncHomeWidgetsPayload(): WidgetHomePayload {
  const updatedAt = new Date().toISOString();

  return {
    version: 2,
    updatedAt,
    enabled: true,
    signedIn: true,
    today: {
      version: 1,
      updatedAt,
      dateLabel: 'Hoy',
      headline: 'Tu agenda',
      items: [],
      overflowCount: 0,
      emptyMessage: 'Abre Kivo para sincronizar',
      enabled: true,
      deepLink: WIDGET_DEEP_LINK_AGENDA,
    },
    priority: {
      label: 'No olvides de',
      title: 'Tu prioridad',
      dueLabel: 'Abre Kivo para sincronizar',
      items: [],
      progressPercent: 0,
      progressLabel: '0/0',
      emptyMessage: 'Abre Kivo para sincronizar',
      deepLink: WIDGET_DEEP_LINK_FOCUS,
    },
    capture: baseCapture(),
    focusPoints: {
      valueLabel: '0',
      label: 'Focus Points',
      deltaLabel: '—',
      deltaPositive: true,
      progressPercent: 0,
      emptyMessage: 'Abre Kivo para sincronizar',
      deepLink: WIDGET_DEEP_LINK_REPORT,
    },
  };
}

export function buildDisabledHomeWidgetsPayload(): WidgetHomePayload {
  const updatedAt = new Date().toISOString();
  const today = buildDisabledWidgetPayload();

  return {
    version: 2,
    updatedAt,
    enabled: false,
    signedIn: true,
    today,
    priority: {
      label: 'No olvides de',
      title: 'Tu prioridad',
      dueLabel: 'Activa widgets en Perfil',
      items: [],
      progressPercent: 0,
      progressLabel: '0/0',
      emptyMessage: 'Activa widgets en Perfil',
      deepLink: WIDGET_DEEP_LINK_FOCUS,
    },
    capture: baseCapture(),
    focusPoints: {
      valueLabel: '0',
      label: 'Focus Points',
      deltaLabel: '—',
      deltaPositive: true,
      progressPercent: 0,
      emptyMessage: 'Activa widgets en Perfil',
      deepLink: WIDGET_DEEP_LINK_REPORT,
    },
  };
}

export function buildSignedOutHomeWidgetsPayload(): WidgetHomePayload {
  const updatedAt = new Date().toISOString();
  const today = buildSignedOutWidgetPayload();

  return {
    version: 2,
    updatedAt,
    enabled: false,
    signedIn: false,
    today,
    priority: {
      label: 'No olvides de',
      title: 'Kivo',
      dueLabel: 'Inicia sesión',
      items: [],
      progressPercent: 0,
      progressLabel: '0/0',
      emptyMessage: 'Inicia sesión para ver tu prioridad',
      deepLink: WIDGET_DEEP_LINK_FOCUS,
    },
    capture: baseCapture(),
    focusPoints: {
      valueLabel: '0',
      label: 'Focus Points',
      deltaLabel: '—',
      deltaPositive: true,
      progressPercent: 0,
      emptyMessage: 'Inicia sesión para ver tus puntos',
      deepLink: WIDGET_DEEP_LINK_REPORT,
    },
  };
}
