import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  isFocusLockIntensity,
  type FocusLockIntensity,
} from '@/services/focus/focus-lock-intensity';

const FOCUS_SESSION_KEY = '@asistente/focus_session_v1';
const PREVIOUS_INTERRUPTION_FILTER_KEY = '@asistente/focus_prev_interruption_filter';

export type FocusSessionRecord = {
  taskId: string;
  title: string;
  startedAt: number;
  endsAt: number;
  intensity: FocusLockIntensity;
  /** Effective intensity after permission degradation */
  effectiveIntensity: FocusLockIntensity;
};

function isValidSession(value: unknown): value is FocusSessionRecord {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.taskId === 'string' &&
    typeof record.title === 'string' &&
    typeof record.startedAt === 'number' &&
    typeof record.endsAt === 'number' &&
    isFocusLockIntensity(record.intensity) &&
    isFocusLockIntensity(record.effectiveIntensity)
  );
}

export async function loadFocusSession(): Promise<FocusSessionRecord | null> {
  try {
    const raw = await AsyncStorage.getItem(FOCUS_SESSION_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isValidSession(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export async function saveFocusSession(session: FocusSessionRecord): Promise<void> {
  await AsyncStorage.setItem(FOCUS_SESSION_KEY, JSON.stringify(session));
}

export async function clearFocusSession(): Promise<void> {
  await AsyncStorage.removeItem(FOCUS_SESSION_KEY);
}

export async function savePreviousInterruptionFilter(filter: number): Promise<void> {
  await AsyncStorage.setItem(PREVIOUS_INTERRUPTION_FILTER_KEY, String(filter));
}

export async function loadPreviousInterruptionFilter(): Promise<number | null> {
  const raw = await AsyncStorage.getItem(PREVIOUS_INTERRUPTION_FILTER_KEY);
  if (raw == null) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function clearPreviousInterruptionFilter(): Promise<void> {
  await AsyncStorage.removeItem(PREVIOUS_INTERRUPTION_FILTER_KEY);
}

export function getSessionRemainingMs(session: FocusSessionRecord, now = Date.now()): number {
  return Math.max(0, session.endsAt - now);
}

export function getSessionProgressPercent(session: FocusSessionRecord, now = Date.now()): number {
  const total = Math.max(1, session.endsAt - session.startedAt);
  const elapsed = Math.min(total, Math.max(0, now - session.startedAt));
  return Math.round((elapsed / total) * 100);
}

export function formatFocusCountdown(remainingMs: number): string {
  const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}
