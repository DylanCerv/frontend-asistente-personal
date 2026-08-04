import { DarkTheme, type Theme } from '@react-navigation/native';

import { APP_ACCENT, APP_BACKGROUND, APP_BORDER, APP_TEXT } from '@/constants/app-colors';

export const AppDarkTheme: Theme = {
  ...DarkTheme,
  dark: true,
  colors: {
    ...DarkTheme.colors,
    background: APP_BACKGROUND,
    card: APP_BACKGROUND,
    primary: APP_ACCENT,
    border: APP_BORDER,
    text: APP_TEXT,
  },
};

/** Kept for compatibility; app is locked to dark during redesign. */
export const AppLightTheme = AppDarkTheme;
