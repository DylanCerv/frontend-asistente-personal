import { isRunningInExpoGo } from 'expo';
import { Redirect, Tabs } from 'expo-router';
import { View } from 'react-native';

import { AppLockGate } from '@/components/app-lock-gate';
import { FocusSessionHost } from '@/components/focus/focus-session-view';
import { FloatingMicButton } from '@/components/floating-mic-button';
import { MainTabBar } from '@/components/main-tab-bar';
import { ReminderSync } from '@/components/reminder-sync';
import { VoiceCaptureSheet } from '@/components/voice-capture-sheet';
import { WidgetSetupPrompt } from '@/components/widget-setup-prompt';
import { WidgetSync } from '@/components/widget-sync';
import { isNativeBuildEnabled } from '@/config/native-build';
import { APP_BACKGROUND } from '@/constants/app-colors';
import { AssistantProvider } from '@/context/assistant-context';
import { AppLockProvider } from '@/context/app-lock-context';
import { FocusSessionProvider } from '@/context/focus-session-context';
import { useAuth } from '@/context/auth-context';
import { VoiceCaptureProvider } from '@/context/voice-capture-context';
import { useQuickActionsSetup } from '@/hooks/use-quick-actions-setup';

/** Widgets, local notifications, quick actions — native APK / iOS only (off in Expo Go). */
const enableNativeExtras = isNativeBuildEnabled() && !isRunningInExpoGo();

/** Native-only wiring. Off in Expo Go; on in development client and store builds. */
function NativeExtras() {
  useQuickActionsSetup();

  return (
    <>
      <ReminderSync />
      <WidgetSync />
      <WidgetSetupPrompt />
    </>
  );
}

function MainShell() {
  return (
    <View className="flex-1" style={{ backgroundColor: APP_BACKGROUND }}>
      <Tabs
        initialRouteName="assistant"
        tabBar={(props) => <MainTabBar {...props} />}
        screenOptions={{
          headerShown: false,
          sceneStyle: { backgroundColor: APP_BACKGROUND },
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Focus',
            tabBarAccessibilityLabel: 'Focus',
          }}
        />
        <Tabs.Screen
          name="assistant"
          options={{
            title: 'Asistente',
            tabBarAccessibilityLabel: 'Asistente',
          }}
        />
        <Tabs.Screen
          name="tasks"
          options={{
            title: 'Tareas',
            tabBarAccessibilityLabel: 'Tareas',
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Perfil',
            tabBarAccessibilityLabel: 'Perfil',
          }}
        />
        <Tabs.Screen name="agenda" options={{ href: null }} />
        <Tabs.Screen name="finances" options={{ href: null }} />
        <Tabs.Screen name="report" options={{ href: null }} />
        <Tabs.Screen name="capture" options={{ href: null }} />
        <Tabs.Screen name="chat" options={{ href: null }} />
        <Tabs.Screen name="memory" options={{ href: null }} />
      </Tabs>
      {enableNativeExtras ? <NativeExtras /> : null}
      <FloatingMicButton />
      <VoiceCaptureSheet />
      <FocusSessionHost />
    </View>
  );
}

export default function MainLayout() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  return (
    <AssistantProvider>
      <FocusSessionProvider>
        <AppLockProvider>
          <VoiceCaptureProvider>
            <AppLockGate>
              <MainShell />
            </AppLockGate>
          </VoiceCaptureProvider>
        </AppLockProvider>
      </FocusSessionProvider>
    </AssistantProvider>
  );
}
