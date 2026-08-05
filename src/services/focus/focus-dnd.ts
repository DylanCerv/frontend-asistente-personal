import {
  FocusInterruptionFilter,
  getInterruptionFilter,
  hasNotificationPolicyAccess,
  openNotificationPolicySettings,
  setInterruptionFilter,
} from '@/services/focus/focus-native';
import {
  clearPreviousInterruptionFilter,
  savePreviousInterruptionFilter,
} from '@/services/focus/focus-session-store';

export async function enableFocusDnd(): Promise<boolean> {
  if (!hasNotificationPolicyAccess()) return false;

  const previous = getInterruptionFilter();
  await savePreviousInterruptionFilter(previous);

  // Priority only — blocks most interruptions while allowing alarms.
  return setInterruptionFilter(FocusInterruptionFilter.PRIORITY);
}

/**
 * Turn off Do Not Disturb when Focus ends.
 * Does not revoke the DND *permission* — only exits the quiet mode Focus enabled.
 */
export async function restoreFocusDnd(): Promise<void> {
  if (!hasNotificationPolicyAccess()) {
    await clearPreviousInterruptionFilter();
    return;
  }

  setInterruptionFilter(FocusInterruptionFilter.ALL);
  await clearPreviousInterruptionFilter();
}

export {
  hasNotificationPolicyAccess,
  openNotificationPolicySettings,
};
