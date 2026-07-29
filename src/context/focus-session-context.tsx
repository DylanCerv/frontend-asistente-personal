import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AppState, Platform, type AppStateStatus } from 'react-native';

import { useAssistant } from '@/context/assistant-context';
import { useUserPreferences } from '@/context/user-preferences-context';
import { showAppAlert } from '@/services/app-dialog';
import { enableFocusDnd, restoreFocusDnd } from '@/services/focus/focus-dnd';
import type { FocusLockIntensity } from '@/services/focus/focus-lock-intensity';
import {
  dismissFocusOverlay,
  presentFocusOverlay,
  refreshFocusOverlay,
  subscribeFocusOverlayActions,
} from '@/services/focus/focus-overlay';
import { resolveEffectiveFocusIntensity } from '@/services/focus/focus-permissions';
import {
  FOCUS_EXTEND_MINUTES,
  FOCUS_POSTPONE_MINUTES,
  canUseFocusSessionNotifications,
  cancelFocusSessionNotification,
  displayFocusSessionNotification,
  registerFocusForegroundService,
  updateFocusSessionNotification,
} from '@/services/focus/focus-session-notifications';
import {
  clearFocusSession,
  formatFocusCountdown,
  loadFocusSession,
  saveFocusSession,
  type FocusSessionRecord,
} from '@/services/focus/focus-session-store';
import { consumePendingFocusCompleteTaskId } from '@/services/focus/focus-session-background';

type FocusSessionContextValue = {
  session: FocusSessionRecord | null;
  isActive: boolean;
  remainingMs: number;
  progressPercent: number;
  sessionUiOpen: boolean;
  openSessionUi: () => void;
  closeSessionUi: () => void;
  startSession: (input: {
    taskId: string;
    title: string;
    endsAt: number;
  }) => Promise<boolean>;
  completeSession: () => Promise<void>;
  postponeSession: (minutes?: number) => Promise<void>;
  extendSession: (minutes?: number) => Promise<void>;
  stopSession: () => Promise<void>;
};

const FocusSessionContext = createContext<FocusSessionContextValue | null>(null);

function getProgressPercent(session: FocusSessionRecord, now: number): number {
  const total = Math.max(1, session.endsAt - session.startedAt);
  const elapsed = Math.min(total, Math.max(0, now - session.startedAt));
  return Math.round((elapsed / total) * 100);
}

export function FocusSessionProvider({ children }: { children: ReactNode }) {
  const { toggleTaskComplete } = useAssistant();
  const { focusLockIntensity } = useUserPreferences();
  const [session, setSession] = useState<FocusSessionRecord | null>(null);
  const [sessionUiOpen, setSessionUiOpen] = useState(false);
  const [now, setNow] = useState(Date.now());
  const sessionRef = useRef<FocusSessionRecord | null>(null);
  const endingRef = useRef(false);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  const openSessionUi = useCallback(() => setSessionUiOpen(true), []);
  const closeSessionUi = useCallback(() => setSessionUiOpen(false), []);

  const persistAndSync = useCallback(async (next: FocusSessionRecord | null) => {
    setSession(next);
    sessionRef.current = next;
    if (!next) {
      setSessionUiOpen(false);
      await clearFocusSession();
      return;
    }
    await saveFocusSession(next);
  }, []);

  const teardownNative = useCallback(async () => {
    dismissFocusOverlay();
    await restoreFocusDnd();
    await cancelFocusSessionNotification();
  }, []);

  const stopSession = useCallback(async () => {
    if (endingRef.current) return;
    endingRef.current = true;
    try {
      await teardownNative();
      await persistAndSync(null);
    } finally {
      endingRef.current = false;
    }
  }, [persistAndSync, teardownNative]);

  const completeSession = useCallback(async () => {
    const current = sessionRef.current;
    if (!current) return;
    try {
      await toggleTaskComplete(current.taskId);
    } catch {
      // Still close the session even if toggle fails.
    }
    await stopSession();
  }, [stopSession, toggleTaskComplete]);

  const postponeSession = useCallback(
    async (minutes = FOCUS_POSTPONE_MINUTES) => {
      const current = sessionRef.current;
      if (!current) return;
      const next: FocusSessionRecord = {
        ...current,
        endsAt: Math.max(current.endsAt, Date.now()) + minutes * 60 * 1000,
      };
      await persistAndSync(next);
      await updateFocusSessionNotification(next);
      if (next.effectiveIntensity === 'strict') {
        refreshFocusOverlay(next.title, formatFocusCountdown(next.endsAt - Date.now()));
      }
    },
    [persistAndSync],
  );

  const extendSession = useCallback(
    async (minutes = FOCUS_EXTEND_MINUTES) => {
      await postponeSession(minutes);
    },
    [postponeSession],
  );

  const startSession = useCallback(
    async (input: { taskId: string; title: string; endsAt: number }) => {
      if (input.endsAt <= Date.now()) {
        showAppAlert('Hora inválida', 'Elige una hora futura para terminar la sesión Focus.');
        return false;
      }

      const { effectiveIntensity, status } = await resolveEffectiveFocusIntensity(focusLockIntensity);

      if (!status.notifications) {
        showAppAlert(
          'Permiso requerido',
          'Activa las notificaciones para mostrar la sesión Focus en la barra y en la pantalla de bloqueo.',
        );
        return false;
      }

      if (
        focusLockIntensity === 'strict' &&
        effectiveIntensity === 'standard' &&
        Platform.OS === 'android'
      ) {
        showAppAlert(
          'Modo Estricto no disponible',
          'Falta el permiso de overlay. La sesión continuará en modo Estándar (No Molestar + notificación).',
        );
      }

      if (sessionRef.current) {
        await teardownNative();
      }

      const startedAt = Date.now();
      const next: FocusSessionRecord = {
        taskId: input.taskId,
        title: input.title,
        startedAt,
        endsAt: input.endsAt,
        intensity: focusLockIntensity,
        effectiveIntensity,
      };

      await registerFocusForegroundService();
      await persistAndSync(next);
      setSessionUiOpen(true);

      if (status.dnd) {
        await enableFocusDnd();
      } else if (status.dndAvailable) {
        showAppAlert(
          'No Molestar',
          'Concede acceso a No Molestar en Perfil → Modo Focus para silenciar otras notificaciones.',
        );
      }

      await displayFocusSessionNotification(next);

      if (effectiveIntensity === 'strict') {
        presentFocusOverlay(next.title, formatFocusCountdown(next.endsAt - Date.now()));
      }

      return true;
    },
    [focusLockIntensity, persistAndSync, teardownNative],
  );

  // Hydrate persisted session once on mount + apply pending complete from notification.
  useEffect(() => {
    let mounted = true;
    void (async () => {
      const pendingCompleteId = await consumePendingFocusCompleteTaskId();
      if (pendingCompleteId && mounted) {
        try {
          toggleTaskComplete(pendingCompleteId);
        } catch {
          // Ignore if record already gone.
        }
      }

      const stored = await loadFocusSession();
      if (!mounted) return;
      if (!stored || stored.endsAt <= Date.now()) {
        if (stored) {
          await teardownNative();
          await clearFocusSession();
        }
        return;
      }
      setSession(stored);
      sessionRef.current = stored;
      setSessionUiOpen(true);
      await displayFocusSessionNotification(stored);
    })();
    return () => {
      mounted = false;
    };
    // Mount-only hydrate.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Tick countdown + auto-end.
  useEffect(() => {
    if (!session) return;
    const id = setInterval(() => {
      const stamp = Date.now();
      setNow(stamp);
      const current = sessionRef.current;
      if (current && stamp >= current.endsAt) {
        void stopSession();
      }
    }, 1000);
    return () => clearInterval(id);
  }, [session, stopSession]);

  // Overlay when leaving app in strict mode; refresh timer text.
  useEffect(() => {
    if (!session || session.effectiveIntensity !== 'strict') {
      dismissFocusOverlay();
      return;
    }

    const onAppState = (state: AppStateStatus) => {
      const current = sessionRef.current;
      if (!current || current.effectiveIntensity !== 'strict') return;
      const timer = formatFocusCountdown(current.endsAt - Date.now());
      if (state === 'background' || state === 'inactive') {
        presentFocusOverlay(current.title, timer);
      } else if (state === 'active') {
        dismissFocusOverlay();
        setSessionUiOpen(true);
      }
    };

    const sub = AppState.addEventListener('change', onAppState);
    if (AppState.currentState !== 'active') {
      presentFocusOverlay(session.title, formatFocusCountdown(session.endsAt - Date.now()));
    }

    const unsubOverlay = subscribeFocusOverlayActions((action) => {
      if (action === 'complete') void completeSession();
      else if (action === 'postpone') void postponeSession();
      else if (action === 'extend') void extendSession();
      else if (action === 'stop') void stopSession();
    });

    const refreshId = setInterval(() => {
      const current = sessionRef.current;
      if (!current || current.effectiveIntensity !== 'strict') return;
      if (AppState.currentState === 'active') return;
      refreshFocusOverlay(current.title, formatFocusCountdown(current.endsAt - Date.now()));
      void updateFocusSessionNotification(current);
    }, 15000);

    return () => {
      sub.remove();
      unsubOverlay?.();
      clearInterval(refreshId);
    };
  }, [session, completeSession, postponeSession, extendSession, stopSession]);

  // Foreground Notifee events (APK only — never import Notifee in Expo Go).
  useEffect(() => {
    if (!canUseFocusSessionNotifications()) return;
    let unsubscribe: (() => void) | undefined;

    void import('@notifee/react-native')
      .then((notifee) => {
        unsubscribe = notifee.default.onForegroundEvent(({ type, detail }) => {
          if (type !== notifee.EventType.ACTION_PRESS) return;
          const data = detail.notification?.data ?? {};
          if (data.kind !== 'focus-session') return;
          const actionId = detail.pressAction?.id;
          if (actionId === 'focus_complete') void completeSession();
          else if (actionId === 'focus_postpone') void postponeSession();
          else if (actionId === 'focus_extend') void extendSession();
          else if (actionId === 'focus_stop') void stopSession();
        });
      })
      .catch(() => undefined);

    return () => {
      unsubscribe?.();
    };
  }, [completeSession, postponeSession, extendSession, stopSession]);

  const remainingMs = session ? Math.max(0, session.endsAt - now) : 0;
  const progressPercent = session ? getProgressPercent(session, now) : 0;

  const value = useMemo(
    () => ({
      session,
      isActive: session != null,
      remainingMs,
      progressPercent,
      sessionUiOpen,
      openSessionUi,
      closeSessionUi,
      startSession,
      completeSession,
      postponeSession,
      extendSession,
      stopSession,
    }),
    [
      session,
      remainingMs,
      progressPercent,
      sessionUiOpen,
      openSessionUi,
      closeSessionUi,
      startSession,
      completeSession,
      postponeSession,
      extendSession,
      stopSession,
    ],
  );

  return <FocusSessionContext.Provider value={value}>{children}</FocusSessionContext.Provider>;
}

export function useFocusSession() {
  const context = useContext(FocusSessionContext);
  if (!context) {
    throw new Error('useFocusSession must be used within FocusSessionProvider');
  }
  return context;
}

export type { FocusLockIntensity };
