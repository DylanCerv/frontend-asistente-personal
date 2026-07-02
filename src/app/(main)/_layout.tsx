import { Redirect } from 'expo-router';
import { View } from 'react-native';

import AppTabs from '@/components/app-tabs';
import { FloatingMicButton } from '@/components/floating-mic-button';
import { VoiceCaptureSheet } from '@/components/voice-capture-sheet';
import { AssistantProvider } from '@/context/assistant-context';
import { useAuth } from '@/context/auth-context';
import { VoiceCaptureProvider } from '@/context/voice-capture-context';
import { useQuickActionsSetup } from '@/hooks/use-quick-actions-setup';

function MainShell() {
  useQuickActionsSetup();

  return (
    <View className="flex-1">
      <AppTabs />
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
      <VoiceCaptureProvider>
        <MainShell />
      </VoiceCaptureProvider>
    </AssistantProvider>
  );
}
