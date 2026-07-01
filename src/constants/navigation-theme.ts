import { DarkTheme, DefaultTheme, type Theme } from '@react-navigation/native';

const canvas = '#F8FAFC';
const canvasDark = '#0B1120';

export const AppLightTheme: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: canvas,
    card: canvas,
  },
};

export const AppDarkTheme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: canvasDark,
    card: canvasDark,
  },
};
