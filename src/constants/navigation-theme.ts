import { DarkTheme, DefaultTheme, type Theme } from '@react-navigation/native';

const canvas = '#FAF8FF';
const canvasDark = '#10091F';

export const AppLightTheme: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: canvas,
    card: canvas,
    primary: '#7C3AED',
    border: '#E7DFF5',
    text: '#181124',
  },
};

export const AppDarkTheme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: canvasDark,
    card: canvasDark,
    primary: '#A78BFA',
    border: '#2E2145',
    text: '#FAF7FF',
  },
};
