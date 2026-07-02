import { useRef } from 'react';
import { Text, TextInput } from 'react-native';

import { AuthFormCard } from '@/components/auth/auth-form-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/text-input';

type RegisterEmailFormProps = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  onNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onSubmit?: () => void;
  loading?: boolean;
  error?: string;
};

export function RegisterEmailForm({
  name,
  email,
  password,
  confirmPassword,
  onNameChange,
  onEmailChange,
  onPasswordChange,
  onConfirmPasswordChange,
  onSubmit,
  loading = false,
  error,
}: RegisterEmailFormProps) {
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);

  const passwordsMatch = password === confirmPassword;
  const canSubmit =
    name.trim().length > 0 &&
    email.trim().length > 0 &&
    password.length > 0 &&
    confirmPassword.length > 0 &&
    passwordsMatch;

  return (
    <AuthFormCard>
      <Input
        label="Nombre"
        value={name}
        onChangeText={onNameChange}
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
        onChangeText={onEmailChange}
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
        onChangeText={onPasswordChange}
        placeholder="••••••••"
        secureTextEntry
        autoCapitalize="none"
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="next"
        onSubmitEditing={() => confirmPasswordRef.current?.focus()}
      />

      <Input
        ref={confirmPasswordRef}
        label="Confirmar contraseña"
        value={confirmPassword}
        onChangeText={onConfirmPasswordChange}
        placeholder="••••••••"
        secureTextEntry
        autoCapitalize="none"
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="done"
        onSubmitEditing={canSubmit ? onSubmit : undefined}
        error={
          confirmPassword.length > 0 && !passwordsMatch
            ? 'Las contraseñas no coinciden'
            : undefined
        }
      />

      {error ? (
        <Text className="text-center text-sm text-danger dark:text-danger-dark">{error}</Text>
      ) : null}

      <Button
        label="Crear cuenta"
        onPress={onSubmit}
        loading={loading}
        disabled={!canSubmit}
      />
    </AuthFormCard>
  );
}
