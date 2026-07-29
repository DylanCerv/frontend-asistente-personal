# Kivo — Documentación

> **Habla. Nosotros organizamos.**

App móvil (Expo / React Native) de asistente personal con IA. El usuario habla o escribe; el backend (Express + Supabase + OpenAI) organiza tareas, eventos y recordatorios.

---

## Tabla de contenidos

1. [Inicio rápido](#inicio-rápido)
2. [Arquitectura](#arquitectura)
3. [Auth y datos](#auth-y-datos)
4. [Captura por voz e IA](#captura-por-voz-e-ia)
5. [Configuración (.env)](#configuración-env)
6. [Expo Go vs development build](#expo-go-vs-development-build)
7. [Estructura de archivos](#estructura-de-archivos)
8. [Seguridad](#seguridad)
9. [Roadmap](#roadmap)

---

## Inicio rápido

### Requisitos

- Node.js 18+
- Backend en marcha (`backend-asistente-personal`: `npm run dev:all`)
- Proyecto Supabase con migraciones aplicadas
- Para notificaciones / widgets: **development build** o APK (`EXPO_PUBLIC_NATIVE_BUILD=1`)

### Instalación (frontend)

```bash
cd frontend-asistente-personal
npm install
cp .env.example .env
# Edita EXPO_PUBLIC_API_BASE_URL con la IP de tu PC (misma WiFi)
npx expo start
```

### Backend

```bash
cd backend-asistente-personal
cp .env.example .env
# Rellena SUPABASE_* y OPENAI_API_KEY
# DEV_MOCK_AUTH=false  ← obligatorio para DB real
npm run dev:all
```

Registro e inicio de sesión van contra **Supabase Auth** vía la API del backend (`POST /api/auth/register`, `/login`). No hay modo demo de datos en el cliente.

---

## Arquitectura

```
App (Expo)  →  Backend Express (:3000/api)  →  Supabase (Auth + Postgres + Storage)
                                      ↘  OpenAI (transcripción + extracción + chat)
                                      ↘  Worker (jobs de audio)
```

| Capa | Ubicación | Rol |
|------|-----------|-----|
| Rutas | `src/app/` | expo-router |
| Pantallas | `src/screens/` | Onboarding, auth, splash, welcome |
| Componentes | `src/components/` | UI compartida |
| Contextos | `src/context/` | Auth, records/chat, preferencias, focus… |
| Servicios | `src/services/` | API client, audio, records, reminders… |
| Config | `src/config/` | API base URL, native build flag |

La app **no** incluye la OpenAI API key. Toda la IA corre en el backend.

---

## Auth y datos

- Sesión: tokens del backend en AsyncStorage (`@asistente/auth-session`).
- Perfil / settings: `PATCH /api/profiles/me`, `PATCH /api/settings/me`.
- Records: `GET/POST/PATCH/DELETE /api/records`.
- Avatar: upload directo a bucket Supabase `avatars` con el JWT del usuario + URL pública guardada en perfil.

**Backend:** deja `DEV_MOCK_AUTH=false` cuando uses Supabase. Con `true`, los usuarios son en memoria y fallan FK al crear jobs/settings.

---

## Captura por voz e IA

```
Micrófono → POST /api/audio → job en Supabase
         → Worker: Whisper + extracción → records
         → App hace poll del job → refresca lista
```

Chat de texto: `POST /api/chat` (mismo backend).

Archivos clave:

| Archivo | Función |
|---------|---------|
| `services/audio/process-voice-recording.ts` | Upload + espera de job |
| `services/audio/upload-audio.ts` | Multipart al backend |
| `context/assistant-context.tsx` | Chat + voz + records |
| `components/voice-capture-sheet.tsx` | UI de captura |

---

## Configuración (.env)

Frontend (`.env.example`):

```env
EXPO_PUBLIC_API_BASE_URL=http://192.168.x.x:3000/api
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=....apps.googleusercontent.com
# EXPO_PUBLIC_NATIVE_BUILD=1   # solo APK / development build
# EXPO_PUBLIC_MERCADOPAGO_CHECKOUT_URL=...
```

Backend:

```env
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
OPENAI_API_KEY=...
DEV_MOCK_AUTH=false
# Local: CORS_ORIGIN=*
# Prod: CORS_ORIGIN=https://tu-dominio.com
```

Reinicia Expo y el backend tras cambiar variables.

---

## Expo Go vs development build

| Capacidad | Expo Go | Development build / APK |
|-----------|---------|---------------------------|
| Auth, chat, records, voz (API) | Sí | Sí |
| Notificaciones locales / critical alarm | No | Sí (`EXPO_PUBLIC_NATIVE_BUILD=1`) |
| Widgets / focus lock nativo | No | Sí |

Flujo recomendado ahora: probar en **development build**; SecureStore y ajustes de producción después de validar.

---

## Estructura de archivos

```
src/
├── app/                 # Rutas (splash, auth, (main)/…)
├── components/          # UI (auth, focus, assistant, profile…)
├── context/             # Auth, assistant, preferences, focus…
├── services/
│   ├── api/             # api-client, errores
│   ├── audio/           # upload + poll de jobs
│   ├── auth/            # login/register API
│   ├── records/
│   ├── reminders/
│   ├── profiles/        # avatar upload
│   └── …
├── hooks/
├── screens/
├── types/
└── config/api.ts
```

---

## Seguridad

- No pongas `OPENAI_API_KEY` ni service role en el frontend.
- En producción: `NODE_ENV=production` (Swagger desactivado), `CORS_ORIGIN` restringido, `DEV_MOCK_AUTH=false`.
- Todas las rutas de negocio del backend usan `authMiddleware` (incluido `GET /api/roles`).
- Bucket `avatars`: público en lectura; la subida exige JWT. Policies deberían limitar path a `{userId}/*`.

---

## Roadmap

- Validar todo en development build → producción
- SecureStore para tokens (post-dev-build)
- Push remotas (hoy: locales en native build)
- Hardening CORS / secrets en hosting

---

## Convenciones

- **Código:** inglés  
- **UI / docs:** español  
- **Marca:** Kivo  

---

*Última actualización: julio 2026 — auth real Supabase, sin mock client*
