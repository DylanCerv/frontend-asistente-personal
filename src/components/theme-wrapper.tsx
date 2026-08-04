import type { ReactNode } from 'react';
import { View, type ViewProps, StyleSheet } from 'react-native';

import { APP_BACKGROUND } from '@/constants/app-colors';

type ThemeWrapperProps = ViewProps & {
  children: ReactNode;
};

export function ThemeWrapper({ children, style, ...props }: ThemeWrapperProps) {
  return (
    <View style={[styles.root, style]} {...props}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: APP_BACKGROUND,
  },
});
