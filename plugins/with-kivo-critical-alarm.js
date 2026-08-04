const {
  withAndroidManifest,
  AndroidConfig,
  createRunOncePlugin,
} = require('@expo/config-plugins');

const PACKAGE_NAME = 'with-kivo-critical-alarm';

/**
 * Ensures Android can show lock-screen full-screen critical alarms:
 * permissions + MainActivity showWhenLocked / turnScreenOn.
 */
function withKivoCriticalAlarm(config) {
  config = AndroidConfig.Permissions.withPermissions(config, [
    'android.permission.USE_FULL_SCREEN_INTENT',
    'android.permission.SCHEDULE_EXACT_ALARM',
    'android.permission.USE_EXACT_ALARM',
    'android.permission.VIBRATE',
    'android.permission.POST_NOTIFICATIONS',
    'android.permission.WAKE_LOCK',
  ]);

  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults;
    const app = AndroidConfig.Manifest.getMainApplicationOrThrow(manifest);
    const activities = app.activity ?? [];

    for (const activity of activities) {
      const name = activity.$?.['android:name'] ?? '';
      if (!name.includes('MainActivity')) continue;
      activity.$['android:showWhenLocked'] = 'true';
      activity.$['android:turnScreenOn'] = 'true';
    }

    return config;
  });
}

module.exports = createRunOncePlugin(withKivoCriticalAlarm, PACKAGE_NAME, '1.0.0');
