import { Redirect, useRouter } from 'expo-router';
import { useState } from 'react';

import { useAppFlow } from '@/context/app-flow-context';
import { useAuth } from '@/context/auth-context';
import { LoginScreen } from '@/screens/auth/LoginScreen';

export default function LoginRoute() {
  const router = useRouter();
  const { isAuthenticated, isLoading, signIn } = useAuth();
  const { hasCompletedOnboarding, completeOnboarding } = useAppFlow();
  const [error, setError] = useState<string | null>(null);

  if (isAuthenticated) {
    return <Redirect href={hasCompletedOnboarding ? '/(main)' : '/onboarding'} />;
  }

  async function handleSignIn(credentials: { email: string; password: string }) {
    try {
      setError(null);
      await signIn(credentials);
      await completeOnboarding();
      router.replace('/(main)');
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Credenciales incorrectas');
    }
  }

  return (
    <LoginScreen
      onSignIn={handleSignIn}
      onRegister={() => router.push('/register')}
      onBackFromEmailForm={() => setError(null)}
      loading={isLoading}
      error={error ?? undefined}
    />
  );
}
