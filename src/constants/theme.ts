/**
 * Below are the colors that are used in the app.
 * The app is dark-first (#050505). Light tokens mirror dark to avoid flashes.
 */

import { Platform } from 'react-native';

import {
  APP_ACCENT,
  APP_BACKGROUND,
  APP_BORDER,
  APP_DANGER,
  APP_SURFACE,
  APP_SURFACE_SOFT,
  APP_TEXT,
  APP_TEXT_MUTED,
} from '@/constants/app-colors';

const darkPalette = {
  text: APP_TEXT,
  background: APP_BACKGROUND,
  backgroundElement: APP_SURFACE,
  backgroundSelected: APP_SURFACE_SOFT,
  textSecondary: APP_TEXT_MUTED,
  primary: APP_ACCENT,
  primaryMuted: '#3B2164',
  border: APP_BORDER,
  error: APP_DANGER,
  accent: '#22D3EE',
} as const;

export const Colors = {
  light: darkPalette,
  dark: darkPalette,
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
