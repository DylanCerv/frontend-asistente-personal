import { Redirect } from 'expo-router';
import * as ExpoSplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

import { useAuth } from '@/context/auth-context';
import { SplashScreen } from '@/screens/SplashScreen';

ExpoSplashScreen.preventAutoHideAsync().catch(() => {});

export default function SplashRoute() {
  const { isAuthenticated, isBootstrapping } = useAuth();

  useEffect(() => {
    if (!isBootstrapping) {
      ExpoSplashScreen.hideAsync().catch(() => {});
    }
  }, [isBootstrapping]);

  if (isBootstrapping) {
    return <SplashScreen />;
  }

  return <Redirect href={isAuthenticated ? '/' : '/login'} />;
}
