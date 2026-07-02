# Asistente

> **Habla. Nosotros organizamos.**

Asistente personal con IA para iOS, Android y Web. Habla o escribe; la IA organiza tareas, eventos y recordatorios.

## Documentación completa

**Lee [DOCUMENTATION.md](./DOCUMENTATION.md)** — guía oficial v1 para el equipo. Incluye:

- Arquitectura y estructura de archivos
- Flujo de pantallas (onboarding → login → app)
- Captura por voz + Whisper + endpoint IA
- Agenda con filtros por rango y reportes PDF
- Accesos rápidos y configuración `.env`
- Changelog y roadmap

## Inicio rápido

```bash
npm install
cp .env.example .env
npx expo start
```

### Variables de entorno

```env
EXPO_PUBLIC_OPENAI_API_KEY=sk-...
EXPO_PUBLIC_ASSISTANT_API_URL=https://tu-api.com/assistant/chat
```

### Login mock

- Email: `e1@gmail.com`
- Contraseña: `ejem1234`

## Stack

- Expo 54 · React Native · expo-router 6
- NativeWind 4 (Tailwind)
- TypeScript
- Whisper (OpenAI) · expo-print · expo-quick-actions

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm start` | Inicia Expo |
| `npm run ios` | iOS |
| `npm run android` | Android |
| `npm run web` | Web |

---

Ver [DOCUMENTATION.md](./DOCUMENTATION.md) para detalles completos de la v1.
