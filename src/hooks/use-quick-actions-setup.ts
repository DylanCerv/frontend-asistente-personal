import * as QuickActions from 'expo-quick-actions';
import { useQuickActionRouting } from 'expo-quick-actions/router';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';

import { useVoiceCapture } from '@/context/voice-capture-context';

const QUICK_ACTIONS: QuickActions.Action[] = [
  {
    id: 'voice-capture',
    title: 'Hablar',
    subtitle: 'Captura por voz sin abrir la app',
    icon: 'symbol:mic.fill',
    params: { href: '/capture' },
  },
  {
    id: 'today-summary',
    title: '¿Qué tengo hoy?',
    subtitle: 'Resumen del día',
    icon: 'symbol:calendar',
    params: { href: '/chat' },
  },
];

export function useQuickActionsSetup() {
  const router = useRouter();
  const { openCapture } = useVoiceCapture();

  useQuickActionRouting((action) => {
    if (action.id === 'voice-capture') {
      openCapture({ autoStart: true });
      return true;
    }
    return false;
  });

  useEffect(() => {
    let isMounted = true;

    async function registerQuickActions() {
      const supported = await QuickActions.isSupported();
      if (!supported || !isMounted) return;

      await QuickActions.setItems(QUICK_ACTIONS);

      const initial = QuickActions.initial;
      if (initial?.id === 'voice-capture') {
        openCapture({ autoStart: true });
        return;
      }

      if (initial?.params?.href === '/capture') {
        openCapture({ autoStart: true });
        return;
      }

      if (initial?.params?.href && typeof initial.params.href === 'string') {
        router.push(initial.params.href as '/chat');
      }
    }

    registerQuickActions();

    const subscription = QuickActions.addListener((action) => {
      if (action.id === 'voice-capture') {
        openCapture({ autoStart: true });
      }
    });

    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, [openCapture, router]);
}
