import { Redirect, useRouter } from 'expo-router';

import { useAppFlow } from '@/context/app-flow-context';
import { useAuth } from '@/context/auth-context';
import { WelcomeScreen } from '@/screens/WelcomeScreen';
import { showAppAlert } from '@/services/app-dialog';

export default function WelcomeRoute() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { hasCompletedOnboarding } = useAppFlow();

  if (isAuthenticated) {
    return <Redirect href={hasCompletedOnboarding ? '/(main)' : '/onboarding'} />;
  }

  return (
    <WelcomeScreen
      onStart={() => router.push('/register')}
      onSignIn={() => router.push('/login')}
      onHelp={() =>
        showAppAlert(
          'Ayuda',
          'Si tienes problemas para entrar, usa “Ya tengo una cuenta” o crea una nueva con Empezar.',
        )
      }
    />
  );
}
