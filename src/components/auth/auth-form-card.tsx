import type { ReactNode } from 'react';
import { View } from 'react-native';

type AuthFormCardProps = {
  children: ReactNode;
};

export function AuthFormCard({ children }: AuthFormCardProps) {
  return (
    <View className="gap-4 rounded-[28px] border border-border bg-surface p-6 dark:border-border-dark dark:bg-surface-dark">
      {children}
    </View>
  );
}
