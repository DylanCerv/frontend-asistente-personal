import { DarkTheme, DefaultTheme, type Theme } from '@react-navigation/native';

const canvas = '#F1F5F9';
const canvasDark = '#0B1120';

export const AppLightTheme: Theme = {
  ...DefaultTheme,
  dark: false,
  colors: {
    ...DefaultTheme.colors,
    background: canvas,
    card: '#FFFFFF',
    text: '#0F172A',
    border: '#E2E8F0',
    primary: '#2563EB',
  },
};

export const AppDarkTheme: Theme = {
  ...DarkTheme,
  dark: true,
  colors: {
    ...DarkTheme.colors,
    background: canvasDark,
    card: '#151D2E',
    text: '#F1F5F9',
    border: '#1E293B',
    primary: '#3B82F6',
  },
};
