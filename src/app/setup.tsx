import { Redirect, useRouter } from 'expo-router';

import { useAppFlow } from '@/context/app-flow-context';
import { useAuth } from '@/context/auth-context';
import { SetupScreen } from '@/screens/SetupScreen';

export default function SetupRoute() {
  const router = useRouter();
  const { isAuthenticated, user, updateDisplayName } = useAuth();
  const { hasCompletedSetup, completeSetup } = useAppFlow();

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  if (hasCompletedSetup) {
    return <Redirect href="/" />;
  }

  async function handleComplete(displayName: string) {
    updateDisplayName(displayName);
    await completeSetup();
    router.replace('/');
  }

  return <SetupScreen onComplete={handleComplete} initialName={user?.name} />;
}
