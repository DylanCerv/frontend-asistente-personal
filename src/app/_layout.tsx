import { ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { ThemeWrapper } from '@/components/theme-wrapper';
import { AppDarkTheme, AppLightTheme } from '@/constants/navigation-theme';
import { AuthProvider } from '@/context/auth-context';
import { ThemePreferenceProvider } from '@/context/theme-preference-context';
import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  initialRouteName: 'splash',
};

function RootNavigation() {
  const appColorScheme = useColorScheme();

  return (
    <ThemeWrapper>
      <ThemeProvider value={appColorScheme === 'dark' ? AppDarkTheme : AppLightTheme}>
        <StatusBar style={appColorScheme === 'dark' ? 'light' : 'dark'} />
        <Stack
          screenOptions={{
            headerShown: false,
            statusBarStyle: appColorScheme === 'dark' ? 'light' : 'dark',
            contentStyle: {
              backgroundColor: appColorScheme === 'dark' ? '#0B1120' : '#F1F5F9',
            },
          }}>
          <Stack.Screen name="splash" />
          <Stack.Screen name="login" />
          <Stack.Screen name="register" />
          <Stack.Screen name="(main)" />
        </Stack>
      </ThemeProvider>
    </ThemeWrapper>
  );
}

export default function RootLayout() {
  return (
    <ThemePreferenceProvider>
      <AuthProvider>
        <RootNavigation />
      </AuthProvider>
    </ThemePreferenceProvider>
  );
}
