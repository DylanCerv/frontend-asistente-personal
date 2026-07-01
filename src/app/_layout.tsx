import { ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { ThemeWrapper } from '@/components/theme-wrapper';
import { AppDarkTheme, AppLightTheme } from '@/constants/navigation-theme';
import { AuthProvider } from '@/context/auth-context';
import { ThemePreferenceProvider } from '@/context/theme-preference-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSystemColorScheme } from '@/hooks/use-system-color-scheme';

export const unstable_settings = {
  initialRouteName: 'splash',
};

function RootNavigation() {
  const appColorScheme = useColorScheme();
  const systemColorScheme = useSystemColorScheme();

  return (
    <ThemeWrapper>
      <ThemeProvider value={appColorScheme === 'dark' ? AppDarkTheme : AppLightTheme}>
        <StatusBar style={systemColorScheme === 'dark' ? 'light' : 'dark'} />
        <Stack
          screenOptions={{
            headerShown: false,
            statusBarStyle: 'auto',
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
