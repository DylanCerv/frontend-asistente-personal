import AsyncStorage from '@react-native-async-storage/async-storage';
import { isRunningInExpoGo } from 'expo';
import { Platform } from 'react-native';

import { isNativeBuildEnabled } from '@/config/native-build';

import {
  ANDROID_WIDGET_NAMES,
  IOS_APP_GROUP,
  IOS_WIDGET_KINDS,
  WIDGET_PAYLOAD_KEY,
  type WidgetHomePayload,
  type WidgetTodayPayload,
} from './widget-types';

const LEGACY_PAYLOAD_KEY = '@asistente/widget_payload_v1';

export async function readHomeWidgetPayload(): Promise<WidgetHomePayload | null> {
  const raw = await AsyncStorage.getItem(WIDGET_PAYLOAD_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as WidgetHomePayload;
  } catch {
    return null;
  }
}

/** @deprecated Prefer readHomeWidgetPayload */
export async function readWidgetPayload(): Promise<WidgetTodayPayload | null> {
  const home = await readHomeWidgetPayload();
  if (home?.today) return home.today;

  const legacy = await AsyncStorage.getItem(LEGACY_PAYLOAD_KEY);
  if (!legacy) return null;

  try {
    return JSON.parse(legacy) as WidgetTodayPayload;
  } catch {
    return null;
  }
}

async function writeIosWidgetPayload(payload: WidgetHomePayload): Promise<void> {
  if (Platform.OS !== 'ios') return;

  try {
    const { ExtensionStorage } = await import('@bacons/apple-targets');
    const storage = new ExtensionStorage(IOS_APP_GROUP);
    storage.set(WIDGET_PAYLOAD_KEY, JSON.stringify(payload));
  } catch {
    // Native module unavailable in Expo Go.
  }
}

export async function writeHomeWidgetPayload(payload: WidgetHomePayload): Promise<void> {
  const serialized = JSON.stringify(payload);
  await AsyncStorage.setItem(WIDGET_PAYLOAD_KEY, serialized);
  await writeIosWidgetPayload(payload);
}

/** @deprecated Prefer writeHomeWidgetPayload */
export async function writeWidgetPayload(payload: WidgetTodayPayload): Promise<void> {
  const home = await readHomeWidgetPayload();
  if (!home) return;
  await writeHomeWidgetPayload({ ...home, today: payload, updatedAt: payload.updatedAt });
}

export async function clearWidgetPayload(): Promise<void> {
  await AsyncStorage.removeItem(WIDGET_PAYLOAD_KEY);
  await AsyncStorage.removeItem(LEGACY_PAYLOAD_KEY);

  if (Platform.OS === 'ios') {
    try {
      const { ExtensionStorage } = await import('@bacons/apple-targets');
      const storage = new ExtensionStorage(IOS_APP_GROUP);
      storage.remove(WIDGET_PAYLOAD_KEY);
      storage.remove(LEGACY_PAYLOAD_KEY);
    } catch {
      // Native module unavailable in Expo Go.
    }
  }
}

export function isAndroidWidgetSupported(): boolean {
  return Platform.OS === 'android' && isNativeBuildEnabled() && !isRunningInExpoGo();
}

export function isIosWidgetSupported(): boolean {
  return Platform.OS === 'ios' && isNativeBuildEnabled() && !isRunningInExpoGo();
}

export async function refreshAndroidWidgets(payload: WidgetHomePayload): Promise<void> {
  if (!isAndroidWidgetSupported()) return;

  try {
    const { requestWidgetUpdate } = await import('react-native-android-widget');
    const React = await import('react');
    const { KivoTodayWidgetView } = await import('./kivo-today-widget-view');
    const { KivoPriorityWidgetView } = await import('./kivo-priority-widget-view');
    const { KivoCaptureWidgetView } = await import('./kivo-capture-widget-view');
    const { KivoFocusPointsWidgetView } = await import('./kivo-focus-points-widget-view');

    await Promise.all(
      ANDROID_WIDGET_NAMES.map(async (widgetName) => {
        await requestWidgetUpdate({
          widgetName,
          renderWidget: () => {
            switch (widgetName) {
              case 'KivoPriority':
                return React.createElement(KivoPriorityWidgetView, {
                  payload: payload.priority,
                  enabled: payload.enabled,
                });
              case 'KivoCapture':
                return React.createElement(KivoCaptureWidgetView, {
                  payload: payload.capture,
                });
              case 'KivoFocusPoints':
                return React.createElement(KivoFocusPointsWidgetView, {
                  payload: payload.focusPoints,
                  enabled: payload.enabled,
                });
              case 'KivoToday':
              default:
                return React.createElement(KivoTodayWidgetView, {
                  payload: payload.today,
                });
            }
          },
        });
      }),
    );
  } catch {
    // Native module unavailable in Expo Go.
  }
}

/** @deprecated Prefer refreshAndroidWidgets */
export async function refreshAndroidWidget(payload: WidgetTodayPayload): Promise<void> {
  const home = await readHomeWidgetPayload();
  if (!home) return;
  await refreshAndroidWidgets({ ...home, today: payload });
}

export async function refreshIosWidgets(): Promise<void> {
  if (!isIosWidgetSupported()) return;

  try {
    const { ExtensionStorage } = await import('@bacons/apple-targets');
    for (const kind of IOS_WIDGET_KINDS) {
      ExtensionStorage.reloadWidget(kind);
    }
  } catch {
    // Native module unavailable in Expo Go.
  }
}

/** @deprecated Prefer refreshIosWidgets */
export async function refreshIosWidget(): Promise<void> {
  await refreshIosWidgets();
}

export async function syncHomeWidgets(payload: WidgetHomePayload): Promise<void> {
  await writeHomeWidgetPayload(payload);
  await refreshAndroidWidgets(payload);
  await refreshIosWidgets();
}

/** @deprecated Prefer syncHomeWidgets */
export async function syncHomeWidget(payload: WidgetTodayPayload): Promise<void> {
  const home = await readHomeWidgetPayload();
  const next: WidgetHomePayload = home
    ? { ...home, today: payload, updatedAt: payload.updatedAt, enabled: payload.enabled }
    : {
        version: 2,
        updatedAt: payload.updatedAt,
        enabled: payload.enabled,
        signedIn: payload.enabled,
        today: payload,
        priority: {
          label: 'PRIORIDAD ACTUAL',
          title: payload.headline,
          dueLabel: payload.emptyMessage ?? '',
          progressPercent: 0,
          deepLink: 'kivo:///',
        },
        capture: {
          title: 'Quick Capture',
          subtitle: 'TAP TO RECORD',
          deepLink: 'kivo://capture',
        },
        focusPoints: {
          valueLabel: '—',
          label: 'Focus Points',
          deltaLabel: '—',
          deltaPositive: true,
          progressPercent: 0,
          deepLink: 'kivo://report',
        },
      };

  await syncHomeWidgets(next);
}
