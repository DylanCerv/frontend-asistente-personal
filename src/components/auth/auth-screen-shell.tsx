import type { ReactNode } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuthBackButton } from '@/components/auth/auth-back-button';
import {
  APP_ACCENT,
  APP_BACKGROUND,
  APP_SURFACE,
  APP_TEXT_DIM,
} from '@/constants/app-colors';
import { APP_NAME } from '@/constants/branding';

type AuthScreenShellProps = {
  children: ReactNode;
  onBack?: () => void;
};

export function AuthScreenShell({ children, onBack }: AuthScreenShellProps) {
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={styles.root} edges={['bottom']}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}>
        <View style={[styles.flex, { paddingTop: insets.top + 8 }]}>
          <View style={styles.header}>
            {onBack ? <AuthBackButton onPress={onBack} /> : <View style={styles.headerSide} />}
            <Text style={styles.brand}>{APP_NAME}</Text>
            <View style={styles.headerSide} />
          </View>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            bounces={false}
            style={styles.flex}>
            <View style={styles.card}>{children}</View>
          </ScrollView>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Al continuar, aceptas nuestros{' '}
              <Text style={styles.footerLink}>Términos de Servicio</Text> y{' '}
              <Text style={styles.footerLink}>Política de Privacidad</Text>.
            </Text>
          </View>
        </View>
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
  header: {
    height: 44,
    marginBottom: 24,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerSide: {
    height: 44,
    width: 44,
  },
  brand: {
    flex: 1,
    color: APP_ACCENT,
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  card: {
    width: '100%',
    maxWidth: 448,
    alignSelf: 'center',
    gap: 24,
    borderRadius: 28,
    backgroundColor: APP_SURFACE,
    paddingHorizontal: 20,
    paddingVertical: 28,
  },
  footer: {
    paddingHorizontal: 32,
    paddingTop: 8,
    paddingBottom: 12,
  },
  footerText: {
    color: APP_TEXT_DIM,
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
  },
  footerLink: {
    textDecorationLine: 'underline',
  },
});
