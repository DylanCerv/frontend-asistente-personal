import { useState } from 'react';
import { Text, View } from 'react-native';

import { AuthDivider, AuthPrimaryButton } from '@/components/auth/auth-controls';
import { AuthField } from '@/components/auth/auth-field';
import { AuthScreenShell } from '@/components/auth/auth-screen-shell';
import { AuthSwitchLink } from '@/components/auth/auth-switch-link';
import { SocialAuthButton } from '@/components/auth/social-auth-button';

/** Temporarily hide Google auth until OAuth is ready to ship. */
const SHOW_GOOGLE_AUTH = false;

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
  onGoogleSignIn,
  onRegister,
  onBackFromEmailForm,
  loading = false,
  error,
}: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPasswordStep, setShowPasswordStep] = useState(false);

  const trimmedEmail = email.trim();
  const canContinueWithEmail = trimmedEmail.length > 0 && trimmedEmail.includes('@');

  function handleContinueWithEmail() {
    if (!canContinueWithEmail) return;
    setShowPasswordStep(true);
  }

  function handleSignIn() {
    onSignIn?.({ email: trimmedEmail, password });
  }

  function handleBackFromPassword() {
    setShowPasswordStep(false);
    setPassword('');
    onBackFromEmailForm?.();
  }

  return (
    <AuthScreenShell onBack={showPasswordStep ? handleBackFromPassword : undefined}>
      {showPasswordStep ? (
        <View className="gap-6">
          <View className="gap-2">
            <Text className="text-[28px] font-bold tracking-tight text-white">
              Ingresa tu contraseña
            </Text>
            <Text className="text-[15px] leading-6 text-[#8A8A8A]">{trimmedEmail}</Text>
          </View>

          <AuthField
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
            autoFocus
          />

          {error ? (
            <Text className="text-center text-sm text-[#F87171]">{error}</Text>
          ) : null}

          <AuthPrimaryButton
            label="Iniciar sesión"
            onPress={handleSignIn}
            loading={loading}
            disabled={password.length === 0}
          />

          <AuthSwitchLink
            text="¿No tienes cuenta?"
            actionLabel="Regístrate gratis"
            onPress={onRegister}
          />
        </View>
      ) : (
        <View className="gap-6">
          <View className="gap-2">
            <Text className="text-[28px] font-bold tracking-tight text-white">
              Bienvenido de nuevo
            </Text>
            <Text className="text-[15px] leading-6 text-[#8A8A8A]">
              Tu asistente te está esperando.
            </Text>
          </View>

          {SHOW_GOOGLE_AUTH ? (
            <>
              <SocialAuthButton
                label="Continuar con Google"
                onPress={onGoogleSignIn}
                loading={loading}
                disabled={loading}
              />
              <AuthDivider />
            </>
          ) : null}

          <AuthField
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="nombre@ejemplo.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
            returnKeyType="next"
            onSubmitEditing={handleContinueWithEmail}
          />

          {error ? (
            <Text className="text-center text-sm text-[#F87171]">{error}</Text>
          ) : null}

          <AuthPrimaryButton
            label="Continuar con Email"
            onPress={handleContinueWithEmail}
            disabled={!canContinueWithEmail || loading}
          />

          <AuthSwitchLink
            text="¿No tienes cuenta?"
            actionLabel="Regístrate gratis"
            onPress={onRegister}
          />
        </View>
      )}
    </AuthScreenShell>
  );
}
