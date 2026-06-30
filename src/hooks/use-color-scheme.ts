import { useThemePreference } from '@/context/theme-preference-context';

export function useColorScheme(): 'light' | 'dark' {
  const { mode } = useThemePreference();
  return mode;
}
