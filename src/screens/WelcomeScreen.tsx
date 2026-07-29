import Ionicons from '@react-native-vector-icons/ionicons';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { KivoLogo } from '@/components/kivo-logo';
import { APP_ACCENT, APP_BACKGROUND } from '@/constants/app-colors';
import { APP_NAME } from '@/constants/branding';

const ACCENT = APP_ACCENT;
const BACKGROUND = APP_BACKGROUND;

const FEATURES = [
  { label: 'Rápido', icon: 'flash-outline' as const, color: '#2DD4BF' },
  { label: 'Privado', icon: 'shield-checkmark-outline' as const, color: '#A78BFA' },
  { label: 'Inteligente', icon: 'sparkles-outline' as const, color: '#C4B5FD' },
] as const;

type WelcomeScreenProps = {
  onStart?: () => void;
  onSignIn?: () => void;
  onHelp?: () => void;
};

export function WelcomeScreen({ onStart, onSignIn, onHelp }: WelcomeScreenProps) {
  const insets = useSafeAreaInsets();
  const floatY = useSharedValue(0);

  useEffect(() => {
    floatY.value = withDelay(
      400,
      withRepeat(
        withSequence(
          withTiming(-7, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
          withTiming(7, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        true,
      ),
    );
  }, [floatY]);

  const logoFloatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }],
  }));

  return (
    <SafeAreaView style={styles.root} edges={['bottom']}>
      <StatusBar style="light" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        bounces={false}
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 12, paddingBottom: Math.max(insets.bottom, 16) },
        ]}>
        <View style={styles.header}>
          <Text style={styles.brand}>{APP_NAME}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ayuda"
            onPress={onHelp}
            hitSlop={10}
            style={({ pressed }) => (pressed ? styles.pressed : undefined)}>
            <Text style={styles.help}>Ayuda</Text>
          </Pressable>
        </View>

        <Animated.View
          entering={FadeInDown.duration(700).delay(80).easing(Easing.out(Easing.cubic))}
          style={styles.logoSection}>
          <Animated.View style={logoFloatStyle}>
            <KivoLogo size={112} color={ACCENT} foldColor="#A78BFA" />
          </Animated.View>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.duration(650).delay(180).easing(Easing.out(Easing.cubic))}
          style={styles.copySection}>
          <Text style={styles.title}>Saca todo de tu cabeza</Text>
          <Text style={styles.subtitle}>
            Kivo organiza tus pendientes y te ayuda a enfocarte en lo que importa ahora.
          </Text>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.duration(650).delay(280).easing(Easing.out(Easing.cubic))}
          style={styles.actions}>
          <View style={[styles.buttonShell, styles.primaryShell]}>
            <Pressable
              accessibilityRole="button"
              onPress={onStart}
              style={({ pressed }) => (pressed ? styles.pressed : undefined)}>
              <View style={styles.buttonContent}>
                <Text style={styles.primaryLabel}>Empezar</Text>
                <Ionicons name="chevron-forward" size={18} color="#1A0B2E" />
              </View>
            </Pressable>
          </View>

          <View style={[styles.buttonShell, styles.secondaryShell]}>
            <Pressable
              accessibilityRole="button"
              onPress={onSignIn}
              style={({ pressed }) => (pressed ? styles.pressed : undefined)}>
              <View style={styles.buttonContent}>
                <Text style={styles.secondaryLabel}>Ya tengo una cuenta</Text>
              </View>
            </Pressable>
          </View>
        </Animated.View>

        <Animated.View entering={FadeIn.duration(600).delay(420)} style={styles.features}>
          <View style={styles.featuresRow}>
            {FEATURES.slice(0, 2).map((feature) => (
              <FeaturePill key={feature.label} {...feature} />
            ))}
          </View>
          <FeaturePill {...FEATURES[2]} />
        </Animated.View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            © {new Date().getFullYear()} Kivo AI. Todos los derechos reservados.
          </Text>
          <View style={styles.footerLinks}>
            <Text style={styles.footerText}>Privacidad</Text>
            <Text style={styles.footerText}>Términos</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function FeaturePill({
  label,
  icon,
  color,
}: {
  label: string;
  icon: (typeof FEATURES)[number]['icon'];
  color: string;
}) {
  return (
    <View style={styles.pill}>
      <Ionicons name={icon} size={13} color={color} />
      <Text style={styles.pillLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BACKGROUND,
  },
  scroll: {
    flex: 1,
    backgroundColor: BACKGROUND,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  header: {
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: {
    color: ACCENT,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  help: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 14,
  },
  logoSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    marginBottom: 36,
    paddingVertical: 20,
  },
  copySection: {
    alignItems: 'center',
    gap: 12,
    marginBottom: 28,
    paddingHorizontal: 8,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '700',
    lineHeight: 36,
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  subtitle: {
    maxWidth: 320,
    color: 'rgba(255,255,255,0.7)',
    fontSize: 15,
    lineHeight: 24,
    textAlign: 'center',
  },
  actions: {
    alignSelf: 'stretch',
    gap: 12,
    marginBottom: 24,
  },
  buttonShell: {
    alignSelf: 'stretch',
    minHeight: 52,
    borderRadius: 16,
    overflow: 'hidden',
  },
  primaryShell: {
    backgroundColor: ACCENT,
  },
  secondaryShell: {
    backgroundColor: '#2A2A2A',
  },
  buttonHit: {
    minHeight: 52,
  },
  buttonContent: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  primaryLabel: {
    color: '#1A0B2E',
    fontSize: 15,
    fontWeight: '700',
    marginRight: 8,
  },
  secondaryLabel: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  features: {
    alignItems: 'center',
    gap: 10,
    marginBottom: 36,
  },
  featuresRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    backgroundColor: '#1A1A22',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  pillLabel: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 12,
    fontWeight: '500',
  },
  footer: {
    marginTop: 'auto',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 8,
  },
  footerLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  footerText: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 11,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.85,
  },
});
