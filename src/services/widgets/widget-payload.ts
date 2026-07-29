import { getDueTodayRecords } from '@/services/reminders/reminder-rules';
import type { TaskItem } from '@/types/assistant';
import type { MemoryRecord } from '@/types/record';
import { addDays, formatShortDate, todayIso } from '@/utils/date-utils';
import {
  getDayProgressPercent,
  getFocusTask,
  getFocusTaskDueLabel,
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
  type WidgetPriorityPayload,
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

function recordsToTasks(records: MemoryRecord[]): TaskItem[] {
  return records.map(memoryRecordToTask).filter((task): task is TaskItem => task !== null);
}

function countCompletedInRange(tasks: TaskItem[], startIso: string, endIso: string): number {
  return tasks.filter((task) => {
    if (task.status !== 'completed') return false;
    const completedOn = task.completedAt?.slice(0, 10) ?? task.scheduledAt;
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
    deepLink: WIDGET_DEEP_LINK_AGENDA,
  };
}

export function buildPriorityWidgetPayload(tasks: TaskItem[]): WidgetPriorityPayload {
  const focusTask = getFocusTask(tasks);
  const progressPercent = getDayProgressPercent(tasks);

  if (!focusTask) {
    return {
      label: 'PRIORIDAD ACTUAL',
      title: 'Nada urgente',
      dueLabel: 'Sin tareas pendientes',
      progressPercent,
      emptyMessage: 'Habla para organizar tu día',
      deepLink: WIDGET_DEEP_LINK_FOCUS,
    };
  }

  return {
    label: 'PRIORIDAD ACTUAL',
    title: focusTask.title,
    dueLabel: getFocusTaskDueLabel(focusTask),
    progressPercent,
    deepLink: WIDGET_DEEP_LINK_FOCUS,
  };
}

export function buildCaptureWidgetPayload(): WidgetCapturePayload {
  return {
    title: 'Quick Capture',
    subtitle: 'TAP TO RECORD',
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
  const progressPercent = getDayProgressPercent(tasks);

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

export function buildHomeWidgetsPayload(records: MemoryRecord[]): WidgetHomePayload {
  const tasks = recordsToTasks(records);
  const updatedAt = new Date().toISOString();

  return {
    version: 2,
    updatedAt,
    enabled: true,
    signedIn: true,
    today: buildTodayWidgetPayload(records),
    priority: buildPriorityWidgetPayload(tasks),
    capture: baseCapture(),
    focusPoints: buildFocusPointsWidgetPayload(tasks),
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
    deepLink: WIDGET_DEEP_LINK_AGENDA,
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
    deepLink: WIDGET_DEEP_LINK_AGENDA,
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
      label: 'PRIORIDAD ACTUAL',
      title: 'Widget desactivado',
      dueLabel: 'Actívalo en Perfil',
      progressPercent: 0,
      emptyMessage: 'Actívalo en Perfil → Accesos rápidos',
      deepLink: WIDGET_DEEP_LINK_FOCUS,
    },
    capture: baseCapture(),
    focusPoints: {
      valueLabel: '—',
      label: 'Focus Points',
      deltaLabel: '—',
      deltaPositive: true,
      progressPercent: 0,
      emptyMessage: 'Actívalo en Perfil → Accesos rápidos',
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
      label: 'PRIORIDAD ACTUAL',
      title: 'Kivo',
      dueLabel: 'Inicia sesión',
      progressPercent: 0,
      emptyMessage: 'Inicia sesión para ver tu prioridad',
      deepLink: WIDGET_DEEP_LINK_FOCUS,
    },
    capture: baseCapture(),
    focusPoints: {
      valueLabel: '—',
      label: 'Focus Points',
      deltaLabel: '—',
      deltaPositive: true,
      progressPercent: 0,
      emptyMessage: 'Inicia sesión para ver tus puntos',
      deepLink: WIDGET_DEEP_LINK_REPORT,
    },
  };
}
