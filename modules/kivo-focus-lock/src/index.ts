import { requireNativeModule, type EventSubscription } from 'expo-modules-core';
import { Platform } from 'react-native';

type OverlayActionPayload = { action: string };

type KivoFocusLockNativeModule = {
  hasNotificationPolicyAccess(): boolean;
  openNotificationPolicySettings(): void;
  getInterruptionFilter(): number;
  setInterruptionFilter(filter: number): boolean;
  canDrawOverlays(): boolean;
  openOverlaySettings(): void;
  showOverlay(title: string, timerText: string): void;
  updateOverlay(title: string, timerText: string): void;
  hideOverlay(): void;
  getRingtoneTitle(uri: string): string | null;
  getDefaultNotificationSoundUri(): string | null;
  addListener(
    eventName: string,
    listener: (payload: OverlayActionPayload) => void,
  ): EventSubscription;
  removeListeners(count: number): void;
};

const INTERRUPTION_FILTER_ALL = 1;
const INTERRUPTION_FILTER_PRIORITY = 2;
const INTERRUPTION_FILTER_NONE = 3;
const INTERRUPTION_FILTER_ALARMS = 4;

export const FocusInterruptionFilter = {
  ALL: INTERRUPTION_FILTER_ALL,
  PRIORITY: INTERRUPTION_FILTER_PRIORITY,
  NONE: INTERRUPTION_FILTER_NONE,
  ALARMS: INTERRUPTION_FILTER_ALARMS,
} as const;

function getNativeModule(): KivoFocusLockNativeModule | null {
  if (Platform.OS !== 'android') return null;
  try {
    return requireNativeModule<KivoFocusLockNativeModule>('KivoFocusLock');
  } catch {
    return null;
  }
}

export function isFocusNativeModuleAvailable(): boolean {
  return getNativeModule() != null;
}

export function hasNotificationPolicyAccess(): boolean {
  return getNativeModule()?.hasNotificationPolicyAccess() ?? false;
}

export function openNotificationPolicySettings(): void {
  getNativeModule()?.openNotificationPolicySettings();
}

export function getInterruptionFilter(): number {
  return getNativeModule()?.getInterruptionFilter() ?? FocusInterruptionFilter.ALL;
}

export function setInterruptionFilter(filter: number): boolean {
  return getNativeModule()?.setInterruptionFilter(filter) ?? false;
}

export function canDrawOverlays(): boolean {
  return getNativeModule()?.canDrawOverlays() ?? false;
}

export function openOverlaySettings(): void {
  getNativeModule()?.openOverlaySettings();
}

export function showFocusOverlay(title: string, timerText: string): void {
  getNativeModule()?.showOverlay(title, timerText);
}

export function updateFocusOverlay(title: string, timerText: string): void {
  getNativeModule()?.updateOverlay(title, timerText);
}

export function hideFocusOverlay(): void {
  getNativeModule()?.hideOverlay();
}

export function getRingtoneTitle(uri: string): string | null {
  return getNativeModule()?.getRingtoneTitle(uri) ?? null;
}

export function getDefaultNotificationSoundUri(): string | null {
  return getNativeModule()?.getDefaultNotificationSoundUri() ?? null;
}

export function addOverlayActionListener(
  listener: (payload: OverlayActionPayload) => void,
): EventSubscription | null {
  const mod = getNativeModule();
  if (!mod) return null;
  return mod.addListener('onOverlayAction', listener);
}

export default {
  hasNotificationPolicyAccess,
  openNotificationPolicySettings,
  getInterruptionFilter,
  setInterruptionFilter,
  canDrawOverlays,
  openOverlaySettings,
  showFocusOverlay,
  updateFocusOverlay,
  hideFocusOverlay,
  getRingtoneTitle,
  getDefaultNotificationSoundUri,
  addOverlayActionListener,
  FocusInterruptionFilter,
  isFocusNativeModuleAvailable,
};
