import { useEffect } from 'react';
import { Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { APP_ACCENT } from '@/constants/app-colors';
import { APP_NAME } from '@/constants/branding';

const TRAILS = [
  { top: 28, height: 3, opacity: 0.35, delay: 0, duration: 2800 },
  { top: 48, height: 2, opacity: 0.22, delay: 400, duration: 3200 },
  { top: 68, height: 4, opacity: 0.4, delay: 200, duration: 2600 },
  { top: 92, height: 2, opacity: 0.18, delay: 700, duration: 3400 },
  { top: 112, height: 3, opacity: 0.28, delay: 150, duration: 3000 },
] as const;

function GlowTrail({
  top,
  height,
  opacity,
  delay,
  duration,
}: {
  top: number;
  height: number;
  opacity: number;
  delay: number;
  duration: number;
}) {
  const shift = useSharedValue(-40);

  useEffect(() => {
    shift.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(40, { duration, easing: Easing.inOut(Easing.sin) }),
          withTiming(-40, { duration, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        false,
      ),
    );
  }, [delay, duration, shift]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: shift.value }],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          left: -20,
          right: -20,
          top,
          height,
          borderRadius: 999,
          backgroundColor: APP_ACCENT,
          opacity,
        },
        style,
      ]}
    />
  );
}

type DayProgressVisualProps = {
  percent: number;
};

export function DayProgressVisual({ percent }: DayProgressVisualProps) {
  const pulse = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.04, { duration: 1600, easing: Easing.inOut(Easing.sin) }),
        withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
  }, [pulse]);

  const percentStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  return (
    <View className="overflow-hidden rounded-[22px]">
      <LinearGradient
        colors={['#14101F', '#1E1535', '#0E0A18', '#241B42']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          minHeight: 168,
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: 28,
          paddingHorizontal: 16,
        }}>
        {TRAILS.map((trail, index) => (
          <GlowTrail key={index} {...trail} />
        ))}

        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            width: 140,
            height: 140,
            borderRadius: 999,
            backgroundColor: APP_ACCENT,
            opacity: 0.12,
          }}
        />

        <Animated.Text
          style={[
            {
              fontSize: 64,
              fontWeight: '700',
              lineHeight: 72,
              color: APP_ACCENT,
              textShadowColor: APP_ACCENT,
              textShadowOffset: { width: 0, height: 0 },
              textShadowRadius: 18,
            },
            percentStyle,
          ]}>
          {percent}%
        </Animated.Text>
        <Text className="mt-2 text-xs text-white/50">Hoy: Tu Asistente {APP_NAME}</Text>
      </LinearGradient>
    </View>
  );
}
