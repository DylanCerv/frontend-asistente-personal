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

type LoginScreenProps = {
  onSignIn?: (credentials: { email: string; password: string }) => void;
  onGoogleSignIn?: () => void;
  onRegister?: () => void;
  loading?: boolean;
  error?: string;
};

export function LoginScreen({
  onSignIn,
  onGoogleSignIn,
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
                Bienvenido de nuevo
              </Text>
            </View>

            <View className="gap-4 rounded-2xl border border-border bg-surface p-6 dark:border-border-dark dark:bg-surface-dark">
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

              {error ? (
                <Text className="text-center text-sm text-danger dark:text-danger-dark">{error}</Text>
              ) : null}

              <Button
                label="Iniciar sesión"
                onPress={handleSignIn}
                loading={loading}
                disabled={!canSubmit}
              />
            </View>

            <View className="flex-row items-center gap-3">
              <View className="h-px flex-1 bg-border dark:bg-border-dark" />
              <Text className="text-sm text-subtle dark:text-subtle-dark">o</Text>
              <View className="h-px flex-1 bg-border dark:bg-border-dark" />
            </View>

            <Button
              label="Continuar con Google"
              variant="secondary"
              onPress={onGoogleSignIn}
              className="border border-border dark:border-border-dark"
            />

            <Pressable
              accessibilityRole="button"
              onPress={onRegister}
              className="items-center py-2 active:opacity-70">
              <Text className="text-center text-sm text-subtle dark:text-subtle-dark">
                ¿No tienes cuenta?{' '}
                <Text className="font-semibold text-brand dark:text-brand-dark">Regístrate</Text>
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
