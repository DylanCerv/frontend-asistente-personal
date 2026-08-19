const appJson = require("./app.json");

/**
 * Native-only plugins for APK / EAS (widgets + local notifications).
 * Off by default for Expo Go. Reactivate with EXPO_PUBLIC_NATIVE_BUILD=1.
 */
const useNativeBuild = process.env.EXPO_PUBLIC_NATIVE_BUILD === "1";

/**
 * EAS projectId forces Expo CLI to ask "Log in / Proceed anonymously".
 * Omit it for local Expo Go (`npm start`) so it always runs anonymously.
 * Include it for EAS / native builds (eas.json already sets EXPO_PUBLIC_NATIVE_BUILD=1).
 */

// const easProjectId = "2be79503-ab8b-482b-a863-b1eaebd52f07"; //esta Id es del usuario  Emulator
const easProjectId = appJson.expo?.extra?.eas?.projectId; // @kivo2026/kivo
const includeEasProjectId =
  process.env.EAS_BUILD === "true" ||
  process.env.EXPO_PUBLIC_NATIVE_BUILD === "1" ||
  process.env.EXPO_INCLUDE_EAS_PROJECT_ID === "1";

const androidWidgetConfig = {
  widgets: [
    {
      name: "KivoToday",
      label: "Agenda de hoy",
      description: "Tareas y reuniones de hoy sin abrir Kivo.",
      minWidth: "250dp",
      minHeight: "110dp",
      targetCellWidth: 4,
      targetCellHeight: 2,
      previewImage: "./assets/images/widgets/preview-today.png",
      resizeMode: "horizontal|vertical",
      updatePeriodMillis: 1800000,
    },
    {
      name: "KivoPriority",
      label: "No olvides de",
      description: "Tu tarea Focus del día con avance.",
      minWidth: "250dp",
      minHeight: "72dp",
      targetCellWidth: 4,
      targetCellHeight: 1,
      previewImage: "./assets/images/widgets/preview-priority.png",
      resizeMode: "horizontal|vertical",
      updatePeriodMillis: 1800000,
    },
    {
      name: "KivoCapture",
      label: "Captura rápida",
      description: "Abre el Asistente y empieza a grabar voz.",
      minWidth: "72dp",
      minHeight: "72dp",
      targetCellWidth: 1,
      targetCellHeight: 1,
      previewImage: "./assets/images/widgets/preview-capture.png",
      resizeMode: "horizontal|vertical",
      updatePeriodMillis: 86400000,
    },
  ],
};

const nativeBuildPlugins = useNativeBuild
  ? [
      "@bacons/apple-targets",
      ["react-native-android-widget", androidWidgetConfig],
      [
        "expo-notifications",
        {
          icon: "./assets/images/icon.png",
          color: "#7C3AED",
          sounds: [
            "./assets/sounds/critical_alarm.wav",
            "./assets/sounds/kivo_soft.wav",
            "./assets/sounds/kivo_clear.wav",
            "./assets/sounds/kivo_urgent.wav",
          ],
        },
      ],
      "./plugins/with-kivo-critical-alarm",
      "./plugins/with-kivo-focus-lock",
      [
        "expo-calendar",
        {
          calendarPermission:
            "Kivo lee tu calendario del teléfono para mostrarte reuniones y ayudarte a organizar el día.",
        },
      ],
    ]
  : [];

module.exports = () => ({
  expo: {
    ...appJson.expo,
    extra: {
      apiBaseUrl:
        process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:3000/api",
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? "",
      ...(includeEasProjectId
        ? {
            eas: {
              projectId: easProjectId,
            },
          }
        : {}),
    },
    plugins: [
      ...(appJson.expo.plugins ?? []),
      ...nativeBuildPlugins,
      [
        "expo-build-properties",
        {
          android: {
            usesCleartextTraffic: true,
          },
        },
      ],
      "expo-asset",
      "expo-apple-authentication",
      [
        "expo-local-authentication",
        {
          faceIDPermission: "Permite desbloquear Kivo con Face ID.",
        },
      ],
      "expo-secure-store",
      "@react-native-community/datetimepicker",
    ],
  },
});
