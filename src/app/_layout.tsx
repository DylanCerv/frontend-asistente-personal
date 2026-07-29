import '@/global.css';

import { ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { AppDialogHost } from '@/components/app-dialog-host';
import { ThemeWrapper } from '@/components/theme-wrapper';
import { AppDarkTheme } from '@/constants/navigation-theme';
import { APP_BACKGROUND } from '@/constants/app-colors';
import { AppFlowProvider } from '@/context/app-flow-context';
import { AuthProvider, useAuth } from '@/context/auth-context';
import { ThemePreferenceProvider } from '@/context/theme-preference-context';
import { DeviceCalendarProvider } from '@/context/device-calendar-context';
import { UserPreferencesProvider, useUserPreferences } from '@/context/user-preferences-context';
import { SubscriptionProvider } from '@/context/subscription-context';

export const unstable_settings = {
  initialRouteName: 'splash',
};

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
  return (
    <ThemeWrapper>
      <ThemeProvider value={AppDarkTheme}>
        <PreferencesSyncBridge />
        <StatusBar style="light" />
        <AppDialogHost />
        <Stack
          screenOptions={{
            headerShown: false,
            statusBarStyle: 'light',
            contentStyle: {
              backgroundColor: APP_BACKGROUND,
            },
          }}>
          <Stack.Screen name="splash" />
          <Stack.Screen name="welcome" />
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="login" />
          <Stack.Screen name="register" />
          <Stack.Screen name="setup" />
          <Stack.Screen name="(main)" />
          <Stack.Screen
            name="critical-alarm"
            options={{
              presentation: 'fullScreenModal',
              animation: 'fade',
              gestureEnabled: false,
            }}
          />
          <Stack.Screen
            name="focus-session"
            options={{
              presentation: 'fullScreenModal',
              animation: 'fade',
            }}
          />
        </Stack>
      </ThemeProvider>
    </ThemeWrapper>
  );
}

export default function RootLayout() {
  return (
    <ThemePreferenceProvider>
      <UserPreferencesProvider>
        <DeviceCalendarProvider>
          <SubscriptionProvider>
            <AppFlowProvider>
              <AuthProvider>
                <RootNavigation />
              </AuthProvider>
            </AppFlowProvider>
          </SubscriptionProvider>
        </DeviceCalendarProvider>
      </UserPreferencesProvider>
    </ThemePreferenceProvider>
  );
}
