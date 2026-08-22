/**
 * Short-lived dedupe so the same schedule key is not presented twice
 * when local AlarmManager and remote Expo Push fire close together.
 */

const recentPresented = new Map<string, number>();
const TTL_MS = 2 * 60 * 1000;

function prune(now: number) {
  for (const [key, at] of recentPresented) {
    if (now - at > TTL_MS) recentPresented.delete(key);
  }
}

/** Returns true if this key was already presented within the TTL window. */
export function wasRecentlyPresented(scheduleKey: string | undefined | null): boolean {
  if (!scheduleKey) return false;
  const now = Date.now();
  prune(now);
  const at = recentPresented.get(scheduleKey);
  return typeof at === 'number' && now - at < TTL_MS;
}

export function markReminderPresented(scheduleKey: string | undefined | null): void {
  if (!scheduleKey) return;
  const now = Date.now();
  prune(now);
  recentPresented.set(scheduleKey, now);
}
