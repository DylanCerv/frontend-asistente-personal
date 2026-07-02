import { useRef, useState } from 'react';
import { Text, TextInput } from 'react-native';

import { AuthCard } from '@/components/auth/auth-card';
import { AuthErrorBanner } from '@/components/auth/auth-error-banner';
import { AuthFooterLink } from '@/components/auth/auth-footer-link';
import { AuthHeader } from '@/components/auth/auth-header';
import { AuthLayout } from '@/components/auth/auth-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/text-input';

type RegisterScreenProps = {
  onSignUp?: (data: { name: string; email: string; password: string }) => void;
  onSignIn?: () => void;
  onBack?: () => void;
  loading?: boolean;
  error?: string;
};

export function RegisterScreen({
  onSignUp,
  onSignIn,
  onBack,
  loading = false,
  error,
}: RegisterScreenProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);

  const passwordsMatch = password === confirmPassword;
  const passwordLongEnough = password.length >= 8;
  const canSubmit =
    name.trim().length > 0 &&
    email.trim().length > 0 &&
    passwordLongEnough &&
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

  return (
    <AuthLayout onBack={onBack}>
      <AuthHeader
        title="Crea tu cuenta"
        subtitle="Empieza a organizar tu día con tu asistente inteligente"
      />

      <AuthCard>
        <Input
          label="Nombre"
          value={name}
          onChangeText={setName}
          placeholder="Tu nombre"
          autoCapitalize="words"
          autoComplete="name"
          textContentType="name"
          returnKeyType="next"
          onSubmitEditing={() => emailRef.current?.focus()}
        />

        <Input
          ref={emailRef}
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
            placeholder="Mínimo 8 caracteres"
            secureTextEntry
            autoCapitalize="none"
            autoComplete="new-password"
            textContentType="newPassword"
            returnKeyType="next"
            onSubmitEditing={() => confirmPasswordRef.current?.focus()}
            error={
              password.length > 0 && !passwordLongEnough
                ? 'La contraseña debe tener al menos 8 caracteres'
                : undefined
            }
          />

        <Input
          ref={confirmPasswordRef}
          label="Confirmar contraseña"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Repite tu contraseña"
          secureTextEntry
          autoCapitalize="none"
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="done"
          onSubmitEditing={handleSignUp}
          error={
            confirmPassword.length > 0 && !passwordsMatch
              ? 'Las contraseñas no coinciden'
              : undefined
          }
        />

        {error ? <AuthErrorBanner message={error} /> : null}

        <Button
          label="Crear cuenta"
          onPress={handleSignUp}
          loading={loading}
          disabled={!canSubmit}
        />

        <Text className="text-center text-xs leading-5 text-subtle dark:text-subtle-dark">
          Al registrarte aceptas usar tu cuenta para acceder al asistente personal.
        </Text>
      </AuthCard>

      <AuthFooterLink
        text="¿Ya tienes cuenta?"
        actionLabel="Inicia sesión"
        onPress={onSignIn}
      />
    </AuthLayout>
  );
}
