const appJson = require('./app.json');

const androidWidgetConfig = {
  widgets: [
    {
      name: 'KivoToday',
      label: 'Agenda de hoy',
      description: 'Tareas y reuniones de hoy sin abrir Kivo.',
      minWidth: '250dp',
      minHeight: '110dp',
      targetCellWidth: 4,
      targetCellHeight: 2,
      previewImage: './assets/images/icon.png',
      resizeMode: 'horizontal|vertical',
      updatePeriodMillis: 1800000,
    },
  ],
};

module.exports = () => ({
  expo: {
    ...appJson.expo,
    extra: {
      apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:3000/api',
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
    },
    plugins: [
      ...(appJson.expo.plugins ?? []),
      '@bacons/apple-targets',
      ['react-native-android-widget', androidWidgetConfig],
      'expo-asset',
      'expo-apple-authentication',
      [
        'expo-av',
        {
          microphonePermission:
            'Permite grabar notas de voz para que Kivo las procese.',
        },
      ],
      [
        'expo-notifications',
        {
          icon: './assets/images/icon.png',
          color: '#7C3AED',
        },
      ],
      [
        'expo-local-authentication',
        {
          faceIDPermission: 'Permite desbloquear Kivo con Face ID.',
        },
      ],
      'expo-secure-store',
      '@react-native-community/datetimepicker',
    ],
  },
});
