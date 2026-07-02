import { Redirect, useRouter } from 'expo-router';
import { useState } from 'react';

import { useAuth } from '@/context/auth-context';
import { LoginScreen } from '@/screens/auth/LoginScreen';

export default function LoginRoute() {
  const router = useRouter();
  const { isAuthenticated, isLoading, signIn } = useAuth();
  const [error, setError] = useState<string | null>(null);

  if (isAuthenticated) {
    return <Redirect href="/" />;
  }

  async function handleSignIn(credentials: { email: string; password: string }) {
    try {
      setError(null);
      await signIn(credentials);
      router.replace('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Credenciales incorrectas. Intenta de nuevo.');
    }
  }

  return (
    <LoginScreen
      onSignIn={handleSignIn}
      onRegister={() => router.push('/register')}
      loading={isLoading}
      error={error ?? undefined}
    />
  );
}
