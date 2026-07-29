import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { KivoLogo } from '@/components/kivo-logo';
import { APP_ACCENT, APP_BACKGROUND } from '@/constants/app-colors';
import {
  APP_NAME,
  APP_SPLASH_STATUS,
  APP_SPLASH_TAGLINE,
  APP_VERSION_LABEL,
} from '@/constants/branding';

const ACCENT = APP_ACCENT;
const BACKGROUND = APP_BACKGROUND;

export function SplashScreen() {
  const insets = useSafeAreaInsets();
  const floatY = useSharedValue(0);
  const lineScale = useSharedValue(0);
  const lineGlow = useSharedValue(0);

  useEffect(() => {
    floatY.value = withDelay(
      500,
      withRepeat(
        withSequence(
          withTiming(-7, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
          withTiming(7, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        true,
      ),
    );

    lineScale.value = withDelay(
      720,
      withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) }),
    );
    lineGlow.value = withDelay(
      720,
      withTiming(1, { duration: 900, easing: Easing.out(Easing.quad) }),
    );
  }, [floatY, lineGlow, lineScale]);

  const logoFloatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }],
  }));

  const lineStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: lineScale.value }],
    opacity: 0.35 + lineGlow.value * 0.65,
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: lineGlow.value * 0.5,
    transform: [{ scaleX: 0.4 + lineGlow.value * 0.6 }],
  }));

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <View style={styles.background} />

      <View
        style={[
          styles.content,
          { paddingTop: insets.top, paddingBottom: insets.bottom },
        ]}>
        <View style={styles.center}>
          <Animated.View
            entering={FadeInDown.duration(700).delay(60).easing(Easing.out(Easing.cubic))}
            style={styles.brandBlock}>
            <Animated.View style={logoFloatStyle}>
              <KivoLogo size={88} color={ACCENT} foldColor="#A78BFA" />
            </Animated.View>

            <Animated.Text
              entering={FadeInDown.duration(650).delay(200).easing(Easing.out(Easing.cubic))}
              style={styles.title}>
              {APP_NAME}
            </Animated.Text>

            <Animated.Text entering={FadeIn.duration(600).delay(380)} style={styles.tagline}>
              {APP_SPLASH_TAGLINE}
            </Animated.Text>
          </Animated.View>

          <View style={styles.statusBlock}>
            <View style={styles.lineTrack}>
              <Animated.View style={[styles.lineGlow, glowStyle]} />
              <Animated.View style={[styles.line, lineStyle]} />
            </View>

            <Animated.Text entering={FadeIn.duration(500).delay(920)} style={styles.status}>
              {APP_SPLASH_STATUS}
            </Animated.Text>
          </View>
        </View>

        <Animated.Text entering={FadeIn.duration(500).delay(1050)} style={styles.version}>
          {APP_VERSION_LABEL}
        </Animated.Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BACKGROUND,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: BACKGROUND,
  },
  content: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  brandBlock: {
    alignItems: 'center',
    gap: 16,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 42,
    fontWeight: '700',
    letterSpacing: -0.8,
  },
  tagline: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 3.2,
    textTransform: 'uppercase',
  },
  statusBlock: {
    position: 'absolute',
    bottom: '18%',
    width: '100%',
    maxWidth: 220,
    alignItems: 'center',
    gap: 14,
  },
  lineTrack: {
    width: '100%',
    height: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  line: {
    width: '100%',
    height: StyleSheet.hairlineWidth + 1,
    backgroundColor: ACCENT,
    borderRadius: 2,
  },
  lineGlow: {
    position: 'absolute',
    width: '100%',
    height: 8,
    backgroundColor: ACCENT,
    borderRadius: 8,
    shadowColor: ACCENT,
    shadowOpacity: 0.9,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
  },
  status: {
    color: ACCENT,
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.4,
  },
  version: {
    textAlign: 'center',
    color: '#3A3A3A',
    fontSize: 11,
    letterSpacing: 0.3,
    paddingBottom: 12,
  },
});
