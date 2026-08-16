import { isRunningInExpoGo } from 'expo';
import { LogBox } from 'react-native';

import { isNativeBuildEnabled } from './src/config/native-build';
import { registerCriticalAlarmBackgroundHandler } from './src/services/reminders/critical-alarm-background';
import { registerFocusSessionBackgroundHandler } from './src/services/focus/focus-session-background';

import 'expo-router/entry';

// Known Expo Go noise when reopening while the activity/network is still settling.
if (__DEV__) {
  LogBox.ignoreLogs(['Unable to activate keep awake']);
}

// Soften unhandled keep-awake rejections from expo-audio internals in Expo Go.
if (typeof globalThis !== 'undefined' && typeof ErrorUtils !== 'undefined') {
  const previousHandler = ErrorUtils.getGlobalHandler?.();
  ErrorUtils.setGlobalHandler?.((error, isFatal) => {
    const message = error instanceof Error ? error.message : String(error ?? '');
    if (!isFatal && /Unable to activate keep awake/i.test(message)) {
      return;
    }
    previousHandler?.(error, isFatal);
  });
}

// Android home widgets require a custom native build (APK / EAS / expo-dev-client).
// Off automatically in Expo Go via isNativeBuildEnabled().
if (isNativeBuildEnabled() && !isRunningInExpoGo()) {
  registerCriticalAlarmBackgroundHandler();
  registerFocusSessionBackgroundHandler();

  try {
    // Sync registration so WIDGET_ADDED/UPDATE can render as soon as JS loads.
    // Dynamic import left a race that left home-screen widgets blank.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { registerWidgetTaskHandler } = require('react-native-android-widget');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { widgetTaskHandler } = require('./src/services/widgets/widget-task-handler');
    registerWidgetTaskHandler(widgetTaskHandler);
  } catch {
    // Native widget module unavailable in this runtime.
  }
}
