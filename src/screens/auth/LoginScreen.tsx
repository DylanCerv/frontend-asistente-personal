import { useRef, useState } from 'react';
import { TextInput } from 'react-native';

import { AuthCard } from '@/components/auth/auth-card';
import { AuthErrorBanner } from '@/components/auth/auth-error-banner';
import { AuthFooterLink } from '@/components/auth/auth-footer-link';
import { AuthHeader } from '@/components/auth/auth-header';
import { AuthLayout } from '@/components/auth/auth-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/text-input';

type LoginScreenProps = {
  onSignIn?: (credentials: { email: string; password: string }) => void;
  onRegister?: () => void;
  loading?: boolean;
  error?: string;
};

export function LoginScreen({
  onSignIn,
  onRegister,
  loading = false,
  error,
}: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const passwordRef = useRef<TextInput>(null);

  const canSubmit = email.trim().length > 0 && password.length > 0;

  function handleSignIn() {
    if (!canSubmit) return;
    onSignIn?.({ email: email.trim(), password });
  }

  return (
    <AuthLayout>
      <AuthHeader
        title="Bienvenido de nuevo"
        subtitle="Inicia sesión para continuar con tu asistente personal"
      />

      <AuthCard>
        <Input
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="tu@email.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          textContentType="emailAddress"
          returnKeyType="next"
          onSubmitEditing={() => passwordRef.current?.focus()}
        />

        <Input
          ref={passwordRef}
          label="Contraseña"
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          secureTextEntry
          autoCapitalize="none"
          autoComplete="password"
          textContentType="password"
          returnKeyType="done"
          onSubmitEditing={handleSignIn}
        />

        {error ? <AuthErrorBanner message={error} /> : null}

        <Button
          label="Iniciar sesión"
          onPress={handleSignIn}
          loading={loading}
          disabled={!canSubmit}
        />
      </AuthCard>

      <AuthFooterLink
        text="¿No tienes cuenta?"
        actionLabel="Regístrate"
        onPress={onRegister}
      />
    </AuthLayout>
  );
}
