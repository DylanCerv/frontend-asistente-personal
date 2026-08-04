import Svg, { Rect } from 'react-native-svg';

type KeyboardIconProps = {
  size?: number;
  color?: string;
};

/** Full QWERTY-style keyboard glyph (not a numeric keypad). */
export function KeyboardIcon({ size = 18, color = '#8A8A8A' }: KeyboardIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="5" width="20" height="14" rx="2.5" stroke={color} strokeWidth="1.6" />
      <Rect x="4.5" y="7.5" width="2.2" height="2.2" rx="0.45" fill={color} />
      <Rect x="7.7" y="7.5" width="2.2" height="2.2" rx="0.45" fill={color} />
      <Rect x="10.9" y="7.5" width="2.2" height="2.2" rx="0.45" fill={color} />
      <Rect x="14.1" y="7.5" width="2.2" height="2.2" rx="0.45" fill={color} />
      <Rect x="17.3" y="7.5" width="2.2" height="2.2" rx="0.45" fill={color} />
      <Rect x="5.5" y="11.2" width="2.2" height="2.2" rx="0.45" fill={color} />
      <Rect x="8.7" y="11.2" width="2.2" height="2.2" rx="0.45" fill={color} />
      <Rect x="11.9" y="11.2" width="2.2" height="2.2" rx="0.45" fill={color} />
      <Rect x="15.1" y="11.2" width="2.2" height="2.2" rx="0.45" fill={color} />
      <Rect x="7" y="14.9" width="10" height="2.2" rx="0.45" fill={color} />
    </Svg>
  );
}
