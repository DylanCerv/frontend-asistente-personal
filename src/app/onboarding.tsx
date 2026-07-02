import { Redirect, useRouter } from 'expo-router';

import { useAppFlow } from '@/context/app-flow-context';
import { OnboardingScreen } from '@/screens/OnboardingScreen';

export default function OnboardingRoute() {
  const router = useRouter();
  const { hasCompletedOnboarding, completeOnboarding } = useAppFlow();

  if (hasCompletedOnboarding) {
    return <Redirect href="/login" />;
  }

  async function handleComplete() {
    await completeOnboarding();
    router.replace('/login');
  }

  return <OnboardingScreen onComplete={handleComplete} />;
}
