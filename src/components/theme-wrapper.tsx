import type { ReactNode } from 'react';
import { View, type ViewProps } from 'react-native';

import { useThemePreference } from '@/context/theme-preference-context';

type ThemeWrapperProps = ViewProps & {
  children: ReactNode;
};

export function ThemeWrapper({ children, className, ...props }: ThemeWrapperProps) {
  const { mode } = useThemePreference();

  return (
    <View className={`flex-1 ${mode === 'dark' ? 'dark' : ''} ${className ?? ''}`} {...props}>
      {children}
    </View>
  );
}
