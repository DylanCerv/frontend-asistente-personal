/** @type {import('@bacons/apple-targets/app.plugin').ConfigFunction} */
module.exports = (config) => ({
  type: 'widget',
  name: 'Kivo Widgets',
  displayName: 'Kivo',
  deploymentTarget: '17.0',
  colors: {
    $accent: '#C4B5FD',
    $widgetBackground: '#171717',
    brand: '#C4B5FD',
    teal: '#22D3EE',
    subtle: '#8A8A8A',
    foreground: '#FFFFFF',
    surface: '#171717',
    canvas: '#050505',
    track: '#2A2A2A',
  },
  entitlements: {
    'com.apple.security.application-groups':
      config.ios?.entitlements?.['com.apple.security.application-groups'] ?? [
        'group.com.kivo.app.widget',
      ],
  },
});
