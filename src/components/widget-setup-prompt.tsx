import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

import { WidgetSetupSheet } from '@/components/widget-setup-sheet';
import { HOME_WIDGET_SETUP_PENDING_KEY } from '@/context/user-preferences-context';

export function WidgetSetupPrompt() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadPendingSetup() {
      const pending = await AsyncStorage.getItem(HOME_WIDGET_SETUP_PENDING_KEY);
      if (isMounted && pending === 'true') {
        setVisible(true);
      }
    }

    void loadPendingSetup();
    return () => {
      isMounted = false;
    };
  }, []);

  async function handleClose() {
    setVisible(false);
    await AsyncStorage.removeItem(HOME_WIDGET_SETUP_PENDING_KEY);
  }

  return <WidgetSetupSheet visible={visible} onClose={handleClose} />;
}
