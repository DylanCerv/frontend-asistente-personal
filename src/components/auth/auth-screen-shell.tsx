import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
} from 'react-native';
import { ScreenSafeArea } from '@/components/screen-safe-area';

import { AuthBackButton } from '@/components/auth/auth-back-button';
import { ThemeToggle } from '@/components/theme-toggle';

type AuthScreenShellProps = {
  children: ReactNode;
  onBack?: () => void;
};

export function AuthScreenShell({ children, onBack }: AuthScreenShellProps) {
  return (
    <ScreenSafeArea>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1">
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerClassName="flex-grow justify-center px-6 py-8">
          <View className="mb-4 flex-row items-center justify-between">
            {onBack ? <AuthBackButton onPress={onBack} /> : <View className="h-11 w-11" />}
            <ThemeToggle compact />
          </View>

          <View className="w-full max-w-md gap-8 self-center">{children}</View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenSafeArea>
  );
}
