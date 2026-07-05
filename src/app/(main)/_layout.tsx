import { Redirect, Stack } from 'expo-router';
import { View } from 'react-native';

import { FloatingMicButton } from '@/components/floating-mic-button';
import { AppLockGate } from '@/components/app-lock-gate';
import { ReminderSync } from '@/components/reminder-sync';
import { VoiceCaptureSheet } from '@/components/voice-capture-sheet';
import { WidgetSetupPrompt } from '@/components/widget-setup-prompt';
import { WidgetSync } from '@/components/widget-sync';
import { AssistantProvider } from '@/context/assistant-context';
import { AppLockProvider } from '@/context/app-lock-context';
import { useAuth } from '@/context/auth-context';
import { VoiceCaptureProvider } from '@/context/voice-capture-context';
import { useQuickActionsSetup } from '@/hooks/use-quick-actions-setup';

function MainShell() {
  useQuickActionsSetup();

  return (
    <View className="flex-1">
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="agenda" />
        <Stack.Screen name="finances" />
        <Stack.Screen name="report" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="capture" />
        <Stack.Screen name="chat" />
        <Stack.Screen name="tasks" />
        <Stack.Screen name="memory" />
      </Stack>
      <ReminderSync />
      <WidgetSync />
      <WidgetSetupPrompt />
      <FloatingMicButton />
      <VoiceCaptureSheet />
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
      <AppLockProvider>
        <VoiceCaptureProvider>
          <AppLockGate>
            <MainShell />
          </AppLockGate>
        </VoiceCaptureProvider>
      </AppLockProvider>
    </AssistantProvider>
  );
}
