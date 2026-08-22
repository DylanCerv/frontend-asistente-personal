import type { Priority } from '@/types/assistant';
import type { MemoryRecord } from '@/types/record';
import { todayIso, toIsoDate } from '@/utils/date-utils';

export type ReminderAlertLevel = 'alarm' | 'notification';

export type ReminderNotificationKind =
  | 'critical'
  | 'reminder'
  | 'daily-summary'
  | 'activity-warning';

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
export const CHECKIN_ALERT_ID_PREFIX = 'kivo-checkin-';
export const ACTIVITY_SOON_ID_PREFIX = 'kivo-activity-30m-';
export const DAILY_SUMMARY_ID = 'kivo-summary-daily';
export const SNOOZE_ALERT_ID_PREFIX = 'kivo-snooze-';

/** Minutes before a timed activity to wake the device with a heads-up. */
export const ACTIVITY_SOON_MINUTES = 30;

/** Soft day / check-in morning slot. */
export const SOFT_DAY_NOTIFICATION_HOUR = 5;
export const SOFT_DAY_NOTIFICATION_MINUTE = 0;

/** Daily assistant digest — same early window as soft day reminders. */
export const DAILY_SUMMARY_HOUR = 5;
export const DAILY_SUMMARY_MINUTE = 0;

/**
 * Same check-in hours for:
 * - day-only tasks (on due day + while still pending)
 * - open-ended tasks (every day until completed)
 */
export const DAY_CHECKIN_HOURS = [5, 12, 18] as const;

/** How many calendar days ahead to pre-schedule check-ins (app resync refreshes). */
const CHECKIN_LOOKAHEAD_DAYS = 7;

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

/** Human label for schedulable activity types (reunión, tarea, recordatorio…). */
export function activityTypeLabel(type: MemoryRecord['type'] | undefined): string {
  switch (type) {
    case 'meeting':
      return 'reunión';
    case 'reminder':
      return 'recordatorio';
    case 'task':
      return 'tarea';
    default:
      return 'actividad';
  }
}

function quotedTitle(title: string | undefined): string {
  const clean = (title ?? '').trim() || 'Sin título';
  return `«${clean}»`;
}

/** −30 min heads-up copy, personalized by activity type. */
export function buildActivitySoonCopy(record: MemoryRecord): { title: string; body: string } {
  const name = quotedTitle(record.title);
  switch (record.type) {
    case 'meeting':
      return {
        title: 'Reunión en 30 minutos',
        body: `Tu reunión ${name} empieza en 30 minutos`,
      };
    case 'reminder':
      return {
        title: 'Recordatorio en 30 minutos',
        body: `Tu recordatorio ${name} es en 30 minutos`,
      };
    case 'task':
      return {
        title: 'Tarea en 30 minutos',
        body: `Tu tarea ${name} es en 30 minutos`,
      };
    default:
      return {
        title: 'Actividad en 30 minutos',
        body: `Tu actividad ${name} es en 30 minutos`,
      };
  }
}

/** Exact-time full-screen alarm copy, personalized by activity type. */
export function buildExactAlarmCopy(
  record: MemoryRecord,
  triggerAt: Date,
): { title: string; body: string; alarmTitle: string } {
  const timeLabel = formatExactTimeLabel(triggerAt);
  const name = (record.title ?? '').trim() || 'Sin título';
  const kind = activityTypeLabel(record.type);

  switch (record.type) {
    case 'meeting':
      return {
        title: 'Es la hora de tu reunión',
        body: `${name} · ${timeLabel}`,
        alarmTitle: name,
      };
    case 'reminder':
      return {
        title: 'Es la hora de tu recordatorio',
        body: `${name} · ${timeLabel}`,
        alarmTitle: name,
      };
    case 'task':
      return {
        title: 'Es la hora de tu tarea',
        body: `${name} · ${timeLabel}`,
        alarmTitle: name,
      };
    default:
      return {
        title: `Es la hora de tu ${kind}`,
        body: `${name} · ${timeLabel}`,
        alarmTitle: name,
      };
  }
}

function startOfLocalDay(date: Date): Date {
  return softDayNotificationTime(date);
}

function subtractDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() - days);
  return next;
}

function formatLongDayLabel(date: Date): string {
  return date.toLocaleDateString('es', { day: 'numeric', month: 'long' });
}

/** Day-before notice for day-only activities (no clock time). */
export function buildDayBeforeCopy(
  record: MemoryRecord,
  dueDate: Date,
): { title: string; body: string } {
  const name = quotedTitle(record.title);
  const when = formatLongDayLabel(dueDate);

  switch (record.type) {
    case 'meeting':
      return {
        title: 'Reunión mañana',
        body: `Mañana, ${when}, tienes la reunión ${name}`,
      };
    case 'reminder':
      return {
        title: 'Recordatorio mañana',
        body: `Mañana, ${when}, tienes el recordatorio ${name}`,
      };
    case 'task':
      return {
        title: 'Tarea mañana',
        body: `Mañana, ${when}, tienes la tarea ${name}`,
      };
    default:
      return {
        title: 'Actividad mañana',
        body: `Mañana, ${when}, tienes la actividad ${name}`,
      };
  }
}

/** Same-day notice for day-only activities (no clock time). */
export function buildDayOfCopy(record: MemoryRecord): { title: string; body: string } {
  const name = quotedTitle(record.title);

  switch (record.type) {
    case 'meeting':
      return {
        title: 'Reunión hoy',
        body: `Hoy tienes la reunión ${name}`,
      };
    case 'reminder':
      return {
        title: 'Recordatorio hoy',
        body: `Hoy tienes el recordatorio ${name}`,
      };
    case 'task':
      return {
        title: 'Tarea hoy',
        body: `Hoy tienes la tarea ${name}`,
      };
    default:
      return {
        title: 'Actividad hoy',
        body: `Hoy tienes la actividad ${name}`,
      };
  }
}

/** Same-day check-in copy for day-only activities (5 / 12 / 18). */
export function buildDayCheckInCopy(
  record: MemoryRecord,
  hour: number,
): { title: string; body: string } {
  const name = quotedTitle(record.title);
  const kind = activityTypeLabel(record.type);

  if (hour === 5) {
    return buildDayOfCopy(record);
  }

  if (hour === 12) {
    switch (record.type) {
      case 'meeting':
        return {
          title: 'Reunión pendiente',
          body: `A mediodía sigue pendiente tu reunión ${name}`,
        };
      case 'reminder':
        return {
          title: 'Recordatorio pendiente',
          body: `A mediodía sigue pendiente tu recordatorio ${name}`,
        };
      case 'task':
        return {
          title: 'Tarea pendiente',
          body: `A mediodía sigue pendiente tu tarea ${name}`,
        };
      default:
        return {
          title: 'Actividad pendiente',
          body: `A mediodía sigue pendiente tu ${kind} ${name}`,
        };
    }
  }

  // 18:00
  switch (record.type) {
    case 'meeting':
      return {
        title: 'Reunión de hoy',
        body: `Esta tarde aún tienes la reunión ${name}`,
      };
    case 'reminder':
      return {
        title: 'Recordatorio de hoy',
        body: `Esta tarde aún tienes el recordatorio ${name}`,
      };
    case 'task':
      return {
        title: 'Tarea de hoy',
        body: `Esta tarde aún tienes la tarea ${name}`,
      };
    default:
      return {
        title: 'Actividad de hoy',
        body: `Esta tarde aún tienes la ${kind} ${name}`,
      };
  }
}

/**
 * Prefer the soft-morning slot; if that already passed but we are still on the
 * same calendar day, fire shortly so the user still gets the notice after sync.
 */
function resolveSoftDayTrigger(preferredAt: Date, now: number): Date | null {
  if (preferredAt.getTime() > now) return preferredAt;

  const dayStart = new Date(
    preferredAt.getFullYear(),
    preferredAt.getMonth(),
    preferredAt.getDate(),
  );
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  if (now >= dayStart.getTime() && now < dayEnd.getTime()) {
    return new Date(now + 20_000);
  }

  return null;
}

/**
 * Day-only activities (calendar day, no clock time), while still pending:
 * - 1 day before @ soft morning → "mañana, {fecha}, tienes…"
 * - Due day @ 12:00 / 18:00 → personalized check-ins
 *   (5:00 is covered by the daily briefing — no per-activity duplicate)
 */
function buildDayOnlyActivityReminders(
  record: MemoryRecord,
  dueDate: Date,
  now: number,
): ReminderScheduleItem[] {
  const items: ReminderScheduleItem[] = [];
  const dueDayStart = softDayNotificationTime(dueDate);

  const dayBeforePreferred = subtractDays(dueDayStart, 1);
  const dayBeforeAt = resolveSoftDayTrigger(dayBeforePreferred, now);
  if (dayBeforeAt) {
    const copy = buildDayBeforeCopy(record, dueDate);
    items.push({
      id: `${OFFSET_ALERT_ID_PREFIX}${record.id}-d1`,
      recordId: record.id,
      triggerAt: dayBeforeAt,
      title: copy.title,
      body: copy.body,
      alertLevel: 'notification',
      kind: 'reminder',
    });
  }

  for (const hour of DAY_CHECKIN_HOURS) {
    // Morning slot belongs to the consolidated daily briefing.
    if (hour === SOFT_DAY_NOTIFICATION_HOUR) continue;

    const preferred = new Date(
      dueDate.getFullYear(),
      dueDate.getMonth(),
      dueDate.getDate(),
      hour,
      0,
      0,
      0,
    );
    if (preferred.getTime() <= now) continue;

    const copy = buildDayCheckInCopy(record, hour);

    items.push({
      id: `${CHECKIN_ALERT_ID_PREFIX}${record.id}-${preferred.getTime()}`,
      recordId: record.id,
      triggerAt: preferred,
      title: copy.title,
      body: copy.body,
      alertLevel: 'notification',
      kind: 'reminder',
    });
  }

  return items;
}

function buildDayMessage(record: MemoryRecord, daysBefore: number): string {
  if (daysBefore === 7) return `Faltan 7 días: ${record.title}`;
  if (daysBefore === 3) return `Faltan 3 días: ${record.title}`;
  if (daysBefore === 1) return `Mañana: ${record.title}`;
  return `Hoy: ${record.title}`;
}

function isSchedulableRecord(record: MemoryRecord): boolean {
  if (record.status === 'completed') return false;
  return record.type === 'task' || record.type === 'reminder' || record.type === 'meeting';
}

/** No day and no time — open pending until the user completes it. */
export function isOpenEndedRecord(record: MemoryRecord): boolean {
  return isSchedulableRecord(record) && !record.dueAtIso && !record.scheduledAt;
}

/**
 * Open-ended activities (no date at all): daily nudges at 5 / 12 / 18
 * until the user marks them done. Tone is a friendly "Hey…".
 */
export function buildOpenEndedCheckInCopy(
  record: MemoryRecord,
  hour: number,
): { title: string; body: string } {
  const name = quotedTitle(record.title);

  if (hour === 5) {
    switch (record.type) {
      case 'meeting':
        return {
          title: 'Hey, reunión pendiente',
          body: `Hey, tu reunión ${name} sigue pendiente. ¿Le pones un día?`,
        };
      case 'reminder':
        return {
          title: 'Hey, recordatorio pendiente',
          body: `Hey, tu recordatorio ${name} sigue pendiente. ¿Lo agendamos?`,
        };
      case 'task':
        return {
          title: 'Hey, tarea pendiente',
          body: `Hey, tu tarea ${name} sigue pendiente. ¿La avanzamos hoy?`,
        };
      default:
        return {
          title: 'Hey, actividad pendiente',
          body: `Hey, tu actividad ${name} sigue pendiente. ¿Le pones un día?`,
        };
    }
  }

  if (hour === 12) {
    switch (record.type) {
      case 'meeting':
        return {
          title: 'Hey, mediodía',
          body: `Hey, a mediodía: tu reunión ${name} sigue sin fecha`,
        };
      case 'reminder':
        return {
          title: 'Hey, mediodía',
          body: `Hey, a mediodía: tu recordatorio ${name} sigue pendiente`,
        };
      case 'task':
        return {
          title: 'Hey, mediodía',
          body: `Hey, a mediodía: tu tarea ${name} sigue pendiente`,
        };
      default:
        return {
          title: 'Hey, mediodía',
          body: `Hey, a mediodía: tu actividad ${name} sigue pendiente`,
        };
    }
  }

  switch (record.type) {
    case 'meeting':
      return {
        title: 'Hey, no lo olvides',
        body: `Hey, antes de cerrar el día: tu reunión ${name} sigue pendiente`,
      };
    case 'reminder':
      return {
        title: 'Hey, no lo olvides',
        body: `Hey, antes de cerrar el día: tu recordatorio ${name} sigue pendiente`,
      };
    case 'task':
      return {
        title: 'Hey, no lo olvides',
        body: `Hey, antes de cerrar el día: tu tarea ${name} sigue pendiente`,
      };
    default:
      return {
        title: 'Hey, no lo olvides',
        body: `Hey, antes de cerrar el día: tu actividad ${name} sigue pendiente`,
      };
  }
}

/**
 * Open-ended (no date): lookahead days at 12:00 / 18:00 while pending.
 * 5:00 is covered by the daily briefing to avoid duplicate morning alerts.
 */
function buildOpenEndedActivityReminders(
  record: MemoryRecord,
  nowMs: number,
): ReminderScheduleItem[] {
  const items: ReminderScheduleItem[] = [];
  const now = new Date(nowMs);
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  for (let offset = 0; offset < CHECKIN_LOOKAHEAD_DAYS; offset += 1) {
    const day = new Date(todayStart);
    day.setDate(todayStart.getDate() + offset);

    for (const hour of DAY_CHECKIN_HOURS) {
      if (hour === SOFT_DAY_NOTIFICATION_HOUR) continue;

      const preferred = new Date(
        day.getFullYear(),
        day.getMonth(),
        day.getDate(),
        hour,
        0,
        0,
        0,
      );
      if (preferred.getTime() <= nowMs) continue;

      const copy = buildOpenEndedCheckInCopy(record, hour);

      items.push({
        id: `${CHECKIN_ALERT_ID_PREFIX}${record.id}-${preferred.getTime()}`,
        recordId: record.id,
        triggerAt: preferred,
        title: copy.title,
        body: copy.body,
        alertLevel: 'notification',
        kind: 'reminder',
      });
    }
  }

  return items;
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

/**
 * Timed activities (explicit clock time): −30 min wake notification + exact-time
 * full-screen alarm. Day-only / open-ended activities use other reminder paths.
 */
function buildActivitySoonReminder(
  record: MemoryRecord,
  exactDue: Date,
  now: number,
): ReminderScheduleItem | null {
  const triggerAt = new Date(exactDue.getTime() - ACTIVITY_SOON_MINUTES * 60 * 1000);
  if (triggerAt.getTime() <= now) return null;

  const copy = buildActivitySoonCopy(record);

  return {
    id: `${ACTIVITY_SOON_ID_PREFIX}${record.id}`,
    recordId: record.id,
    triggerAt,
    title: copy.title,
    body: copy.body,
    alertLevel: 'notification',
    kind: 'activity-warning',
  };
}

function buildExactTimeReminder(record: MemoryRecord, now: number): ReminderScheduleItem | null {
  const triggerAt = parseExactDueDate(record);
  if (!triggerAt || triggerAt.getTime() <= now) return null;

  const copy = buildExactAlarmCopy(record, triggerAt);

  return {
    id: `${EXACT_ALERT_ID_PREFIX}${record.id}`,
    recordId: record.id,
    triggerAt,
    title: copy.title,
    body: copy.body,
    alertLevel: 'alarm',
    kind: 'critical',
  };
}

export type DailySummaryStats = {
  meetingsToday: number;
  tasksToday: number;
  highPriorityToday: number;
  lines: string[];
  /** Concrete activity titles for the morning briefing notification. */
  activityLines: string[];
};

const BRIEFING_MAX_LISTED = 5;
const BRIEFING_MAX_BODY = 350;

/** Activities that belong in the 5:00 briefing for a given calendar day. */
export function listActivitiesForBriefingDay(
  records: MemoryRecord[],
  dayIso: string,
): MemoryRecord[] {
  const byId = new Map<string, MemoryRecord>();

  for (const record of records) {
    if (!isSchedulableRecord(record)) continue;

    if (isOpenEndedRecord(record)) {
      byId.set(record.id, record);
      continue;
    }

    if (record.scheduledAt === dayIso) {
      byId.set(record.id, record);
    }
  }

  return Array.from(byId.values()).sort((a, b) => {
    const aTimed = hasExplicitTime(a) ? 0 : 1;
    const bTimed = hasExplicitTime(b) ? 0 : 1;
    if (aTimed !== bTimed) return aTimed - bTimed;
    const aTime = a.time && a.time !== 'Sin hora' ? a.time : '';
    const bTime = b.time && b.time !== 'Sin hora' ? b.time : '';
    if (aTime !== bTime) return aTime.localeCompare(bTime);
    return a.title.localeCompare(b.title, 'es');
  });
}

function formatBriefingActivityLine(record: MemoryRecord): string {
  const title = (record.title ?? '').trim() || 'Sin título';
  if (hasExplicitTime(record)) {
    const time =
      record.time && record.time !== 'Sin hora'
        ? record.time
        : record.dueAtIso
          ? formatExactTimeLabel(new Date(record.dueAtIso))
          : '';
    return time ? `${time} · ${title}` : title;
  }
  if (isOpenEndedRecord(record)) {
    return `${title} (sin fecha)`;
  }
  return title;
}

export function buildDailyBriefingBody(
  records: MemoryRecord[],
  dayIso: string,
): { title: string; body: string; activityLines: string[] } {
  const activities = listActivitiesForBriefingDay(records, dayIso);
  const activityLines = activities.map(formatBriefingActivityLine);

  if (activityLines.length === 0) {
    return {
      title: 'Buenos días',
      body: 'No tienes actividades pendientes para hoy. Buen momento para planear.',
      activityLines,
    };
  }

  const listed = activityLines.slice(0, BRIEFING_MAX_LISTED);
  const remaining = activityLines.length - listed.length;
  let body = `Hoy (${activityLines.length}): ${listed.join(' · ')}`;
  if (remaining > 0) {
    body += ` · +${remaining} más`;
  }
  if (body.length > BRIEFING_MAX_BODY) {
    body = `${body.slice(0, BRIEFING_MAX_BODY - 1)}…`;
  }

  return {
    title: 'Actividades de hoy',
    body,
    activityLines,
  };
}

export function buildDailySummaryStats(
  records: MemoryRecord[],
  todayIso: string,
  extras?: { deviceMeetingsToday?: number },
): DailySummaryStats {
  const briefingActivities = listActivitiesForBriefingDay(records, todayIso);
  const dueToday = getDueTodayRecords(records, todayIso);
  const meetingsToday =
    dueToday.filter((item) => item.type === 'meeting').length +
    Math.max(0, extras?.deviceMeetingsToday ?? 0);
  const openEndedCount = briefingActivities.filter((item) => isOpenEndedRecord(item)).length;
  const tasksToday =
    dueToday.filter((item) => item.type === 'task' || item.type === 'reminder').length +
    openEndedCount;
  const highPriorityToday = briefingActivities.filter((item) => isCriticalRecord(item)).length;
  const activityLines = briefingActivities.map(formatBriefingActivityLine);

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

  return { meetingsToday, tasksToday, highPriorityToday, lines, activityLines };
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
  _todayIso: string,
  now = new Date(),
): ReminderScheduleItem {
  const triggerAt = nextDailySummaryTrigger(now);
  // Body must match the calendar day when the notification fires (often tomorrow).
  const briefingDayIso = toIsoDate(triggerAt);
  const briefing = buildDailyBriefingBody(records, briefingDayIso);

  return {
    id: DAILY_SUMMARY_ID,
    recordId: 'daily-summary',
    triggerAt,
    title: briefing.title,
    body: briefing.body,
    alertLevel: 'notification',
    kind: 'daily-summary',
  };
}

/**
 * Safety net: drop per-activity 5:00 alerts on the same calendar day as the
 * daily briefing so the same activity is not notified twice that morning.
 */
function suppressDuplicateMorningAlerts(
  items: ReminderScheduleItem[],
): ReminderScheduleItem[] {
  const briefing = items.find((item) => item.kind === 'daily-summary');
  if (!briefing) return items;

  const briefingDay = toIsoDate(briefing.triggerAt);

  return items.filter((item) => {
    if (item.kind === 'daily-summary') return true;

    const itemDay = toIsoDate(item.triggerAt);
    if (itemDay !== briefingDay) return true;

    const isMorningSlot =
      item.triggerAt.getHours() === DAILY_SUMMARY_HOUR &&
      item.triggerAt.getMinutes() === DAILY_SUMMARY_MINUTE;

    if (!isMorningSlot) return true;

    // Individual check-ins / soft-day offsets at the briefing hour → drop.
    if (
      item.id.startsWith(CHECKIN_ALERT_ID_PREFIX) ||
      /(?:-d0)$/.test(item.id)
    ) {
      return false;
    }

    return true;
  });
}

export function buildReminderSchedule(
  records: MemoryRecord[],
  options?: { includeDailySummary?: boolean; todayIso?: string },
): ReminderScheduleItem[] {
  const now = Date.now();
  const items: ReminderScheduleItem[] = [];

  for (const record of records) {
    if (!isSchedulableRecord(record)) continue;

    // Open (no day/time): daily 12 / 18 until marked done (5:00 = briefing).
    if (isOpenEndedRecord(record)) {
      items.push(...buildOpenEndedActivityReminders(record, now));
      continue;
    }

    const exactDue = parseExactDueDate(record);
    const dueDate = exactDue ?? parseDueDate(record);
    if (!dueDate) continue;

    if (exactDue) {
      const exactItem = buildExactTimeReminder(record, now);
      if (exactItem) items.push(exactItem);
      const soonItem = buildActivitySoonReminder(record, exactDue, now);
      if (soonItem) items.push(soonItem);
      // Timed items keep advance offsets + 1h-before.
      items.push(...buildOffsetReminders(record, dueDate, now, Boolean(exactItem)));
      continue;
    }

    // Day-only: mañana + check-ins 12/18 (5:00 = briefing).
    items.push(...buildDayOnlyActivityReminders(record, dueDate, now));
  }

  if (options?.includeDailySummary !== false) {
    const day = options?.todayIso ?? todayIso();
    items.push(buildDailySummaryScheduleItem(records, day, new Date(now)));
  }

  return suppressDuplicateMorningAlerts(items);
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
