import type { MemoryRecord } from '@/types/record';
import { todayIso } from '@/utils/date-utils';

import {
  buildDailySummaryStats,
  getCriticalRecordsForAlerts,
  type DailySummaryStats,
} from '@/services/reminders/reminder-rules';

export type KivoAlertKind = 'critical' | 'assistant';

export type KivoCriticalAlert = {
  id: string;
  kind: 'critical';
  recordId: string;
  title: string;
  body: string;
  timeLabel: string;
};

export type KivoAssistantAlert = {
  id: string;
  kind: 'assistant';
  title: string;
  timeLabel: string;
  lines: { id: string; icon: 'checkmark' | 'trending' | 'alert'; text: string }[];
  stats: DailySummaryStats;
};

export type KivoAlert = KivoCriticalAlert | KivoAssistantAlert;

const snoozedUntilByRecordId = new Map<string, number>();

export function snoozeInAppAlert(recordId: string, minutes = 60): void {
  snoozedUntilByRecordId.set(recordId, Date.now() + minutes * 60 * 1000);
}

export function clearInAppSnooze(recordId: string): void {
  snoozedUntilByRecordId.delete(recordId);
}

function isSnoozed(recordId: string): boolean {
  const until = snoozedUntilByRecordId.get(recordId);
  if (!until) return false;
  if (until <= Date.now()) {
    snoozedUntilByRecordId.delete(recordId);
    return false;
  }
  return true;
}

function formatTimeLabel(record: MemoryRecord): string {
  if (record.time && record.time !== 'Sin hora') return record.time;
  if (record.dueAtIso?.includes('T')) {
    const parsed = new Date(record.dueAtIso);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleTimeString('es', { hour: 'numeric', minute: '2-digit' });
    }
  }
  return 'Hoy';
}

function buildCriticalBody(record: MemoryRecord): string {
  if (record.description?.trim()) return record.description.trim();
  if (record.project) {
    return `La tarea “${record.title}” está por vencer. El proyecto “${record.project}” depende de este hito.`;
  }
  if (record.type === 'meeting') {
    return `Tu reunión “${record.title}” requiere atención ahora.`;
  }
  return `“${record.title}” es prioritario. Completa o pospone para mantener tu día bajo control.`;
}

export function buildKivoAlerts(
  records: MemoryRecord[],
  options?: {
    includeAssistant?: boolean;
    today?: string;
    deviceMeetingsToday?: number;
  },
): KivoAlert[] {
  const today = options?.today ?? todayIso();
  const alerts: KivoAlert[] = [];

  for (const record of getCriticalRecordsForAlerts(records, today)) {
    if (isSnoozed(record.id)) continue;
    alerts.push({
      id: `critical-${record.id}`,
      kind: 'critical',
      recordId: record.id,
      title: record.title,
      body: buildCriticalBody(record),
      timeLabel: formatTimeLabel(record),
    });
  }

  if (options?.includeAssistant !== false) {
    const stats = buildDailySummaryStats(records, today, {
      deviceMeetingsToday: options?.deviceMeetingsToday,
    });
    const lines: KivoAssistantAlert['lines'] = [];

    if (stats.meetingsToday > 0) {
      lines.push({
        id: 'meetings',
        icon: 'checkmark',
        text: `${stats.meetingsToday} ${stats.meetingsToday === 1 ? 'reunión programada' : 'reuniones programadas'} hoy`,
      });
    }
    if (stats.tasksToday > 0) {
      lines.push({
        id: 'tasks',
        icon: 'trending',
        text: `${stats.tasksToday} ${stats.tasksToday === 1 ? 'tarea pendiente' : 'tareas pendientes'} para hoy`,
      });
    }
    if (stats.highPriorityToday > 0) {
      lines.push({
        id: 'urgent',
        icon: 'alert',
        text: `${stats.highPriorityToday} ${stats.highPriorityToday === 1 ? 'asunto urgente' : 'asuntos urgentes'}`,
      });
    }
    if (lines.length === 0) {
      lines.push({
        id: 'calm',
        icon: 'checkmark',
        text: 'Sin pendientes críticos. Buen momento para planear.',
      });
    }

    alerts.push({
      id: 'assistant-daily',
      kind: 'assistant',
      title: 'Resumen del día',
      timeLabel: '5:00 am',
      lines,
      stats,
    });
  }

  return alerts;
}
