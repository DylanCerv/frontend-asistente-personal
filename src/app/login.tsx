import { Redirect, useRouter } from 'expo-router';
import { useState } from 'react';

import { useAppFlow } from '@/context/app-flow-context';
import { useAuth } from '@/context/auth-context';
import { LoginScreen } from '@/screens/auth/LoginScreen';

export default function LoginRoute() {
  const router = useRouter();
  const { isAuthenticated, isLoading, signIn, signInWithGoogle, signInWithApple } = useAuth();
  const { hasCompletedSetup } = useAppFlow();
  const [error, setError] = useState<string | null>(null);

  if (isAuthenticated) {
    return <Redirect href={hasCompletedSetup ? '/' : '/setup'} />;
  }

  async function handleSignIn(credentials: { email: string; password: string }) {
    try {
      setError(null);
      await signIn(credentials);
      router.replace('/setup');
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Credenciales incorrectas');
    }
  }

  async function handleGoogleSignIn() {
    try {
      setError(null);
      await signInWithGoogle();
      router.replace('/setup');
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : 'No se pudo iniciar sesión con Google.',
      );
    }
  }

  async function handleAppleSignIn() {
    try {
      setError(null);
      await signInWithApple();
      router.replace('/setup');
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : 'No se pudo iniciar sesión con Apple.',
      );
    }
  }

  return (
    <LoginScreen
      onSignIn={handleSignIn}
      onGoogleSignIn={handleGoogleSignIn}
      onAppleSignIn={handleAppleSignIn}
      onRegister={() => router.push('/register')}
      loading={isLoading}
      error={error ?? undefined}
    />
  );
}
