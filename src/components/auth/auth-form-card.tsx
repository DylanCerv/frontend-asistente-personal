import type { ReactNode } from 'react';
import { View } from 'react-native';

type AuthFormCardProps = {
  children: ReactNode;
};

export function AuthFormCard({ children }: AuthFormCardProps) {
  return (
    <View className="gap-4 rounded-[28px] border border-border/80 bg-white/90 p-5 shadow-sm dark:border-border-dark dark:bg-canvas-dark/80">
      {children}
    </View>
  );
}
