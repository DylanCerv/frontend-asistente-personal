import AsyncStorage from '@react-native-async-storage/async-storage';

const PAGE_KEY_PREFIX = '@asistente/widget_priority_page_';

export const PRIORITY_CLICK_PREV = 'PRIORITY_PREV';
export const PRIORITY_CLICK_NEXT = 'PRIORITY_NEXT';

/** Below this height (dp), show one task at a time with page dots. */
export const PRIORITY_COMPACT_HEIGHT_MAX = 130;

function pageKey(widgetId: number): string {
  return `${PAGE_KEY_PREFIX}${widgetId}`;
}

export async function readPriorityPageIndex(widgetId: number): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(pageKey(widgetId));
    if (!raw) return 0;
    const parsed = Number.parseInt(raw, 10);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
  } catch {
    return 0;
  }
}

export async function writePriorityPageIndex(
  widgetId: number,
  index: number,
): Promise<void> {
  try {
    await AsyncStorage.setItem(pageKey(widgetId), String(Math.max(0, index)));
  } catch {
    // Best-effort persistence for widget paging.
  }
}

export function clampPriorityPageIndex(index: number, itemCount: number): number {
  if (itemCount <= 0) return 0;
  const normalized = ((index % itemCount) + itemCount) % itemCount;
  return normalized;
}

export function nextPriorityPageIndex(index: number, itemCount: number): number {
  return clampPriorityPageIndex(index + 1, itemCount);
}

export function prevPriorityPageIndex(index: number, itemCount: number): number {
  return clampPriorityPageIndex(index - 1, itemCount);
}
