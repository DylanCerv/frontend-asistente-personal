import { Redirect, useRouter } from 'expo-router';
import { useState } from 'react';

import { useAuth } from '@/context/auth-context';
import { RegisterScreen } from '@/screens/auth/RegisterScreen';

export default function RegisterRoute() {
  const router = useRouter();
  const { isAuthenticated, isLoading, signUp } = useAuth();
  const [error, setError] = useState<string | null>(null);

  if (isAuthenticated) {
    return <Redirect href="/setup" />;
  }

  async function handleSignUp(data: { name: string; email: string; password: string }) {
    try {
      setError(null);
      await signUp(data);
      router.replace('/setup');
    } catch {
      setError('No se pudo crear la cuenta. Intenta de nuevo.');
    }
  }

  return (
    <RegisterScreen
      onSignUp={handleSignUp}
      onSignIn={() => router.replace('/login')}
      loading={isLoading}
      error={error ?? undefined}
    />
  );
}
