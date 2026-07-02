import type { ReactNode } from 'react';
import { View, type ViewProps } from 'react-native';

type ThemeWrapperProps = ViewProps & {
  children: ReactNode;
};

export function ThemeWrapper({ children, className, ...props }: ThemeWrapperProps) {
  return (
    <View className={`flex-1 bg-canvas dark:bg-canvas-dark ${className ?? ''}`} {...props}>
      {children}
    </View>
  );
}
