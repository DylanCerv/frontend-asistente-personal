import type { ReactNode } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge, useSafeAreaInsets } from 'react-native-safe-area-context';

import { APP_BACKGROUND } from '@/constants/app-colors';

type ScreenSafeAreaProps = {
  children: ReactNode;
  edges?: Edge[];
  /** @deprecated NativeWind className is ignored; use style for layout overrides. */
  className?: string;
  style?: StyleProp<ViewStyle>;
};

export function ScreenSafeArea({
  children,
  edges = ['top', 'bottom'],
  style,
}: ScreenSafeAreaProps) {
  return (
    <SafeAreaView style={[styles.root, style]} edges={edges}>
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: APP_BACKGROUND,
  },
});

/** Bottom padding for chat composer: nav bar when idle, minimal gap when keyboard is open. */
export function getComposerBottomPadding(bottomInset: number, keyboardHeight = 0): number {
  if (keyboardHeight > 0) return 8;
  if (bottomInset > 0) return bottomInset;
  return 8;
}

/** Bottom padding for fixed footers (chat bar, action buttons, etc.). */
export function useBottomInset(extra = 12): number {
  const insets = useSafeAreaInsets();
  return insets.bottom + extra;
}

/** Scroll content padding when a floating action button is visible. */
export function useScrollBottomPadding(fabClearance = 144): number {
  const insets = useSafeAreaInsets();
  return insets.bottom + fabClearance;
}
