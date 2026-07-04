import { useId } from 'react';
import Svg, { Circle, Defs, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

type KivoLogoProps = {
  size?: number;
};

export function KivoLogo({ size = 80 }: KivoLogoProps) {
  const reactId = useId().replace(/:/g, '');
  const bgId = `kivoBg-${reactId}`;
  const ringId = `kivoRing-${reactId}`;
  const kId = `kivoK-${reactId}`;

  return (
    <Svg width={size} height={size} viewBox="0 0 512 512" accessibilityLabel="Kivo">
      <Defs>
        <LinearGradient id={bgId} x1="48" y1="48" x2="464" y2="464" gradientUnits="userSpaceOnUse">
          <Stop stopColor="#2B2FD4" />
          <Stop offset="0.55" stopColor="#5B21B6" />
          <Stop offset="1" stopColor="#8B00FF" />
        </LinearGradient>
        <LinearGradient
          id={ringId}
          x1="120"
          y1="120"
          x2="400"
          y2="400"
          gradientUnits="userSpaceOnUse">
          <Stop stopColor="#FFFFFF" />
          <Stop offset="0.55" stopColor="#FFFFFF" />
          <Stop offset="1" stopColor="#55EFFF" />
        </LinearGradient>
        <LinearGradient id={kId} x1="180" y1="150" x2="340" y2="360" gradientUnits="userSpaceOnUse">
          <Stop stopColor="#FFFFFF" />
          <Stop offset="1" stopColor="#E8F7FF" />
        </LinearGradient>
      </Defs>

      <Rect width="512" height="512" rx="112" fill={`url(#${bgId})`} />

      <Path
        d="M156 372 C118 336 98 286 98 232 C98 148 166 80 250 80 C300 80 344 100 374 132"
        stroke={`url(#${ringId})`}
        strokeWidth="28"
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d="M392 300 C386 340 360 374 320 394 C300 404 278 408 256 408 C230 408 206 400 186 386 L148 420 L156 372"
        stroke={`url(#${ringId})`}
        strokeWidth="28"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      <Circle cx="392" cy="300" r="12" fill="#55EFFF" />
      <Circle cx="382" cy="128" r="6" fill="#55EFFF" />

      <G transform="translate(392 118)">
        <Path d="M0 -22 L5 -5 L22 0 L5 5 L0 22 L-5 5 L-22 0 L-5 -5 Z" fill="#55EFFF" />
      </G>

      <Path
        d="M188 148 H236 V236 L300 148 H356 L268 258 L356 364 H300 L236 280 V364 H188 Z"
        fill={`url(#${kId})`}
      />
      <Path d="M236 236 L268 258 L236 280 Z" fill="#C5D4E8" opacity="0.55" />
    </Svg>
  );
}
