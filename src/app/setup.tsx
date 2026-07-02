import { Redirect } from 'expo-router';

import { useAppFlow } from '@/context/app-flow-context';
import { useAuth } from '@/context/auth-context';

export default function SetupRedirect() {
  const { isAuthenticated } = useAuth();
  const { hasCompletedOnboarding } = useAppFlow();

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  if (!hasCompletedOnboarding) {
    return <Redirect href="/onboarding" />;
  }

  return <Redirect href="/" />;
}
