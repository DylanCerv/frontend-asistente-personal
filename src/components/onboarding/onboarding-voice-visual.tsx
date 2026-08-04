import Ionicons from '@react-native-vector-icons/ionicons';
import { useEffect, type ComponentProps } from 'react';
import { Text, View } from 'react-native';
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

import { APP_ACCENT, APP_SURFACE_SOFT } from '@/constants/app-colors';

const BAR_HEIGHTS = [18, 32, 48, 28, 22] as const;
const BAR_DELAYS = [0, 90, 40, 140, 70] as const;
const BAR_PEAKS = [0.55, 1, 0.72, 0.9, 0.62] as const;

function SpeakingBar({
  index,
  baseHeight,
  delay,
  peak,
}: {
  index: number;
  baseHeight: number;
  delay: number;
  peak: number;
}) {
  const scale = useSharedValue(0.35);

  useEffect(() => {
    scale.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(peak, {
            duration: 280 + index * 35,
            easing: Easing.inOut(Easing.sin),
          }),
          withTiming(0.28 + (index % 3) * 0.08, {
            duration: 240 + index * 28,
            easing: Easing.inOut(Easing.sin),
          }),
          withTiming(peak * 0.75, {
            duration: 200 + index * 20,
            easing: Easing.inOut(Easing.sin),
          }),
          withTiming(0.4, {
            duration: 260 + index * 30,
            easing: Easing.inOut(Easing.sin),
          }),
        ),
        -1,
        false,
      ),
    );
  }, [delay, index, peak, scale]);

  const style = useAnimatedStyle(() => ({
    height: baseHeight * scale.value,
  }));

  return (
    <Animated.View
      style={[
        {
          width: 5,
          borderRadius: 999,
          backgroundColor: APP_ACCENT,
          minHeight: 6,
        },
        style,
      ]}
    />
  );
}

export function OnboardingVoiceVisual() {
  const bubbleA = useSharedValue(0);
  const bubbleB = useSharedValue(0);

  useEffect(() => {
    bubbleA.value = withDelay(
      500,
      withRepeat(
        withSequence(
          withTiming(-6, { duration: 2400, easing: Easing.inOut(Easing.sin) }),
          withTiming(6, { duration: 2400, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        true,
      ),
    );
    bubbleB.value = withDelay(
      900,
      withRepeat(
        withSequence(
          withTiming(5, { duration: 2600, easing: Easing.inOut(Easing.sin) }),
          withTiming(-5, { duration: 2600, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        true,
      ),
    );
  }, [bubbleA, bubbleB]);

  const bubbleAStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bubbleA.value }],
  }));
  const bubbleBStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bubbleB.value }],
  }));

  return (
    <View className="mb-2 h-[250px] items-center justify-center">
      <View className="h-[210px] w-[210px] items-center justify-center rounded-full border border-[#2A2A35]">
        <View className="items-center gap-3">
          <View className="h-14 flex-row items-end justify-center gap-1.5">
            {BAR_HEIGHTS.map((height, index) => (
              <SpeakingBar
                key={index}
                index={index}
                baseHeight={height}
                delay={BAR_DELAYS[index]}
                peak={BAR_PEAKS[index]}
              />
            ))}
          </View>
          <Ionicons name="mic" size={42} color={APP_ACCENT} />
        </View>
      </View>

      <Animated.View
        entering={FadeIn.duration(500).delay(350)}
        style={[
          {
            position: 'absolute',
            right: 8,
            top: 28,
          },
          bubbleAStyle,
        ]}
        className="rounded-full border border-[#2DD4BF]/50 bg-[#121218] px-3.5 py-2">
        <Text className="text-[12px] font-medium text-[#2DD4BF]">"Organiza mi día"</Text>
      </Animated.View>

      <Animated.View
        entering={FadeInDown.duration(500).delay(520)}
        style={[
          {
            position: 'absolute',
            bottom: 18,
            left: 0,
          },
          bubbleBStyle,
        ]}
        className="rounded-full border border-[#2A2A35] bg-[#121218] px-3.5 py-2"
        >
        <Text className="text-[12px] font-medium text-[#C4B5FD]">"Recuérdamelo a las 5"</Text>
      </Animated.View>

      <View
        pointerEvents="none"
        className="absolute h-[160px] w-[160px] rounded-full"
        style={{
          backgroundColor: APP_ACCENT,
          opacity: 0.05,
        }}
      />
    </View>
  );
}

type FeatureCardProps = {
  icon: ComponentProps<typeof Ionicons>['name'];
  iconColor: string;
  title: string;
  description: string;
};

export function OnboardingFeatureCard({
  icon,
  iconColor,
  title,
  description,
}: FeatureCardProps) {
  return (
    <View
      className="flex-1 gap-2 rounded-2xl border border-[#2A2A35] px-3.5 py-3.5"
      style={{ backgroundColor: APP_SURFACE_SOFT }}>
      <Ionicons name={icon} size={18} color={iconColor} />
      <Text className="text-[14px] font-bold text-white">{title}</Text>
      <Text className="text-[11px] leading-4 text-[#8A8A8A]">{description}</Text>
    </View>
  );
}
