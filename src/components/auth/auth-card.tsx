import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

type AuthCardProps = {
  children: ReactNode;
};

export function AuthCard({ children }: AuthCardProps) {
  return (
    <View className="gap-5 rounded-[24px] border border-border/70 bg-surface/95 p-6 shadow-sm dark:border-border-dark/70 dark:bg-surface-dark/95">
      {children}
    </View>
  );
}
