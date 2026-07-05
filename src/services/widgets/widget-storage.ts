import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

import {
  IOS_APP_GROUP,
  IOS_WIDGET_KIND,
  WIDGET_NAME,
  WIDGET_PAYLOAD_KEY,
  type WidgetTodayPayload,
} from './widget-types';

export async function readWidgetPayload(): Promise<WidgetTodayPayload | null> {
  const raw = await AsyncStorage.getItem(WIDGET_PAYLOAD_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as WidgetTodayPayload;
  } catch {
    return null;
  }
}

async function writeIosWidgetPayload(payload: WidgetTodayPayload): Promise<void> {
  if (Platform.OS !== 'ios') return;

  try {
    const { ExtensionStorage } = await import('@bacons/apple-targets');
    const storage = new ExtensionStorage(IOS_APP_GROUP);
    storage.set(WIDGET_PAYLOAD_KEY, JSON.stringify(payload));
  } catch {
    // Native module unavailable in Expo Go.
  }
}

export async function writeWidgetPayload(payload: WidgetTodayPayload): Promise<void> {
  const serialized = JSON.stringify(payload);
  await AsyncStorage.setItem(WIDGET_PAYLOAD_KEY, serialized);
  await writeIosWidgetPayload(payload);
}

export async function clearWidgetPayload(): Promise<void> {
  await AsyncStorage.removeItem(WIDGET_PAYLOAD_KEY);

  if (Platform.OS === 'ios') {
    try {
      const { ExtensionStorage } = await import('@bacons/apple-targets');
      const storage = new ExtensionStorage(IOS_APP_GROUP);
      storage.remove(WIDGET_PAYLOAD_KEY);
    } catch {
      // Native module unavailable in Expo Go.
    }
  }
}

export function isAndroidWidgetSupported(): boolean {
  return Platform.OS === 'android';
}

export function isIosWidgetSupported(): boolean {
  return Platform.OS === 'ios';
}

export async function refreshAndroidWidget(payload: WidgetTodayPayload): Promise<void> {
  if (!isAndroidWidgetSupported()) return;

  try {
    const { requestWidgetUpdate } = await import('react-native-android-widget');
    const { KivoTodayWidgetView } = await import('./kivo-today-widget-view');
    const React = await import('react');

    await requestWidgetUpdate({
      widgetName: WIDGET_NAME,
      renderWidget: () => React.createElement(KivoTodayWidgetView, { payload }),
    });
  } catch {
    // Native module unavailable in Expo Go.
  }
}

export async function refreshIosWidget(): Promise<void> {
  if (!isIosWidgetSupported()) return;

  try {
    const { ExtensionStorage } = await import('@bacons/apple-targets');
    ExtensionStorage.reloadWidget(IOS_WIDGET_KIND);
  } catch {
    // Native module unavailable in Expo Go.
  }
}

export async function syncHomeWidget(payload: WidgetTodayPayload): Promise<void> {
  await writeWidgetPayload(payload);
  await refreshAndroidWidget(payload);
  await refreshIosWidget();
}
