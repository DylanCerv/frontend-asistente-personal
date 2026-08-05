import { isRunningInExpoGo } from 'expo';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

import { isNativeBuildEnabled } from '@/config/native-build';
import {
  deniedResult,
  getNativeFeatureUnavailableReason,
  grantedResult,
  isPermissionGranted,
  unavailableResult,
  type PermissionResult,
} from '@/services/permissions/permission-result';
import type { ExternalCalendarEvent } from '@/types/device-calendar';
import { addDays, toIsoDate, todayIso } from '@/utils/date-utils';

type CalendarModule = typeof import('expo-calendar');

const DEFAULT_LOOKAHEAD_DAYS = 30;
const DEFAULT_LOOKBACK_DAYS = 1;

let calendarModulePromise: Promise<CalendarModule | null> | null = null;

export function canUseDeviceCalendar(): boolean {
  return (
    isNativeBuildEnabled() &&
    Platform.OS !== 'web' &&
    Device.isDevice &&
    !isRunningInExpoGo()
  );
}

export function getCalendarPermissionUnavailableReason() {
  return getNativeFeatureUnavailableReason();
}

async function getCalendarModule(): Promise<CalendarModule | null> {
  if (!canUseDeviceCalendar()) return null;

  if (!calendarModulePromise) {
    calendarModulePromise = import('expo-calendar').catch(() => null);
  }

  return calendarModulePromise;
}

function formatClock(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function mapEvent(
  event: {
    id: string;
    title?: string | null;
    startDate: string | Date;
    endDate: string | Date;
    location?: string | null;
    notes?: string | null;
    allDay?: boolean;
  },
  calendarName?: string,
): ExternalCalendarEvent | null {
  if (event.allDay) return null;

  const start = new Date(event.startDate);
  const end = new Date(event.endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;

  const durationMinutes = Math.max(15, Math.round((end.getTime() - start.getTime()) / 60000));

  return {
    id: `device-${event.id}`,
    title: (event.title ?? '').trim() || 'Evento del calendario',
    start,
    end,
    scheduledAt: toIsoDate(start),
    time: formatClock(start),
    endTime: formatClock(end),
    durationMinutes,
    location: event.location?.trim() || undefined,
    description: event.notes?.trim() || undefined,
    calendarName: calendarName?.trim() || undefined,
    source: 'device',
  };
}

export async function checkCalendarPermissionResult(): Promise<PermissionResult> {
  const unavailable = getNativeFeatureUnavailableReason();
  if (unavailable) return unavailableResult(unavailable);

  const Calendar = await getCalendarModule();
  if (!Calendar) return unavailableResult('missing_native_flag');

  const current = await Calendar.getCalendarPermissionsAsync();
  return current.granted ? grantedResult() : deniedResult();
}

export async function requestCalendarPermissionResult(): Promise<PermissionResult> {
  const unavailable = getNativeFeatureUnavailableReason();
  if (unavailable) return unavailableResult(unavailable);

  const Calendar = await getCalendarModule();
  if (!Calendar) return unavailableResult('missing_native_flag');

  const current = await Calendar.getCalendarPermissionsAsync();
  if (current.granted) return grantedResult();

  const requested = await Calendar.requestCalendarPermissionsAsync();
  return requested.granted ? grantedResult() : deniedResult();
}

export async function checkCalendarPermission(): Promise<boolean> {
  return isPermissionGranted(await checkCalendarPermissionResult());
}

export async function requestCalendarPermission(): Promise<boolean> {
  return isPermissionGranted(await requestCalendarPermissionResult());
}

export async function fetchDeviceEvents(options?: {
  startIso?: string;
  endIso?: string;
}): Promise<ExternalCalendarEvent[]> {
  const Calendar = await getCalendarModule();
  if (!Calendar) return [];

  const granted = await checkCalendarPermission();
  if (!granted) return [];

  const startIso = options?.startIso ?? addDays(todayIso(), -DEFAULT_LOOKBACK_DAYS);
  const endIso = options?.endIso ?? addDays(todayIso(), DEFAULT_LOOKAHEAD_DAYS);

  const [startYear, startMonth, startDay] = startIso.split('-').map(Number);
  const [endYear, endMonth, endDay] = endIso.split('-').map(Number);
  const startDate = new Date(startYear!, startMonth! - 1, startDay!, 0, 0, 0, 0);
  const endDate = new Date(endYear!, endMonth! - 1, endDay!, 23, 59, 59, 999);

  const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
  const mapped: ExternalCalendarEvent[] = [];
  const seen = new Set<string>();

  for (const calendar of calendars) {
    try {
      const events = await Calendar.getEventsAsync([calendar.id], startDate, endDate);
      for (const event of events) {
        const item = mapEvent(event, calendar.title);
        if (!item || seen.has(item.id)) continue;
        seen.add(item.id);
        mapped.push(item);
      }
    } catch {
      // Skip calendars the OS denies individually.
    }
  }

  return mapped.sort((a, b) => a.start.getTime() - b.start.getTime());
}
