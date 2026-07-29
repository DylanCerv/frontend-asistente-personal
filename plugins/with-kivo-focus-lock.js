const {
  withAndroidManifest,
  AndroidConfig,
  createRunOncePlugin,
} = require('@expo/config-plugins');

const PACKAGE_NAME = 'with-kivo-focus-lock';

/**
 * Permissions for Focus lock: DND policy, overlay, foreground service.
 */
function withKivoFocusLock(config) {
  config = AndroidConfig.Permissions.withPermissions(config, [
    'android.permission.ACCESS_NOTIFICATION_POLICY',
    'android.permission.SYSTEM_ALERT_WINDOW',
    'android.permission.FOREGROUND_SERVICE',
    'android.permission.FOREGROUND_SERVICE_SPECIAL_USE',
    'android.permission.POST_NOTIFICATIONS',
    'android.permission.WAKE_LOCK',
  ]);

  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults;
    const app = AndroidConfig.Manifest.getMainApplicationOrThrow(manifest);

    // Ensure Notifee / focus FGS can declare specialUse where needed.
    const services = app.service ?? [];
    for (const service of services) {
      const name = service.$?.['android:name'] ?? '';
      if (!name.includes('ForegroundService') && !name.includes('notifee')) continue;
      if (!service.$['android:foregroundServiceType']) {
        service.$['android:foregroundServiceType'] = 'specialUse';
      }
    }

    return config;
  });
}

module.exports = createRunOncePlugin(withKivoFocusLock, PACKAGE_NAME, '1.0.0');
