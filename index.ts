import { isRunningInExpoGo } from 'expo';

import { isNativeBuildEnabled } from './src/config/native-build';
import { registerCriticalAlarmBackgroundHandler } from './src/services/reminders/critical-alarm-background';
import { registerFocusSessionBackgroundHandler } from './src/services/focus/focus-session-background';

import 'expo-router/entry';

// Android home widgets require a custom native build (APK / EAS).
// Reactivate with EXPO_PUBLIC_NATIVE_BUILD=1 — not available in Expo Go.
if (isNativeBuildEnabled() && !isRunningInExpoGo()) {
  registerCriticalAlarmBackgroundHandler();
  registerFocusSessionBackgroundHandler();

  void import('react-native-android-widget')
    .then(({ registerWidgetTaskHandler }) =>
      import('./src/services/widgets/widget-task-handler').then(({ widgetTaskHandler }) => {
        registerWidgetTaskHandler(widgetTaskHandler);
      }),
    )
    .catch(() => {
      // Native widget module unavailable in this runtime.
    });
}
