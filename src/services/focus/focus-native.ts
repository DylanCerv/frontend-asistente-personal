import { Platform } from 'react-native';

type OverlayActionPayload = { action: string };

type OverlaySubscription = { remove: () => void };

type FocusNativeApi = {
  FocusInterruptionFilter: {
    ALL: number;
    PRIORITY: number;
    NONE: number;
    ALARMS: number;
  };
  isFocusNativeModuleAvailable: () => boolean;
  hasNotificationPolicyAccess: () => boolean;
  openNotificationPolicySettings: () => void;
  getInterruptionFilter: () => number;
  setInterruptionFilter: (filter: number) => boolean;
  canDrawOverlays: () => boolean;
  openOverlaySettings: () => void;
  showFocusOverlay: (title: string, timerText: string) => void;
  updateFocusOverlay: (title: string, timerText: string) => void;
  hideFocusOverlay: () => void;
  addOverlayActionListener: (
    listener: (payload: OverlayActionPayload) => void,
  ) => OverlaySubscription | null;
};

const STUB_FILTERS = {
  ALL: 1,
  PRIORITY: 2,
  NONE: 3,
  ALARMS: 4,
} as const;

const stub: FocusNativeApi = {
  FocusInterruptionFilter: STUB_FILTERS,
  isFocusNativeModuleAvailable: () => false,
  hasNotificationPolicyAccess: () => false,
  openNotificationPolicySettings: () => undefined,
  getInterruptionFilter: () => STUB_FILTERS.ALL,
  setInterruptionFilter: () => false,
  canDrawOverlays: () => false,
  openOverlaySettings: () => undefined,
  showFocusOverlay: () => undefined,
  updateFocusOverlay: () => undefined,
  hideFocusOverlay: () => undefined,
  addOverlayActionListener: () => null,
};

function loadNative(): FocusNativeApi {
  if (Platform.OS !== 'android') return stub;
  try {
    // Local Expo module — present only in native APK builds.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('kivo-focus-lock') as FocusNativeApi;
  } catch {
    return stub;
  }
}

const native = loadNative();

export const FocusInterruptionFilter = native.FocusInterruptionFilter;
export const isFocusNativeModuleAvailable = native.isFocusNativeModuleAvailable;
export const hasNotificationPolicyAccess = native.hasNotificationPolicyAccess;
export const openNotificationPolicySettings = native.openNotificationPolicySettings;
export const getInterruptionFilter = native.getInterruptionFilter;
export const setInterruptionFilter = native.setInterruptionFilter;
export const canDrawOverlays = native.canDrawOverlays;
export const openOverlaySettings = native.openOverlaySettings;
export const showFocusOverlay = native.showFocusOverlay;
export const updateFocusOverlay = native.updateFocusOverlay;
export const hideFocusOverlay = native.hideFocusOverlay;
export const addOverlayActionListener = native.addOverlayActionListener;
