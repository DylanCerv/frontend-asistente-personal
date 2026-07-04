const appJson = require('./app.json');

module.exports = () => ({
  expo: {
    ...appJson.expo,
    extra: {
      apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:3000/api',
    },
    plugins: [
      ...(appJson.expo.plugins ?? []),
      'expo-asset',
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
      '@react-native-community/datetimepicker',
    ],
  },
});
