import { useRef } from 'react';
import { Text, TextInput } from 'react-native';

import { AuthFormCard } from '@/components/auth/auth-form-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/text-input';

type LoginEmailFormProps = {
  email: string;
  password: string;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit?: () => void;
  loading?: boolean;
  error?: string;
};

export function LoginEmailForm({
  email,
  password,
  onEmailChange,
  onPasswordChange,
  onSubmit,
  loading = false,
  error,
}: LoginEmailFormProps) {
  const passwordRef = useRef<TextInput>(null);

  return (
    <AuthFormCard>
      <Input
        label="Email"
        value={email}
        onChangeText={onEmailChange}
        placeholder="kivo@kivo.com"
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
        autoComplete="password"
        textContentType="password"
        returnKeyType="done"
        onSubmitEditing={onSubmit}
      />

      {error ? (
        <Text className="text-center text-sm text-danger dark:text-danger-dark">{error}</Text>
      ) : null}

      <Button label="Iniciar sesión" onPress={onSubmit} loading={loading} />
    </AuthFormCard>
  );
}
