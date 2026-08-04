import { useThemePreference } from '@/context/theme-preference-context';

/** In-app theme preference. Does not affect the system status bar. */
export function useColorScheme(): 'light' | 'dark' {
  const { mode } = useThemePreference();
  return mode;
}
