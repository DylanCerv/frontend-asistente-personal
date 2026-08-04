import { useEffect } from 'react';
import { View } from 'react-native';
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

const TEAL = '#22D3EE';

const BARS = [
  { height: 22, delay: 0, peak: 0.7, color: APP_ACCENT },
  { height: 36, delay: 70, peak: 0.95, color: TEAL },
  { height: 52, delay: 40, peak: 1, color: APP_ACCENT },
  { height: 28, delay: 110, peak: 0.82, color: TEAL },
  { height: 44, delay: 20, peak: 0.92, color: APP_ACCENT },
  { height: 34, delay: 90, peak: 0.88, color: TEAL },
  { height: 48, delay: 50, peak: 0.98, color: APP_ACCENT },
  { height: 26, delay: 130, peak: 0.75, color: TEAL },
] as const;

function WaveBar({
  index,
  baseHeight,
  delay,
  peak,
  color,
  active,
}: {
  index: number;
  baseHeight: number;
  delay: number;
  peak: number;
  color: string;
  active: boolean;
}) {
  const scale = useSharedValue(active ? 0.35 : 0.22);

  useEffect(() => {
    if (!active) {
      scale.value = withTiming(0.22 + (index % 3) * 0.04, { duration: 280 });
      return;
    }

    scale.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(peak, {
            duration: 260 + index * 28,
            easing: Easing.inOut(Easing.sin),
          }),
          withTiming(0.3 + (index % 3) * 0.08, {
            duration: 220 + index * 24,
            easing: Easing.inOut(Easing.sin),
          }),
          withTiming(peak * 0.78, {
            duration: 190 + index * 18,
            easing: Easing.inOut(Easing.sin),
          }),
          withTiming(0.38, {
            duration: 240 + index * 26,
            easing: Easing.inOut(Easing.sin),
          }),
        ),
        -1,
        false,
      ),
    );
  }, [active, delay, index, peak, scale]);

  const style = useAnimatedStyle(() => ({
    height: baseHeight * scale.value,
  }));

  return (
    <Animated.View
      style={[
        {
          width: 5,
          borderRadius: 999,
          backgroundColor: color,
          minHeight: 8,
        },
        style,
      ]}
    />
  );
}

type VoiceWaveformProps = {
  active?: boolean;
};

export function VoiceWaveform({ active = true }: VoiceWaveformProps) {
  return (
    <View className="h-14 flex-row items-end justify-center gap-1.5">
      {BARS.map((bar, index) => (
        <WaveBar
          key={index}
          index={index}
          baseHeight={bar.height}
          delay={bar.delay}
          peak={bar.peak}
          color={bar.color}
          active={active}
        />
      ))}
    </View>
  );
}
