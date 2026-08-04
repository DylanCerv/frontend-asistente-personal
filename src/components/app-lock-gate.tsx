import type { ReactNode } from 'react';
import { View } from 'react-native';

import { AppLockScreen } from '@/components/app-lock-screen';
import { useAppLock } from '@/context/app-lock-context';

export function AppLockGate({ children }: { children: ReactNode }) {
  const { isLocked } = useAppLock();

  return (
    <View className="flex-1">
      {children}
      {isLocked ? <AppLockScreen /> : null}
    </View>
  );
}
