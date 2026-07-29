import {
  FocusInterruptionFilter,
  getInterruptionFilter,
  hasNotificationPolicyAccess,
  openNotificationPolicySettings,
  setInterruptionFilter,
} from '@/services/focus/focus-native';
import {
  clearPreviousInterruptionFilter,
  loadPreviousInterruptionFilter,
  savePreviousInterruptionFilter,
} from '@/services/focus/focus-session-store';

export async function enableFocusDnd(): Promise<boolean> {
  if (!hasNotificationPolicyAccess()) return false;

  const previous = getInterruptionFilter();
  await savePreviousInterruptionFilter(previous);

  // Priority only — blocks most interruptions while allowing alarms.
  return setInterruptionFilter(FocusInterruptionFilter.PRIORITY);
}

export async function restoreFocusDnd(): Promise<void> {
  if (!hasNotificationPolicyAccess()) {
    await clearPreviousInterruptionFilter();
    return;
  }

  const previous = await loadPreviousInterruptionFilter();
  const filter = previous ?? FocusInterruptionFilter.ALL;
  setInterruptionFilter(filter);
  await clearPreviousInterruptionFilter();
}

export {
  hasNotificationPolicyAccess,
  openNotificationPolicySettings,
};
