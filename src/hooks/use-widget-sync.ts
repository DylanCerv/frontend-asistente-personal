import { useEffect, useRef } from 'react';
import { AppState, Platform } from 'react-native';

import { useAssistant } from '@/context/assistant-context';
import { useAuth } from '@/context/auth-context';
import { useUserPreferences } from '@/context/user-preferences-context';
import {
  buildDisabledWidgetPayload,
  buildSignedOutWidgetPayload,
  buildTodayWidgetPayload,
} from '@/services/widgets/widget-payload';
import { syncHomeWidget } from '@/services/widgets/widget-storage';

export function useWidgetSync() {
  const { records } = useAssistant();
  const { isAuthenticated } = useAuth();
  const { homeWidgetEnabled } = useUserPreferences();
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    if (Platform.OS === 'web') return;

    async function syncWidget() {
      if (!isAuthenticated) {
        await syncHomeWidget(buildSignedOutWidgetPayload());
        return;
      }

      if (!homeWidgetEnabled) {
        await syncHomeWidget(buildDisabledWidgetPayload());
        return;
      }

      await syncHomeWidget(buildTodayWidgetPayload(records));
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
        void syncHomeWidget(buildTodayWidgetPayload(records));
      }
    });

    return () => subscription.remove();
  }, [records, homeWidgetEnabled, isAuthenticated]);
}
