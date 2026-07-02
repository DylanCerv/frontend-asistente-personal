const appJson = require('./app.json');

module.exports = () => ({
  expo: {
    ...appJson.expo,
    extra: {
      apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:3000/api',
    },
    plugins: [
      ...(appJson.expo.plugins ?? []),
      [
        'expo-av',
        {
          microphonePermission:
            'Permite grabar notas de voz para que tu asistente las procese.',
        },
      ],
    ],
  },
});
