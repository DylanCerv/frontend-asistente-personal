import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';

import { APP_ACCENT } from '@/constants/app-colors';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type SonarIconProps = {
  size?: number;
  color?: string;
  active?: boolean;
};

function PulseRing({
  size,
  color,
  delay,
  active,
}: {
  size: number;
  color: string;
  delay: number;
  active: boolean;
}) {
  const progress = useSharedValue(0);

  useEffect(() => {
    if (!active) {
      progress.value = withTiming(0, { duration: 240 });
      return;
    }

    progress.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, { duration: 2200, easing: Easing.out(Easing.quad) }),
        -1,
        false,
      ),
    );
  }, [active, delay, progress]);

  const animatedProps = useAnimatedProps(() => ({
    r: 18 + progress.value * 34,
    opacity: Math.max(0, 0.55 * (1 - progress.value)),
    strokeWidth: 1.4 + (1 - progress.value) * 0.8,
  }));

  return (
    <AnimatedCircle
      cx={size / 2}
      cy={size / 2}
      fill="none"
      stroke={color}
      animatedProps={animatedProps}
    />
  );
}

export function SonarIcon({
  size = 168,
  color = APP_ACCENT,
  active = true,
}: SonarIconProps) {
  const center = size / 2;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Circle
          cx={center}
          cy={center}
          r={size * 0.42}
          fill="none"
          stroke={color}
          strokeWidth={1.2}
          opacity={0.22}
        />
        <PulseRing size={size} color={color} delay={0} active={active} />
        <PulseRing size={size} color={color} delay={700} active={active} />
        <PulseRing size={size} color={color} delay={1400} active={active} />
        <Path
          d={`M ${center} ${center - 8}
             A 28 28 0 0 1 ${center + 26} ${center + 10}
             M ${center} ${center - 8}
             A 44 44 0 0 1 ${center + 40} ${center + 16}
             M ${center} ${center - 8}
             A 60 60 0 0 1 ${center + 52} ${center + 22}`}
          fill="none"
          stroke={color}
          strokeWidth={3.2}
          strokeLinecap="round"
          opacity={0.95}
        />
        <Circle cx={center} cy={center - 8} r={5} fill={color} />
      </Svg>
    </View>
  );
}
