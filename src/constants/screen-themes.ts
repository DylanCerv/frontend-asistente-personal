import { useMemo } from 'react';

import { useColorScheme } from '@/hooks/use-color-scheme';

export type ScreenThemeId = 'agenda' | 'finances' | 'report';

export type ScreenTheme = {
  id: ScreenThemeId;
  label: string;
  accent: string;
  accentDark: string;
  soft: string;
  softDark: string;
  border: string;
  borderDark: string;
};

export type ScreenAccent = {
  main: string;
  soft: string;
  border: string;
};

export const SCREEN_THEMES: Record<ScreenThemeId, ScreenTheme> = {
  agenda: {
    id: 'agenda',
    label: 'Agenda',
    accent: '#E11D48',
    accentDark: '#FB7185',
    soft: 'rgba(225, 29, 72, 0.1)',
    softDark: 'rgba(251, 113, 133, 0.16)',
    border: 'rgba(225, 29, 72, 0.28)',
    borderDark: 'rgba(251, 113, 133, 0.34)',
  },
  finances: {
    id: 'finances',
    label: 'Finanzas',
    accent: '#CA8A04',
    accentDark: '#FACC15',
    soft: 'rgba(202, 138, 4, 0.12)',
    softDark: 'rgba(250, 204, 21, 0.16)',
    border: 'rgba(202, 138, 4, 0.3)',
    borderDark: 'rgba(250, 204, 21, 0.34)',
  },
  report: {
    id: 'report',
    label: 'Reporte',
    accent: '#0369A1',
    accentDark: '#38BDF8',
    soft: 'rgba(3, 105, 161, 0.1)',
    softDark: 'rgba(56, 189, 248, 0.16)',
    border: 'rgba(3, 105, 161, 0.28)',
    borderDark: 'rgba(56, 189, 248, 0.34)',
  },
};

export function getScreenAccent(theme: ScreenTheme, isDark: boolean): ScreenAccent {
  return {
    main: isDark ? theme.accentDark : theme.accent,
    soft: isDark ? theme.softDark : theme.soft,
    border: isDark ? theme.borderDark : theme.border,
  };
}

export function useScreenAccent(themeId: ScreenThemeId): ScreenAccent {
  const isDark = useColorScheme() === 'dark';
  const theme = SCREEN_THEMES[themeId];

  return useMemo(() => getScreenAccent(theme, isDark), [theme, isDark]);
}
