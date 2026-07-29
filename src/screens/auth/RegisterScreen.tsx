import Ionicons from '@react-native-vector-icons/ionicons';
import { StatusBar } from 'expo-status-bar';
import { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuthDivider, AuthPrimaryButton } from '@/components/auth/auth-controls';
import { AuthField } from '@/components/auth/auth-field';
import { SocialAuthButton } from '@/components/auth/social-auth-button';
import { KivoLogo } from '@/components/kivo-logo';
import {
  APP_ACCENT,
  APP_ACCENT_SOFT,
  APP_BACKGROUND,
  APP_ON_ACCENT,
  APP_SURFACE,
  APP_TEXT_DIM,
  APP_TEXT_MUTED,
} from '@/constants/app-colors';
import { APP_NAME } from '@/constants/branding';

const REGISTER_TAGLINE = 'Inteligencia cinética para tu flujo creativo.';

type RegisterScreenProps = {
  onSignUp?: (data: { name: string; email: string; password: string }) => void;
  onGoogleSignIn?: () => void;
  onSignIn?: () => void;
  onBackFromEmailForm?: () => void;
  loading?: boolean;
  error?: string;
};

export function RegisterScreen({
  onSignUp,
  onGoogleSignIn,
  onSignIn,
  loading = false,
  error,
}: RegisterScreenProps) {
  const insets = useSafeAreaInsets();
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const canSubmit =
    name.trim().length > 0 &&
    email.trim().length > 0 &&
    password.length > 0 &&
    acceptedTerms;

  function handleSignUp() {
    if (!canSubmit) return;
    onSignUp?.({
      name: name.trim(),
      email: email.trim(),
      password,
    });
  }

  return (
    <SafeAreaView style={styles.root} edges={['bottom']}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
          style={styles.flex}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + 16, paddingBottom: Math.max(insets.bottom, 20) },
          ]}>
          <View style={styles.brandBlock}>
            <KivoLogo size={64} color={APP_ACCENT} foldColor={APP_ACCENT_SOFT} />
            <Text style={styles.brandName}>{APP_NAME}</Text>
            <Text style={styles.tagline}>{REGISTER_TAGLINE}</Text>
          </View>

          <View style={styles.card}>
            <SocialAuthButton
              label="Continuar con Google"
              onPress={onGoogleSignIn}
              loading={loading}
              disabled={loading}
            />

            <AuthDivider label="O regístrate con email" withLines={false} />

            <AuthField
              label="Nombre completo"
              leftIcon="person-outline"
              value={name}
              onChangeText={setName}
              placeholder="Tu nombre"
              autoCapitalize="words"
              autoComplete="name"
              textContentType="name"
              returnKeyType="next"
              onSubmitEditing={() => emailRef.current?.focus()}
            />

            <AuthField
              ref={emailRef}
              label="Correo electrónico"
              leftIcon="mail-outline"
              value={email}
              onChangeText={setEmail}
              placeholder="nombre@ejemplo.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="emailAddress"
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
            />

            <AuthField
              ref={passwordRef}
              label="Contraseña"
              leftIcon="lock-closed-outline"
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secureTextEntry
              autoCapitalize="none"
              autoComplete="new-password"
              textContentType="newPassword"
              returnKeyType="done"
              onSubmitEditing={canSubmit ? handleSignUp : undefined}
            />

            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: acceptedTerms }}
              onPress={() => setAcceptedTerms((value) => !value)}
              style={({ pressed }) => [styles.termsRow, pressed && styles.pressed]}>
              <View style={[styles.checkbox, acceptedTerms && styles.checkboxChecked]}>
                {acceptedTerms ? (
                  <Ionicons name="checkmark" size={14} color={APP_ON_ACCENT} />
                ) : null}
              </View>
              <Text style={styles.termsText}>
                Acepto los <Text style={styles.termsLink}>Términos de Servicio</Text> y la{' '}
                <Text style={styles.termsLink}>Política de Privacidad</Text>.
              </Text>
            </Pressable>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <AuthPrimaryButton
              label="Crear Cuenta"
              showArrow
              onPress={handleSignUp}
              loading={loading}
              disabled={!canSubmit}
            />

            <Pressable
              accessibilityRole="button"
              onPress={onSignIn}
              style={({ pressed }) => [styles.signInLink, pressed && styles.pressed]}>
              <Text style={styles.signInText}>
                ¿Ya tienes una cuenta? <Text style={styles.signInAction}>Inicia Sesión</Text>
              </Text>
            </Pressable>
          </View>

          <View style={styles.trustRow}>
            <View style={styles.trustItem}>
              <Ionicons name="shield-checkmark-outline" size={14} color={APP_TEXT_DIM} />
              <Text style={styles.trustLabel}>Encriptación 256-bit</Text>
            </View>
            <View style={styles.trustItem}>
              <Ionicons name="headset-outline" size={14} color={APP_TEXT_DIM} />
              <Text style={styles.trustLabel}>Soporte 24/7</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: APP_BACKGROUND,
  },
  flex: {
    flex: 1,
    backgroundColor: APP_BACKGROUND,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  brandBlock: {
    alignItems: 'center',
    gap: 12,
    marginBottom: 28,
  },
  brandName: {
    color: APP_ACCENT,
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  tagline: {
    maxWidth: 280,
    color: APP_TEXT_MUTED,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  card: {
    gap: 20,
    borderRadius: 24,
    backgroundColor: APP_SURFACE,
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  checkbox: {
    marginTop: 2,
    height: 20,
    width: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#3A3A3A',
    backgroundColor: APP_BACKGROUND,
  },
  checkboxChecked: {
    borderColor: APP_ACCENT,
    backgroundColor: APP_ACCENT,
  },
  termsText: {
    flex: 1,
    color: APP_TEXT_MUTED,
    fontSize: 13,
    lineHeight: 20,
  },
  termsLink: {
    color: APP_ACCENT,
    fontWeight: '600',
  },
  error: {
    color: '#F87171',
    fontSize: 14,
    textAlign: 'center',
  },
  signInLink: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  signInText: {
    color: APP_TEXT_MUTED,
    fontSize: 14,
    textAlign: 'center',
  },
  signInAction: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  trustRow: {
    marginTop: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  trustLabel: {
    color: APP_TEXT_DIM,
    fontSize: 11,
  },
  pressed: {
    opacity: 0.8,
  },
});
