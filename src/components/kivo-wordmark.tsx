import { Text, View } from 'react-native';

import { KivoLogo } from '@/components/kivo-logo';
import { APP_ACCENT, APP_ACCENT_SOFT } from '@/constants/app-colors';
import { APP_NAME } from '@/constants/branding';

type KivoWordmarkProps = {
  /** Logo mark size in px. Text scales slightly under this for optical match. */
  size?: number;
  color?: string;
  foldColor?: string;
};

/** Brand mark + the full name “Kivo”. */
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
      accessibilityLabel={APP_NAME}
      className="flex-row items-center">
      <KivoLogo size={size} color={color} foldColor={foldColor} />
      <Text
        className="font-bold tracking-tight"
        style={{
          color,
          fontSize: textSize,
          lineHeight: textSize,
          includeFontPadding: false,
          marginLeft: 6,
        }}>
        {APP_NAME}
      </Text>
    </View>
  );
}
