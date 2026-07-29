# Kivo

> **Habla. Nosotros organizamos.**

Asistente personal con IA para iOS y Android (Expo). Habla o escribe; el backend organiza tareas, eventos y recordatorios en Supabase.

## Documentación

**[DOCUMENTATION.md](./DOCUMENTATION.md)** — arquitectura, auth, voz, `.env`, Expo Go vs development build y seguridad.

## Inicio rápido

```bash
npm install
cp .env.example .env
# EXPO_PUBLIC_API_BASE_URL=http://<IP-de-tu-PC>:3000/api
# EXPO_PUBLIC_SUPABASE_URL=https://….supabase.co
npx expo start
```

El backend debe estar corriendo (`backend-asistente-personal`: `npm run dev:all`) con `DEV_MOCK_AUTH=false` y las keys de Supabase/OpenAI.

### Variables principales

```env
EXPO_PUBLIC_API_BASE_URL=http://192.168.x.x:3000/api
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=….apps.googleusercontent.com
```

Chat y voz usan el mismo backend (`/api/chat`, `/api/audio`). **No** pongas la OpenAI key en el frontend.

## Stack

- Expo 54 · React Native · expo-router 6
- NativeWind 4 · TypeScript
- Backend Express + Supabase + OpenAI (proyecto hermano)

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm start` | Expo (Expo Go por defecto) |
| `npm run android` / `ios` | Abrir en emulador / dispositivo |
| `npm run lint` | ESLint |

Para notificaciones y widgets: development build o APK con `EXPO_PUBLIC_NATIVE_BUILD=1` (ver DOCUMENTATION.md).
