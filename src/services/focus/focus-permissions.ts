import { isRunningInExpoGo } from 'expo';
import * as Device from 'expo-device';
import { Linking, Platform } from 'react-native';

import { isNativeBuildEnabled } from '@/config/native-build';
import type { FocusLockIntensity } from '@/services/focus/focus-lock-intensity';
import {
  canDrawOverlays,
  hasNotificationPolicyAccess,
  openNotificationPolicySettings,
  openOverlaySettings,
} from '@/services/focus/focus-native';
import {
  checkNotificationPermissions,
  requestNotificationPermissions,
} from '@/services/reminders/reminder-notifications';

export type FocusPermissionStatus = {
  notifications: boolean;
  dnd: boolean;
  dndAvailable: boolean;
  overlay: boolean;
  overlayAvailable: boolean;
};

export type EnsureFocusPermissionsResult = {
  ok: boolean;
  status: FocusPermissionStatus;
  /** Intensity to use after degradation (strict → standard if overlay missing) */
  effectiveIntensity: FocusLockIntensity;
};

function canUseNativeFocusLock(): boolean {
  return (
    isNativeBuildEnabled() &&
    Platform.OS === 'android' &&
    Device.isDevice &&
    !isRunningInExpoGo()
  );
}

export async function getFocusPermissionStatus(
  intensity: FocusLockIntensity,
): Promise<FocusPermissionStatus> {
  const notifications = await checkNotificationPermissions();
  const native = canUseNativeFocusLock();

  if (!native) {
    return {
      notifications,
      dnd: false,
      dndAvailable: false,
      overlay: false,
      overlayAvailable: false,
    };
  }

  const dnd = await hasNotificationPolicyAccess();
  const overlay = intensity === 'strict' ? await canDrawOverlays() : true;

  return {
    notifications,
    dnd,
    dndAvailable: true,
    overlay,
    overlayAvailable: intensity === 'strict',
  };
}

export async function ensureFocusPermissions(
  intensity: FocusLockIntensity,
  options: { openSettings?: boolean } = {},
): Promise<EnsureFocusPermissionsResult> {
  const openSettings = options.openSettings ?? true;
  let notifications = await checkNotificationPermissions();
  if (!notifications) {
    notifications = await requestNotificationPermissions();
  }

  const native = canUseNativeFocusLock();
  if (!native) {
    const status: FocusPermissionStatus = {
      notifications,
      dnd: false,
      dndAvailable: false,
      overlay: false,
      overlayAvailable: false,
    };
    return {
      ok: notifications,
      status,
      effectiveIntensity: 'standard',
    };
  }

  let dnd = await hasNotificationPolicyAccess();
  if (!dnd && openSettings) {
    await openNotificationPolicySettings();
    // Leave dnd as-is until the user returns from Settings and we re-check.
  }

  let overlay = true;
  if (intensity === 'strict') {
    overlay = await canDrawOverlays();
    if (!overlay && openSettings) {
      await openOverlaySettings();
      // Leave overlay as-is until the user returns from Settings.
    }
  }

  const status: FocusPermissionStatus = {
    notifications,
    dnd,
    dndAvailable: true,
    overlay,
    overlayAvailable: intensity === 'strict',
  };

  let effectiveIntensity: FocusLockIntensity = intensity;
  if (intensity === 'strict' && !overlay) {
    effectiveIntensity = 'standard';
  }

  const ok =
    notifications &&
    (dnd || !status.dndAvailable) &&
    (effectiveIntensity === 'standard' || overlay);

  return { ok, status, effectiveIntensity };
}

/** Soft check without forcing settings screens (for session start). */
export async function resolveEffectiveFocusIntensity(
  intensity: FocusLockIntensity,
): Promise<{ effectiveIntensity: FocusLockIntensity; status: FocusPermissionStatus }> {
  const status = await getFocusPermissionStatus(intensity);
  let notifications = status.notifications;
  if (!notifications) {
    notifications = await requestNotificationPermissions();
    status.notifications = notifications;
  }

  if (intensity === 'strict' && status.overlayAvailable && !status.overlay) {
    return { effectiveIntensity: 'standard', status };
  }

  return {
    effectiveIntensity: canUseNativeFocusLock() ? intensity : 'standard',
    status: { ...status, notifications },
  };
}

export async function openAppNotificationSettings(): Promise<void> {
  try {
    await Linking.openSettings();
  } catch {
    // Settings unavailable.
  }
}

export function canUseFocusNativeFeatures(): boolean {
  return canUseNativeFocusLock();
}
