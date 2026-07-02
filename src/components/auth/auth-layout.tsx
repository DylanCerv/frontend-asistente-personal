import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { ThemeToggle } from '@/components/theme-toggle';

type AuthLayoutProps = {
  children: ReactNode;
  onBack?: () => void;
};

export function AuthLayout({ children, onBack }: AuthLayoutProps) {
  return (
    <SafeAreaView className="flex-1 bg-canvas dark:bg-canvas-dark">
      <View className="pointer-events-none absolute inset-0 overflow-hidden">
        <View className="absolute -right-12 -top-16 h-48 w-48 rounded-full bg-brand/10 dark:bg-brand-dark/15" />
        <View className="absolute -left-20 top-1/3 h-56 w-56 rounded-full bg-muted/80 dark:bg-muted-dark/40" />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1">
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerClassName="flex-grow px-6 pb-10 pt-4">
          <View className="mb-8 flex-row items-center justify-between">
            {onBack ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Volver"
                onPress={onBack}
                hitSlop={8}
                className="h-11 w-11 items-center justify-center rounded-full border border-border bg-surface/80 dark:border-border-dark dark:bg-surface-dark/80 active:opacity-70">
                <Ionicons name="chevron-back" size={22} color="#64748B" />
              </Pressable>
            ) : (
              <View className="h-11 w-11" />
            )}
            <ThemeToggle compact />
          </View>

          <View className="w-full max-w-md flex-1 justify-center gap-8 self-center">
            {children}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
