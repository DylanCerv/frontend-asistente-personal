import { ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { ThemeWrapper } from '@/components/theme-wrapper';
import { AppDarkTheme, AppLightTheme } from '@/constants/navigation-theme';
import { AppFlowProvider } from '@/context/app-flow-context';
import { AuthProvider } from '@/context/auth-context';
import { ThemePreferenceProvider } from '@/context/theme-preference-context';
import { UserPreferencesProvider } from '@/context/user-preferences-context';
import { SubscriptionProvider } from '@/context/subscription-context';
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
            statusBarStyle: 'auto',
          }}>
          <Stack.Screen name="splash" />
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="login" />
          <Stack.Screen name="register" />
          <Stack.Screen name="setup" />
          <Stack.Screen name="(main)" />
        </Stack>
      </ThemeProvider>
    </ThemeWrapper>
  );
}

export default function RootLayout() {
  return (
    <ThemePreferenceProvider>
      <UserPreferencesProvider>
        <SubscriptionProvider>
          <AppFlowProvider>
            <AuthProvider>
              <RootNavigation />
            </AuthProvider>
          </AppFlowProvider>
        </SubscriptionProvider>
      </UserPreferencesProvider>
    </ThemePreferenceProvider>
  );
}
