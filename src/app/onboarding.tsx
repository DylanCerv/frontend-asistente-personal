import { Redirect, useRouter } from 'expo-router';
import { useState } from 'react';

import { AppLockPinSetup } from '@/components/app-lock-pin-setup';
import { useAppFlow } from '@/context/app-flow-context';
import { useAuth } from '@/context/auth-context';
import type { AppLockDelaySeconds, AppLockMethod } from '@/context/user-preferences-context';
import { useUserPreferences, HOME_WIDGET_SETUP_PENDING_KEY } from '@/context/user-preferences-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { OnboardingScreen } from '@/screens/OnboardingScreen';
import { getBiometricCapability } from '@/services/app-lock/biometric';
import { markSkipAppLockOnce } from '@/services/app-lock/session';
import { ensureNotificationPermissions } from '@/services/reminders/reminder-notifications';
import { showAppAlert } from '@/services/app-dialog';

export default function OnboardingRoute() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const { hasCompletedOnboarding, completeOnboarding } = useAppFlow();
  const { setPushNotifications, setReminderNotifications, enableAppLock, setHomeWidgetEnabled, setAppLockDelaySeconds } =
    useUserPreferences();
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [pendingLockMethod, setPendingLockMethod] = useState<AppLockMethod>('none');

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  if (hasCompletedOnboarding) {
    return <Redirect href="/(main)" />;
  }

  async function finishOnboarding() {
    await completeOnboarding();
    await markSkipAppLockOnce();
    router.replace('/(main)');
  }

  async function applyAppLockMethod(method: AppLockMethod) {
    if (method === 'none') return;

    if (method === 'biometric') {
      const capability = await getBiometricCapability();
      if (!capability.isAvailable) {
        showAppAlert(
          'No disponible',
          `${capability.label} no está listo en este dispositivo. Elige PIN o continúa sin bloqueo.`,
        );
        return false;
      }
      await enableAppLock('biometric');
      return true;
    }

    setPendingLockMethod('pin');
    setShowPinSetup(true);
    return false;
  }

  async function handleComplete({
    notificationsEnabled,
    appLockMethod,
    appLockDelaySeconds,
    homeWidgetEnabled,
  }: {
    notificationsEnabled: boolean;
    appLockMethod: AppLockMethod;
    appLockDelaySeconds: AppLockDelaySeconds;
    homeWidgetEnabled: boolean;
  }) {
    if (notificationsEnabled) {
      await ensureNotificationPermissions();
    }
    await setPushNotifications(notificationsEnabled);
    await setReminderNotifications(notificationsEnabled);
    await setHomeWidgetEnabled(homeWidgetEnabled);
    await setAppLockDelaySeconds(appLockDelaySeconds);

    if (homeWidgetEnabled) {
      await AsyncStorage.setItem(HOME_WIDGET_SETUP_PENDING_KEY, 'true');
    }

    if (appLockMethod === 'none') {
      await finishOnboarding();
      return;
    }

    const applied = await applyAppLockMethod(appLockMethod);
    if (applied) {
      await finishOnboarding();
    }
  }

  async function handlePinSetupComplete() {
    await enableAppLock('pin');
    setShowPinSetup(false);
    await finishOnboarding();
  }

  return (
    <>
      <OnboardingScreen userName={user?.name} onComplete={handleComplete} />
      <AppLockPinSetup
        visible={showPinSetup}
        title="Crea tu PIN"
        onComplete={handlePinSetupComplete}
        onCancel={() => {
          setShowPinSetup(false);
          if (pendingLockMethod === 'pin') {
            void finishOnboarding();
          }
        }}
      />
    </>
  );
}
