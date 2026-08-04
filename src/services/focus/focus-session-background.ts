import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

import { isNativeBuildEnabled } from '@/config/native-build';
import { restoreFocusDnd } from '@/services/focus/focus-dnd';
import { isFocusLockIntensity } from '@/services/focus/focus-lock-intensity';
import { dismissFocusOverlay } from '@/services/focus/focus-overlay';
import {
  FOCUS_EXTEND_MINUTES,
  FOCUS_POSTPONE_MINUTES,
  cancelFocusSessionNotification,
  displayFocusSessionNotification,
  updateFocusSessionNotification,
} from '@/services/focus/focus-session-notifications';
import {
  clearFocusSession,
  loadFocusSession,
  saveFocusSession,
  type FocusSessionRecord,
} from '@/services/focus/focus-session-store';

export type FocusBackgroundAction = 'complete' | 'postpone' | 'extend' | 'stop';

const PENDING_COMPLETE_KEY = '@asistente/focus_pending_complete_task';

export async function consumePendingFocusCompleteTaskId(): Promise<string | null> {
  const taskId = await AsyncStorage.getItem(PENDING_COMPLETE_KEY);
  if (taskId) await AsyncStorage.removeItem(PENDING_COMPLETE_KEY);
  return taskId;
}

/**
 * Apply a focus notification action outside React (headless).
 * Completing a task is deferred to the app via pending flag.
 */
export async function applyFocusBackgroundAction(
  action: FocusBackgroundAction,
): Promise<FocusSessionRecord | null> {
  const session = await loadFocusSession();
  if (!session) {
    await cancelFocusSessionNotification();
    dismissFocusOverlay();
    return null;
  }

  if (action === 'complete') {
    await AsyncStorage.setItem(PENDING_COMPLETE_KEY, session.taskId);
    await restoreFocusDnd();
    dismissFocusOverlay();
    await cancelFocusSessionNotification();
    await clearFocusSession();
    return null;
  }

  if (action === 'stop') {
    await restoreFocusDnd();
    dismissFocusOverlay();
    await cancelFocusSessionNotification();
    await clearFocusSession();
    return null;
  }

  const minutes = action === 'extend' ? FOCUS_EXTEND_MINUTES : FOCUS_POSTPONE_MINUTES;
  const next: FocusSessionRecord = {
    ...session,
    endsAt: Math.max(session.endsAt, Date.now()) + minutes * 60 * 1000,
  };
  await saveFocusSession(next);
  await updateFocusSessionNotification(next);
  return next;
}

export async function hydrateFocusSessionFromStorage(): Promise<FocusSessionRecord | null> {
  const session = await loadFocusSession();
  if (!session) return null;
  if (!isFocusLockIntensity(session.intensity)) {
    await clearFocusSession();
    return null;
  }
  if (session.endsAt <= Date.now()) {
    await restoreFocusDnd();
    dismissFocusOverlay();
    await cancelFocusSessionNotification();
    await clearFocusSession();
    return null;
  }
  await displayFocusSessionNotification(session);
  return session;
}

/** Focus actions are handled in critical-alarm-background (single Notifee handler). */
export function registerFocusSessionBackgroundHandler(): void {
  if (!isNativeBuildEnabled() || Platform.OS !== 'android') return;
}
