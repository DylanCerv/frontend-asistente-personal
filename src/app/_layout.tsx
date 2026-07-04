import '@/global.css';

import { ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { AppDialogHost } from '@/components/app-dialog-host';
import { ThemeWrapper } from '@/components/theme-wrapper';
import { AppDarkTheme, AppLightTheme } from '@/constants/navigation-theme';
import { AppFlowProvider } from '@/context/app-flow-context';
import { AuthProvider } from '@/context/auth-context';
import { ThemePreferenceProvider } from '@/context/theme-preference-context';
import { UserPreferencesProvider, useUserPreferences } from '@/context/user-preferences-context';
import { SubscriptionProvider } from '@/context/subscription-context';
import { useAuth } from '@/context/auth-context';
import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  initialRouteName: 'splash',
};

/** Syncs backend preferences when the user logs in or the app bootstraps */
function PreferencesSyncBridge() {
  const { isAuthenticated, isBootstrapping } = useAuth();
  const { loadFromBackend } = useUserPreferences();

  useEffect(() => {
    if (!isBootstrapping && isAuthenticated) {
      void loadFromBackend();
    }
  }, [isAuthenticated, isBootstrapping, loadFromBackend]);

  return null;
}

function RootNavigation() {
  const appColorScheme = useColorScheme();

  return (
    <ThemeWrapper>
      <ThemeProvider value={appColorScheme === 'dark' ? AppDarkTheme : AppLightTheme}>
        <PreferencesSyncBridge />
        <StatusBar style={appColorScheme === 'dark' ? 'light' : 'dark'} />
        <AppDialogHost />
        <Stack
          screenOptions={{
            headerShown: false,
            statusBarStyle: appColorScheme === 'dark' ? 'light' : 'dark',
            contentStyle: {
              backgroundColor: appColorScheme === 'dark' ? '#0B1120' : '#F1F5F9',
            },
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
