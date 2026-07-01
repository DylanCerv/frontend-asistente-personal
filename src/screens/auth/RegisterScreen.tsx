import { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/text-input';

type RegisterScreenProps = {
  onSignUp?: (data: { name: string; email: string; password: string }) => void;
  onSignIn?: () => void;
  loading?: boolean;
  error?: string;
};

export function RegisterScreen({
  onSignUp,
  onSignIn,
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

  return (
    <SafeAreaView className="flex-1 bg-canvas dark:bg-canvas-dark">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1">
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerClassName="flex-grow justify-center px-6 py-8">
          <View className="mb-4 flex-row justify-end">
            <ThemeToggle compact />
          </View>

          <View className="w-full max-w-md gap-8 self-center">
            <View className="items-center gap-3">
              <View className="h-14 w-14 items-center justify-center rounded-2xl bg-muted dark:bg-muted-dark">
                <Text className="text-2xl">✦</Text>
              </View>
              <Text className="text-center text-[28px] font-bold tracking-tight text-foreground dark:text-foreground-dark">
                Crea tu cuenta
              </Text>
            </View>

            <View className="gap-4 rounded-2xl border border-border bg-surface p-6 dark:border-border-dark dark:bg-surface-dark">
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
                onChangeText={setConfirmPassword}
                placeholder="••••••••"
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

              {error ? (
                <Text className="text-center text-sm text-danger dark:text-danger-dark">{error}</Text>
              ) : null}

              <Button
                label="Crear cuenta"
                onPress={handleSignUp}
                loading={loading}
                disabled={!canSubmit}
              />
            </View>

            <Pressable
              accessibilityRole="button"
              onPress={onSignIn}
              className="items-center py-2 active:opacity-70">
              <Text className="text-center text-sm text-subtle dark:text-subtle-dark">
                ¿Ya tienes cuenta?{' '}
                <Text className="font-semibold text-brand dark:text-brand-dark">Inicia sesión</Text>
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
