import { Text, View } from 'react-native';

import { KivoLogo } from '@/components/kivo-logo';
import { APP_ACCENT, APP_ACCENT_SOFT } from '@/constants/app-colors';

type KivoWordmarkProps = {
  /** Logo mark size in px. Text scales slightly under this for optical match. */
  size?: number;
  color?: string;
  foldColor?: string;
};

/** Brand mark + “ivo” so the pair reads as “Kivo”. */
export function KivoWordmark({
  size = 24,
  color = APP_ACCENT,
  foldColor = APP_ACCENT_SOFT,
}: KivoWordmarkProps) {
  const textSize = Math.round(size * 0.92);

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel="Kivo"
      className="flex-row items-end">
      <KivoLogo size={size} color={color} foldColor={foldColor} />
      <Text
        className="font-bold tracking-tight"
        style={{
          color,
          fontSize: textSize,
          lineHeight: textSize,
          includeFontPadding: false,
          marginLeft: -2,
          marginBottom: 1,
        }}>
        ivo
      </Text>
    </View>
  );
}
