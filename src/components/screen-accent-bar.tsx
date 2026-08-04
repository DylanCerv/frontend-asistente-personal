import { View } from 'react-native';

import type { ScreenAccent } from '@/constants/screen-themes';

export function ScreenAccentBar({ accent }: { accent: ScreenAccent }) {
  return <View style={{ height: 3, backgroundColor: accent.main }} />;
}
