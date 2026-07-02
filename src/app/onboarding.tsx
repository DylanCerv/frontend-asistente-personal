import { Redirect, useRouter } from 'expo-router';

import { useAppFlow } from '@/context/app-flow-context';
import { useAuth } from '@/context/auth-context';
import { useUserPreferences } from '@/context/user-preferences-context';
import { ensureNotificationPermissions } from '@/services/reminders/reminder-notifications';
import { OnboardingScreen } from '@/screens/OnboardingScreen';

export default function OnboardingRoute() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const { hasCompletedOnboarding, completeOnboarding } = useAppFlow();
  const { setPushNotifications, setReminderNotifications } = useUserPreferences();

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  if (hasCompletedOnboarding) {
    return <Redirect href="/" />;
  }

  async function handleComplete({ notificationsEnabled }: { notificationsEnabled: boolean }) {
    if (notificationsEnabled) {
      await ensureNotificationPermissions();
    }
    await setPushNotifications(notificationsEnabled);
    await setReminderNotifications(notificationsEnabled);
    await completeOnboarding();
    router.replace('/');
  }

  return <OnboardingScreen userName={user?.name} onComplete={handleComplete} />;
}
