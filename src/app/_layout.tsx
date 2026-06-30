import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';

import { ThemeWrapper } from '@/components/theme-wrapper';
import { AuthProvider } from '@/context/auth-context';
import { ThemePreferenceProvider } from '@/context/theme-preference-context';
import { useColorScheme } from '@/hooks/use-color-scheme';

function RootNavigation() {
  const colorScheme = useColorScheme();

  return (
    <ThemeWrapper>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="login" />
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
