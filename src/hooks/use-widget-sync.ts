import { useEffect, useRef } from 'react';
import { AppState, Platform } from 'react-native';

import { useAssistant } from '@/context/assistant-context';
import { useAuth } from '@/context/auth-context';
import { useUserPreferences } from '@/context/user-preferences-context';
import {
  buildDisabledHomeWidgetsPayload,
  buildHomeWidgetsPayload,
  buildSignedOutHomeWidgetsPayload,
} from '@/services/widgets/widget-payload';
import { syncHomeWidgets } from '@/services/widgets/widget-storage';

export function useWidgetSync() {
  const { records } = useAssistant();
  const { isAuthenticated } = useAuth();
  const { homeWidgetEnabled } = useUserPreferences();
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    if (Platform.OS === 'web') return;

    async function syncWidget() {
      if (!isAuthenticated) {
        await syncHomeWidgets(buildSignedOutHomeWidgetsPayload());
        return;
      }

      if (!homeWidgetEnabled) {
        await syncHomeWidgets(buildDisabledHomeWidgetsPayload());
        return;
      }

      await syncHomeWidgets(buildHomeWidgetsPayload(records));
    }

    void syncWidget();
  }, [records, homeWidgetEnabled, isAuthenticated]);

  useEffect(() => {
    if (Platform.OS === 'web') return;

    const subscription = AppState.addEventListener('change', (nextState) => {
      const wasBackground = appState.current.match(/inactive|background/);
      appState.current = nextState;

      if (wasBackground && nextState === 'active') {
        return;
      }

      if (nextState === 'background' && isAuthenticated && homeWidgetEnabled) {
        void syncHomeWidgets(buildHomeWidgetsPayload(records));
      }
    });

    return () => subscription.remove();
  }, [records, homeWidgetEnabled, isAuthenticated]);
}
