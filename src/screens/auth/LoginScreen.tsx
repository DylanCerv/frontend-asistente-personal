import { useState } from 'react';

import { AuthOptionsSection } from '@/components/auth/auth-options-section';
import { AuthScreenShell } from '@/components/auth/auth-screen-shell';
import { AuthStepHeader } from '@/components/auth/auth-step-header';
import { AuthSwitchLink } from '@/components/auth/auth-switch-link';
import { AuthWelcomeHero } from '@/components/auth/auth-welcome-hero';
import { LoginEmailForm } from '@/components/auth/login-email-form';

type LoginScreenProps = {
  onSignIn?: (credentials: { email: string; password: string }) => void;
  onGoogleSignIn?: () => void;
  onRegister?: () => void;
  onBackFromEmailForm?: () => void;
  loading?: boolean;
  error?: string;
};

export function LoginScreen({
  onSignIn,
  onRegister,
  onBackFromEmailForm,
  loading = false,
  error,
}: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showEmailForm, setShowEmailForm] = useState(false);

  function handleSignIn() {
    onSignIn?.({ email: email.trim(), password });
  }

  function handleBackFromEmailForm() {
    setShowEmailForm(false);
    onBackFromEmailForm?.();
  }

  return (
    <AuthScreenShell onBack={showEmailForm ? handleBackFromEmailForm : undefined}>
      {showEmailForm ? (
        <>
          <AuthStepHeader
            icon="mail-outline"
            title="Iniciar sesión"
            subtitle="Ingresa tus credenciales para continuar."
          />

          <LoginEmailForm
            email={email}
            password={password}
            onEmailChange={setEmail}
            onPasswordChange={setPassword}
            onSubmit={handleSignIn}
            loading={loading}
            error={error}
          />

          <AuthSwitchLink
            text="¿No tienes cuenta?"
            actionLabel="Regístrate"
            onPress={onRegister}
          />
        </>
      ) : (
        <>
          <AuthWelcomeHero />

          <AuthOptionsSection
            emailButtonLabel="Continuar con tu correo"
            onEmailPress={() => setShowEmailForm(true)}
            loading={loading}
            error={error}
          />

          <AuthSwitchLink
            text="¿No tienes cuenta?"
            actionLabel="Regístrate"
            onPress={onRegister}
          />
        </>
      )}
    </AuthScreenShell>
  );
}
