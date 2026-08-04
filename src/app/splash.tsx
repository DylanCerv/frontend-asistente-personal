import { Redirect } from 'expo-router';
import * as ExpoSplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';

import { useAppFlow } from '@/context/app-flow-context';
import { useAuth } from '@/context/auth-context';
import { SplashScreen } from '@/screens/SplashScreen';

/** Keeps the branded splash visible long enough for the entrance animation. */
const MIN_SPLASH_MS = 2200;

ExpoSplashScreen.preventAutoHideAsync().catch(() => {});

export default function SplashRoute() {
  const { isAuthenticated, isBootstrapping } = useAuth();
  const { isFlowLoading, hasCompletedOnboarding } = useAppFlow();
  const [hasMinTimeElapsed, setHasMinTimeElapsed] = useState(false);

  const isBootLoading = isBootstrapping || isFlowLoading;
  const isLoading = isBootLoading || !hasMinTimeElapsed;

  useEffect(() => {
    const timer = setTimeout(() => setHasMinTimeElapsed(true), MIN_SPLASH_MS);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isLoading) {
      ExpoSplashScreen.hideAsync().catch(() => {});
    }
  }, [isLoading]);

  if (isLoading) {
    return <SplashScreen />;
  }

  if (!isAuthenticated) {
    return <Redirect href="/welcome" />;
  }

  if (!hasCompletedOnboarding) {
    return <Redirect href="/onboarding" />;
  }

  return <Redirect href="/(main)" />;
}
