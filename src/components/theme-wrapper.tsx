import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { View, type ViewProps } from 'react-native';
import { useColorScheme as useNativeWindColorScheme } from 'nativewind';

import { useThemePreference } from '@/context/theme-preference-context';

type ThemeWrapperProps = ViewProps & {
  children: ReactNode;
};

export function ThemeWrapper({ children, className, ...props }: ThemeWrapperProps) {
  const { mode } = useThemePreference();
  const { setColorScheme } = useNativeWindColorScheme();

  useEffect(() => {
    setColorScheme(mode);
  }, [mode, setColorScheme]);

  return (
    <View className={`flex-1 bg-canvas dark:bg-canvas-dark ${className ?? ''}`} {...props}>
      {children}
    </View>
  );
}
