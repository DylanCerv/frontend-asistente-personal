import type { ReactNode } from 'react';
import { Platform } from 'react-native';
import { SafeAreaView, type Edge, useSafeAreaInsets } from 'react-native-safe-area-context';

/** Fallback when Android edge-to-edge reports 0 for the navigation bar inset. */
const ANDROID_NAV_BAR_FALLBACK = 48;

type ScreenSafeAreaProps = {
  children: ReactNode;
  edges?: Edge[];
  className?: string;
};

export function ScreenSafeArea({
  children,
  edges = ['top', 'bottom'],
  className,
}: ScreenSafeAreaProps) {
  return (
    <SafeAreaView
      className={`flex-1 bg-canvas dark:bg-canvas-dark ${className ?? ''}`}
      edges={edges}>
      {children}
    </SafeAreaView>
  );
}

/** Bottom padding for chat composer: nav bar when idle, minimal gap when keyboard is open. */
export function getComposerBottomPadding(bottomInset: number, keyboardHeight = 0): number {
  if (keyboardHeight > 0) return 8;
  if (bottomInset > 0) return bottomInset;
  return Platform.OS === 'android' ? ANDROID_NAV_BAR_FALLBACK : 8;
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
