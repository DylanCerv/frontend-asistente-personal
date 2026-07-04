import { Redirect, useRouter } from 'expo-router';
import { useState } from 'react';

import { useAppFlow } from '@/context/app-flow-context';
import { useAuth } from '@/context/auth-context';
import { useUserPreferences } from '@/context/user-preferences-context';
import { RegisterScreen } from '@/screens/auth/RegisterScreen';

export default function RegisterRoute() {
  const router = useRouter();
  const { isAuthenticated, isLoading, signUp } = useAuth();
  const { setPreferredName } = useUserPreferences();
  const { hasCompletedOnboarding, beginOnboarding } = useAppFlow();
  const [error, setError] = useState<string | null>(null);

  if (isAuthenticated) {
    return <Redirect href={hasCompletedOnboarding ? '/(main)' : '/onboarding'} />;
  }

  async function handleSignUp(data: { name: string; email: string; password: string }) {
    try {
      setError(null);
      await signUp(data);
      await setPreferredName(data.name.trim());
      await beginOnboarding();
      router.replace('/onboarding');
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : 'No se pudo crear la cuenta. Intenta de nuevo.',
      );
    }
  }

  return (
    <RegisterScreen
      onSignUp={handleSignUp}
      onSignIn={() => router.replace('/login')}
      onBackFromEmailForm={() => setError(null)}
      loading={isLoading}
      error={error ?? undefined}
    />
  );
}
