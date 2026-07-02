import { useState } from 'react';

import { AuthScreenShell } from '@/components/auth/auth-screen-shell';
import { AuthStepHeader } from '@/components/auth/auth-step-header';
import { AuthSwitchLink } from '@/components/auth/auth-switch-link';
import { RegisterEmailForm } from '@/components/auth/register-email-form';

type RegisterScreenProps = {
  onSignUp?: (data: { name: string; email: string; password: string }) => void;
  onSignIn?: () => void;
  onBackFromEmailForm?: () => void;
  loading?: boolean;
  error?: string;
};

export function RegisterScreen({
  onSignUp,
  onSignIn,
  onBackFromEmailForm,
  loading = false,
  error,
}: RegisterScreenProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const passwordsMatch = password === confirmPassword;
  const canSubmit =
    name.trim().length > 0 &&
    email.trim().length > 0 &&
    password.length > 0 &&
    confirmPassword.length > 0 &&
    passwordsMatch;

  function handleSignUp() {
    if (!canSubmit) return;
    onSignUp?.({
      name: name.trim(),
      email: email.trim(),
      password,
    });
  }

  function handleBack() {
    onBackFromEmailForm?.();
    onSignIn?.();
  }

  return (
    <AuthScreenShell onBack={handleBack}>
      <AuthStepHeader
        icon="person-add-outline"
        title="Crea tu cuenta"
        subtitle="Completa tus datos para registrarte."
      />

      <RegisterEmailForm
        name={name}
        email={email}
        password={password}
        confirmPassword={confirmPassword}
        onNameChange={setName}
        onEmailChange={setEmail}
        onPasswordChange={setPassword}
        onConfirmPasswordChange={setConfirmPassword}
        onSubmit={handleSignUp}
        loading={loading}
        error={error}
      />

      <AuthSwitchLink
        text="¿Ya tienes cuenta?"
        actionLabel="Inicia sesión"
        onPress={onSignIn}
      />
    </AuthScreenShell>
  );
}
