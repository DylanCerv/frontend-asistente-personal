import { Redirect } from 'expo-router';
import * as ExpoSplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

import { useAppFlow } from '@/context/app-flow-context';
import { useAuth } from '@/context/auth-context';
import { SplashScreen } from '@/screens/SplashScreen';

ExpoSplashScreen.preventAutoHideAsync().catch(() => {});

export default function SplashRoute() {
  const { isAuthenticated, isBootstrapping } = useAuth();
  const { isFlowLoading, hasCompletedOnboarding, hasCompletedSetup } = useAppFlow();

  const isLoading = isBootstrapping || isFlowLoading;

  useEffect(() => {
    if (!isLoading) {
      ExpoSplashScreen.hideAsync().catch(() => {});
    }
  }, [isLoading]);

  if (isLoading) {
    return <SplashScreen />;
  }

  if (!hasCompletedOnboarding) {
    return <Redirect href="/onboarding" />;
  }

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  if (!hasCompletedSetup) {
    return <Redirect href="/setup" />;
  }

  return <Redirect href="/" />;
}
