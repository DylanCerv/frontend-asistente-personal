/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { useThemePreference } from '@/context/theme-preference-context';
import { Colors } from '@/constants/theme';

export function useTheme() {
  const { mode } = useThemePreference();
  return Colors[mode];
}
