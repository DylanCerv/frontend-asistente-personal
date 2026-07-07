import type { ReactNode } from 'react';
import { SafeAreaView, type Edge, useSafeAreaInsets } from 'react-native-safe-area-context';

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
