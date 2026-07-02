import { Redirect, useRouter } from 'expo-router';
import { useState } from 'react';

import { useAuth } from '@/context/auth-context';
import { LoginScreen } from '@/screens/auth/LoginScreen';

export default function LoginRoute() {
  const router = useRouter();
  const { isAuthenticated, isLoading, signIn, signInWithGoogle } = useAuth();
  const [error, setError] = useState<string | null>(null);

  if (isAuthenticated) {
    return <Redirect href="/" />;
  }

  async function handleSignIn(credentials: { email: string; password: string }) {
    try {
      setError(null);
      await signIn(credentials);
      router.replace('/');
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Credenciales incorrectas');
    }
  }

  async function handleGoogleSignIn() {
    try {
      setError(null);
      await signInWithGoogle();
      router.replace('/');
    } catch {
      setError('No se pudo iniciar sesión con Google.');
    }
  }

  return (
    <LoginScreen
      onSignIn={handleSignIn}
      onGoogleSignIn={handleGoogleSignIn}
      onRegister={() => router.push('/register')}
      loading={isLoading}
      error={error ?? undefined}
    />
  );
}
