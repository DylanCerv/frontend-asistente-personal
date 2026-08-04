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
import { AppState } from 'react-native';

import { useUserPreferences } from '@/context/user-preferences-context';
import {
  canUseDeviceCalendar,
  fetchDeviceEvents,
  requestCalendarPermission,
} from '@/services/calendar/device-calendar';
import type { ExternalCalendarEvent } from '@/types/device-calendar';
import type { CalendarEvent } from '@/types/assistant';

const REFRESH_THROTTLE_MS = 15 * 60 * 1000;

type DeviceCalendarContextValue = {
  deviceEvents: ExternalCalendarEvent[];
  /** Device events mapped for Focus / Agenda / free-time helpers. */
  deviceCalendarEvents: CalendarEvent[];
  isSyncing: boolean;
  lastSyncedAt: number | null;
  refreshDeviceCalendar: (force?: boolean) => Promise<void>;
  enableDeviceCalendarSync: () => Promise<boolean>;
};

const DeviceCalendarContext = createContext<DeviceCalendarContextValue | null>(null);

export function mapExternalToCalendarEvent(event: ExternalCalendarEvent): CalendarEvent {
  return {
    id: event.id,
    title: event.title,
    date: event.scheduledAt,
    scheduledAt: event.scheduledAt,
    dueAtIso: event.start.toISOString(),
    time: event.time,
    endTime: event.endTime,
    durationMinutes: event.durationMinutes,
    type: 'meeting',
    status: 'pending',
    location: event.location,
    description: event.calendarName
      ? `Del calendario · ${event.calendarName}`
      : 'Del calendario del teléfono',
    source: 'device',
    readOnly: true,
    calendarName: event.calendarName,
  };
}

export function DeviceCalendarProvider({ children }: { children: ReactNode }) {
  const { deviceCalendarSyncEnabled, setDeviceCalendarSyncEnabled } = useUserPreferences();
  const [deviceEvents, setDeviceEvents] = useState<ExternalCalendarEvent[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
  const lastFetchRef = useRef(0);

  const refreshDeviceCalendar = useCallback(
    async (force = false) => {
      if (!deviceCalendarSyncEnabled) {
        setDeviceEvents([]);
        return;
      }
      if (!canUseDeviceCalendar()) return;

      const now = Date.now();
      if (!force && lastFetchRef.current && now - lastFetchRef.current < REFRESH_THROTTLE_MS) {
        return;
      }

      setIsSyncing(true);
      try {
        const events = await fetchDeviceEvents();
        setDeviceEvents(events);
        lastFetchRef.current = Date.now();
        setLastSyncedAt(Date.now());
      } catch {
        // Keep previous cache on failure.
      } finally {
        setIsSyncing(false);
      }
    },
    [deviceCalendarSyncEnabled],
  );

  const enableDeviceCalendarSync = useCallback(async () => {
    if (!canUseDeviceCalendar()) {
      return false;
    }

    const granted = await requestCalendarPermission();
    if (!granted) {
      await setDeviceCalendarSyncEnabled(false);
      return false;
    }

    await setDeviceCalendarSyncEnabled(true);
    lastFetchRef.current = 0;
    await refreshDeviceCalendar(true);
    return true;
  }, [refreshDeviceCalendar, setDeviceCalendarSyncEnabled]);

  useEffect(() => {
    if (!deviceCalendarSyncEnabled) {
      setDeviceEvents([]);
      return;
    }
    void refreshDeviceCalendar(true);
  }, [deviceCalendarSyncEnabled, refreshDeviceCalendar]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active' && deviceCalendarSyncEnabled) {
        void refreshDeviceCalendar(false);
      }
    });
    return () => subscription.remove();
  }, [deviceCalendarSyncEnabled, refreshDeviceCalendar]);

  const deviceCalendarEvents = useMemo(
    () => deviceEvents.map(mapExternalToCalendarEvent),
    [deviceEvents],
  );

  const value = useMemo(
    () => ({
      deviceEvents,
      deviceCalendarEvents,
      isSyncing,
      lastSyncedAt,
      refreshDeviceCalendar,
      enableDeviceCalendarSync,
    }),
    [
      deviceEvents,
      deviceCalendarEvents,
      isSyncing,
      lastSyncedAt,
      refreshDeviceCalendar,
      enableDeviceCalendarSync,
    ],
  );

  return (
    <DeviceCalendarContext.Provider value={value}>{children}</DeviceCalendarContext.Provider>
  );
}

export function useDeviceCalendar() {
  const context = useContext(DeviceCalendarContext);
  if (!context) {
    throw new Error('useDeviceCalendar must be used within DeviceCalendarProvider');
  }
  return context;
}
