import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from 'react';
import { colorScheme as nativeWindColorScheme } from 'nativewind';

export type ThemeMode = 'light' | 'dark';

/** App is dark-first during the redesign. Light mode stays available in the API but is locked off. */
type ThemePreferenceContextValue = {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
};

const ThemePreferenceContext = createContext<ThemePreferenceContextValue | null>(null);

export function ThemePreferenceProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    nativeWindColorScheme.set('dark');
  }, []);

  const setMode = useCallback((_mode: ThemeMode) => {
    nativeWindColorScheme.set('dark');
  }, []);

  const toggleMode = useCallback(() => {
    nativeWindColorScheme.set('dark');
  }, []);

  const value = useMemo(
    () => ({
      mode: 'dark' as const,
      setMode,
      toggleMode,
    }),
    [setMode, toggleMode],
  );

  return (
    <ThemePreferenceContext.Provider value={value}>{children}</ThemePreferenceContext.Provider>
  );
}

export function useThemePreference() {
  const context = useContext(ThemePreferenceContext);
  if (!context) {
    throw new Error('useThemePreference must be used within ThemePreferenceProvider');
  }
  return context;
}
