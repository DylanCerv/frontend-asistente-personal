import { isRunningInExpoGo } from 'expo';

import { isNativeBuildEnabled } from './src/config/native-build';
import { registerCriticalAlarmBackgroundHandler } from './src/services/reminders/critical-alarm-background';
import { registerFocusSessionBackgroundHandler } from './src/services/focus/focus-session-background';

import 'expo-router/entry';

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
