import {
  addOverlayActionListener,
  canDrawOverlays,
  hideFocusOverlay,
  openOverlaySettings,
  showFocusOverlay,
  updateFocusOverlay,
} from '@/services/focus/focus-native';

export type FocusOverlayAction = 'complete' | 'postpone' | 'extend' | 'stop';

export function isOverlayAvailable(): boolean {
  return canDrawOverlays();
}

export function requestOverlayPermission(): void {
  openOverlaySettings();
}

export function presentFocusOverlay(title: string, timerText: string): void {
  if (!canDrawOverlays()) return;
  showFocusOverlay(title, timerText);
}

export function refreshFocusOverlay(title: string, timerText: string): void {
  if (!canDrawOverlays()) return;
  updateFocusOverlay(title, timerText);
}

export function dismissFocusOverlay(): void {
  hideFocusOverlay();
}

export function subscribeFocusOverlayActions(
  onAction: (action: FocusOverlayAction) => void,
): (() => void) | null {
  const subscription = addOverlayActionListener((payload) => {
    const action = payload.action;
    if (
      action === 'complete' ||
      action === 'postpone' ||
      action === 'extend' ||
      action === 'stop'
    ) {
      onAction(action);
    }
  });
  if (!subscription) return null;
  return () => subscription.remove();
}

export { canDrawOverlays, openOverlaySettings };
