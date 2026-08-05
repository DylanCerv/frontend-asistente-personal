import { useEffect, useRef } from 'react';
import { AppState, Platform } from 'react-native';

import { useAssistant } from '@/context/assistant-context';
import { useAuth } from '@/context/auth-context';
import { useDeviceCalendar } from '@/context/device-calendar-context';
import { useUserPreferences } from '@/context/user-preferences-context';
import {
  buildDisabledHomeWidgetsPayload,
  buildHomeWidgetsPayload,
  buildSignedOutHomeWidgetsPayload,
} from '@/services/widgets/widget-payload';
import { syncHomeWidgets } from '@/services/widgets/widget-storage';

export function useWidgetSync() {
  const { records } = useAssistant();
  const { deviceCalendarEvents } = useDeviceCalendar();
  const { isAuthenticated, isBootstrapping } = useAuth();
  const { homeWidgetEnabled, isLoading: preferencesLoading } = useUserPreferences();
  const appState = useRef(AppState.currentState);
  const recordsRef = useRef(records);
  const deviceEventsRef = useRef(deviceCalendarEvents);
  const isAuthenticatedRef = useRef(isAuthenticated);
  const homeWidgetEnabledRef = useRef(homeWidgetEnabled);

  recordsRef.current = records;
  deviceEventsRef.current = deviceCalendarEvents;
  isAuthenticatedRef.current = isAuthenticated;
  homeWidgetEnabledRef.current = homeWidgetEnabled;

  async function syncWidget() {
    // Avoid wiping widget data with "signed out" / "disabled" during auth bootstrap.
    if (isBootstrapping || preferencesLoading) return;

    if (!isAuthenticatedRef.current) {
      await syncHomeWidgets(buildSignedOutHomeWidgetsPayload());
      return;
    }

    if (!homeWidgetEnabledRef.current) {
      await syncHomeWidgets(buildDisabledHomeWidgetsPayload());
      return;
    }

    await syncHomeWidgets(
      buildHomeWidgetsPayload(recordsRef.current, deviceEventsRef.current),
    );
  }

  useEffect(() => {
    if (Platform.OS === 'web') return;
    void syncWidget();
  }, [
    records,
    deviceCalendarEvents,
    homeWidgetEnabled,
    isAuthenticated,
    isBootstrapping,
    preferencesLoading,
  ]);

  useEffect(() => {
    if (Platform.OS === 'web') return;

    const subscription = AppState.addEventListener('change', (nextState) => {
      const wasBackground = appState.current.match(/inactive|background/);
      appState.current = nextState;

      if (wasBackground && nextState === 'active') {
        void syncWidget();
        return;
      }

      if (nextState === 'background' && isAuthenticatedRef.current && homeWidgetEnabledRef.current) {
        void syncHomeWidgets(
          buildHomeWidgetsPayload(recordsRef.current, deviceEventsRef.current),
        );
      }
    });

    return () => subscription.remove();
  }, []);
}
