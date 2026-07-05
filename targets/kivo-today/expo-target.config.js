/** @type {import('@bacons/apple-targets/app.plugin').ConfigFunction} */
module.exports = (config) => ({
  type: 'widget',
  name: 'Agenda de hoy',
  displayName: 'Agenda de hoy',
  deploymentTarget: '17.0',
  colors: {
    $accent: '#7C3AED',
    $widgetBackground: '#FFFFFF',
    brand: '#7C3AED',
    subtle: '#64748B',
    foreground: '#0F172A',
  },
  entitlements: {
    'com.apple.security.application-groups':
      config.ios?.entitlements?.['com.apple.security.application-groups'] ?? [
        'group.com.kivo.app.widget',
      ],
  },
});
