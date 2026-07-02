import Ionicons from '@react-native-vector-icons/ionicons';
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
  onAppleSignIn?: () => void;
  onRegister?: () => void;
  loading?: boolean;
  error?: string;
};

export function LoginScreen({
  onSignIn,
  onGoogleSignIn,
  onAppleSignIn,
  onRegister,
  loading = false,
  error,
}: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showEmailForm, setShowEmailForm] = useState(false);
  const passwordRef = useRef<TextInput>(null);

  function handleSignIn() {
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
            <View className="items-center gap-4">
              <View className="h-20 w-20 items-center justify-center rounded-[28px] bg-brand dark:bg-brand-dark">
                <Ionicons name="sparkles" size={40} color="#FFFFFF" />
              </View>
              <View className="items-center gap-2">
                <Text className="text-center text-[30px] font-bold tracking-tight text-foreground dark:text-foreground-dark">
                  Asistente
                </Text>
                <Text className="text-center text-base font-medium text-brand dark:text-brand-dark">
                  Habla. Nosotros organizamos.
                </Text>
                <Text className="max-w-xs text-center text-sm leading-6 text-subtle dark:text-subtle-dark">
                  Tu asistente personal con IA. No organizas tu vida, solo hablas.
                </Text>
              </View>
            </View>

            <View className="gap-3">
              <Button
                label="Continuar con Google"
                variant="secondary"
                onPress={onGoogleSignIn}
                className="border border-border dark:border-border-dark"
              />

              <Button
                label="Continuar con Apple"
                variant="secondary"
                onPress={onAppleSignIn}
                className="border border-border dark:border-border-dark"
              />

              {!showEmailForm ? (
                <Button
                  label="Continuar con correo"
                  variant="ghost"
                  onPress={() => setShowEmailForm(true)}
                />
              ) : (
                <View className="gap-4 rounded-[28px] border border-border bg-surface p-6 dark:border-border-dark dark:bg-surface-dark">
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
                    <Text className="text-center text-sm text-danger dark:text-danger-dark">
                      {error}
                    </Text>
                  ) : null}

                  <Button label="Iniciar sesión" onPress={handleSignIn} loading={loading} />
                </View>
              )}
            </View>

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
