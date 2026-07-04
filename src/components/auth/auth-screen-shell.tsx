import type { ReactNode } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenSafeArea } from '@/components/screen-safe-area';

import { AuthBackButton } from '@/components/auth/auth-back-button';
import { ThemeToggle } from '@/components/theme-toggle';

type AuthScreenShellProps = {
  children: ReactNode;
  onBack?: () => void;
};

export function AuthScreenShell({ children, onBack }: AuthScreenShellProps) {
  const insets = useSafeAreaInsets();
  const headerTop = insets.top + 12;

  return (
    <ScreenSafeArea edges={['bottom']} className="overflow-hidden bg-[#F9F5FF] dark:bg-[#12091F]">
      <LinearGradient
        colors={['#FFFFFF', '#F8F0FF', '#EDE9FE', '#FDFBFF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="absolute inset-0 dark:hidden"
      />
      <LinearGradient
        colors={['#12091F', '#2E1065', '#581C87', '#190B2E']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="absolute inset-0 hidden dark:flex"
      />
      <LinearGradient
        colors={['rgba(124,58,237,0.24)', 'rgba(216,180,254,0.18)', 'rgba(255,255,255,0.00)']}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
        className="absolute inset-0"
      />

      <View
        className="absolute left-0 right-0 z-10 px-6"
        style={{ top: headerTop }}>
        <View className="flex-row items-center justify-between">
          {onBack ? <AuthBackButton onPress={onBack} /> : <View className="h-11 w-11" />}
          <ThemeToggle compact />
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1">
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerClassName="flex-grow justify-center px-6 pb-10"
          contentContainerStyle={{ paddingTop: insets.top + 84 }}>
          <View className="w-full max-w-md gap-7 self-center rounded-[36px] border border-white/60 bg-white/80 p-5 shadow-sm dark:border-white/10 dark:bg-surface-dark/90">
            {children}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenSafeArea>
  );
}
