/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#181124',
    background: '#FAF8FF',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#F1EAFF',
    textSecondary: '#6B6475',
    primary: '#7C3AED',
    primaryMuted: '#EDE9FE',
    border: '#E7DFF5',
    error: '#DC2626',
    accent: '#06B6D4',
  },
  dark: {
    text: '#FAF7FF',
    background: '#10091F',
    backgroundElement: '#1A102E',
    backgroundSelected: '#251642',
    textSecondary: '#B8A9D6',
    primary: '#A78BFA',
    primaryMuted: '#3B2164',
    border: '#2E2145',
    error: '#F87171',
    accent: '#22D3EE',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
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
