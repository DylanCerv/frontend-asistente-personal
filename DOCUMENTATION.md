# Asistente — Documentación v2.0.0

> **Habla. Nosotros organizamos.**

Asistente es una aplicación móvil (Expo / React Native) que funciona como **asistente personal con IA**, no como un gestor de tareas tradicional. El usuario habla o escribe; la IA organiza tareas, eventos, recordatorios y finanzas.

Este documento refleja el estado actual del proyecto tras las fases de refactor (julio 2026).

---

## Tabla de contenidos

1. [Inicio rápido](#inicio-rápido)
2. [Filosofía del producto](#filosofía-del-producto)
3. [Arquitectura](#arquitectura)
4. [Flujo de la aplicación](#flujo-de-la-aplicación)
5. [Pantallas y navegación](#pantallas-y-navegación)
6. [Modo demo (mock)](#modo-demo-mock)
7. [Captura por voz e IA](#captura-por-voz-e-ia)
8. [Recordatorios inteligentes](#recordatorios-inteligentes)
9. [Agenda, Memoria y Finanzas](#agenda-memoria-y-finanzas)
10. [Configuración (.env)](#configuración-env)
11. [Estructura de archivos](#estructura-de-archivos)
12. [Fases completadas](#fases-completadas)
13. [Roadmap](#roadmap)

---

## Inicio rápido

### Requisitos

- Node.js 18+
- npm
- Expo CLI (`npx expo`)
- Para notificaciones locales y quick actions: build de desarrollo (`npx expo run:android` / `run:ios`)

### Instalación

```bash
npm install
cp .env.example .env
npx expo start
```

### Credenciales mock (desarrollo)

| Campo | Valor |
|-------|-------|
| Email | `e1@gmail.com` |
| Contraseña | `ejem1234` |

También puedes usar **Google**, **Apple** o **registro por correo** (mock, sin Supabase).

### Reiniciar onboarding

El onboarding se guarda en AsyncStorage (`@asistente/onboarding_complete`). Para verlo de nuevo: desinstala la app o borra datos de la app.

---

## Filosofía del producto

| Principio | Descripción |
|-----------|-------------|
| **Voz primero** | Registrar con mínima fricción |
| **IA organiza** | Tipo, fecha, prioridad, cliente, proyecto |
| **Home como centro** | Insights proactivos + chat fusionado |
| **Pantallas complementarias** | Memoria, Agenda, Finanzas |
| **Perfil secundario** | Configuración, no navegación principal |

No es una app de listas ni un dashboard de análisis. Los insights en Home son contextuales y accionables.

---

## Arquitectura

```
Expo 54 + React Native + expo-router 6
NativeWind 4 (Tailwind CSS)
TypeScript
```

### Capas

| Capa | Ubicación | Responsabilidad |
|------|-----------|-----------------|
| Rutas | `src/app/` | Navegación file-based (expo-router) |
| Pantallas UI | `src/screens/` | Splash, Onboarding, Auth |
| Componentes | `src/components/` | UI compartida (voz, insights, auth) |
| Contextos | `src/context/` | Estado global |
| Servicios | `src/services/` | Records, IA, voz, recordatorios, finanzas |
| Tipos | `src/types/` | TypeScript types |
| Hooks | `src/hooks/` | Sincronización, quick actions |

### Providers (orden en `src/app/_layout.tsx`)

```
ThemePreferenceProvider
  └── UserPreferencesProvider
        └── SubscriptionProvider
              └── AppFlowProvider
                    └── AuthProvider
                          └── Stack Navigator
```

Dentro de `(main)`:

```
AssistantProvider
  └── VoiceCaptureProvider
        └── Stack + ReminderSync + FAB micrófono + VoiceCaptureSheet
```

### Fuente de verdad de datos

`records` (tipo `MemoryRecord`) es la fuente única. Tareas, eventos y recordatorios se derivan en `assistant-context` vía `record-mappers.ts`.

---

## Flujo de la aplicación

```
Splash ("Habla. Nosotros organizamos.")
    ↓
Login / Registro (Google · Apple · Correo)
    ↓
Onboarding (solo registro nuevo)
    ├── 3 slides de bienvenida
    └── Permisos: micrófono + notificaciones
    ↓
Home (centro de la app)
    ├── Insights proactivos
    ├── Chat con historial
    └── Input voz / texto
    ↓
Memoria | Agenda | Finanzas  (navegación secundaria)
Perfil (acceso desde ⚙️ en Home)
```

**Notas de flujo:**

- **Login** → Home directo (onboarding ya completado en sesiones anteriores).
- **Registro** → Onboarding → Home.
- `/setup` redirige a `/` o `/onboarding` (setup fusionado en onboarding).
- `/chat` redirige a `/` (chat fusionado en Home).
- `/tasks` redirige a `/memory`.

---

## Pantallas y navegación

### Stack raíz (`src/app/`)

| Ruta | Archivo | Descripción |
|------|---------|-------------|
| `/splash` | `splash.tsx` | Bootstrap y redirección |
| `/onboarding` | `onboarding.tsx` | Slides + permisos |
| `/login` | `login.tsx` | Inicio de sesión |
| `/register` | `register.tsx` | Registro |
| `/setup` | `setup.tsx` | Redirect legacy → `/` o `/onboarding` |
| `/(main)/*` | `(main)/` | App autenticada |

### Stack principal (`src/app/(main)/`)

| Pantalla | Ruta | Archivo | Propósito |
|----------|------|---------|-----------|
| **Home** | `/` | `index.tsx` | Insights + chat + voz/texto |
| **Memoria** | `/memory` | `memory.tsx` | Historial de registros |
| **Agenda** | `/agenda` | `agenda.tsx` | Día / Semana / Mes |
| **Finanzas** | `/finances` | `finances.tsx` | Resumen mensual + movimientos |
| **Perfil** | `/profile` | `profile.tsx` | Cuenta y preferencias |

### Redirects (compatibilidad)

| Ruta | Destino |
|------|---------|
| `/chat` | `/` |
| `/tasks` | `/memory` |
| `/setup` | `/` o `/onboarding` |

### Rutas ocultas

| Ruta | Archivo | Propósito |
|------|---------|-----------|
| `/capture` | `capture.tsx` | Deep link / quick action → micrófono |

### FAB global

Botón flotante 🎤 visible fuera de Home → abre `VoiceCaptureSheet`. En Home el micrófono está en la barra inferior.

---

## Modo demo (mock)

Activo con `EXPO_PUBLIC_USE_MOCK_DATA=true` (default en `.env.example`).

| Componente | Comportamiento |
|------------|----------------|
| `mock-records-store.ts` | Persistencia en AsyncStorage |
| `mock-record-seed.ts` | Semilla desde `constants/mock-data.ts` |
| `mock-voice-parser.ts` | Texto → records locales |
| `mock-assistant-engine.ts` | Chat local sin API externa |
| `records-service.ts` | API o mock con fallback automático |

Home muestra *"Modo demo local — sin Supabase"* cuando `isMockMode` es true.

**Backend:** `DEV_MOCK_AUTH=true` permite login/registro sin Supabase.

---

## Captura por voz e IA

### Flujo (modo producción)

```
Audio grabado
    → Backend pipeline (process-voice-recording) o Whisper directo
    → Texto transcrito
    → Endpoint IA (POST) o mock-assistant-engine
    → Respuesta en chat + records nuevos
```

### Flujo (modo mock)

```
Audio grabado
    → Whisper (si configurado) o transcripción demo
    → mock-voice-parser
    → Records en AsyncStorage + respuesta en chat
```

### Archivos clave

| Archivo | Función |
|---------|---------|
| `voice-capture-sheet.tsx` | Modal grabación / revisión / envío |
| `whisper-service.ts` | Transcripción OpenAI (opcional) |
| `audio/process-voice-recording.ts` | Pipeline backend con jobs |
| `assistant-api.ts` | Llamada al endpoint de IA |
| `mock/mock-assistant-engine.ts` | Chat local en modo demo |
| `assistant-context.tsx` | Estado global: records, chat, voz |

### Chat texto

- Con `EXPO_PUBLIC_ASSISTANT_API_URL` configurado → API externa.
- Sin API o en mock → `mock-assistant-engine`.

---

## Recordatorios inteligentes

Implementado con `expo-notifications` (notificaciones locales).

### Reglas por prioridad

| Prioridad | Avisos programados |
|-----------|-------------------|
| Alta | 7d, 3d, mañana, hoy + 1h antes |
| Media | 3d, mañana, hoy + 1h antes |
| Baja | mañana, hoy |

Solo aplica a `task`, `meeting` y `reminder` pendientes con fecha.

### Archivos

| Archivo | Función |
|---------|---------|
| `reminders/reminder-rules.ts` | Cálculo de offsets |
| `reminders/reminder-notifications.ts` | Permisos, canal Android, schedule |
| `hooks/use-reminder-sync.ts` | Sincroniza al cambiar records |
| `components/reminder-sync.tsx` | Montado en `(main)/_layout.tsx` |

Toggle en **Perfil → Notificaciones → Recordatorios inteligentes**.

En web las notificaciones se omiten (`Platform.OS === 'web'`).

---

## Agenda, Memoria y Finanzas

### Agenda

Vistas: **Día**, **Semana**, **Mes**. Sin rango personalizado ni exportación PDF (eliminados en refactor).

### Memoria

Lista filtrable de todos los `records`: notas, tareas, reuniones, gastos, etc.

- Búsqueda por título, descripción, categoría, cliente o proyecto
- Filtros rápidos por tipo (tareas, reuniones, gastos, notas…)

### Finanzas

Resumen mensual (ingresos / gastos) + lista de movimientos `expense` / `income`.

Insight en Home: comparación de gastos semana actual vs anterior.

### Insights en Home

Generados por `insight-engine.ts`:

- Pendientes para hoy (`due_today`)
- Tareas urgentes
- Próxima reunión
- Alerta de gastos semanales
- Recordatorios
- Mensaje positivo (racha de completadas)

---

## Configuración (.env)

Copia `.env.example` a `.env`:

```env
# Backend API
EXPO_PUBLIC_API_BASE_URL=http://localhost:3000/api

# Modo demo local (true mientras no haya Supabase)
EXPO_PUBLIC_USE_MOCK_DATA=true

# Whisper (opcional, si no usas backend para STT)
EXPO_PUBLIC_OPENAI_API_KEY=sk-your-key-here

# Assistant AI endpoint (opcional en mock)
EXPO_PUBLIC_ASSISTANT_API_URL=https://your-api.com/assistant/chat
```

Reinicia Expo tras cambiar variables.

---

## Estructura de archivos

```
src/
├── app/
│   ├── _layout.tsx
│   ├── splash.tsx, onboarding.tsx, login.tsx, register.tsx, setup.tsx
│   └── (main)/
│       ├── _layout.tsx      # Stack + ReminderSync + FAB
│       ├── index.tsx        # Home (insights + chat)
│       ├── memory.tsx
│       ├── agenda.tsx
│       ├── finances.tsx
│       ├── profile.tsx
│       ├── chat.tsx         # redirect → /
│       ├── tasks.tsx        # redirect → /memory
│       └── capture.tsx
├── components/
│   ├── insight-card.tsx
│   ├── secondary-nav-links.tsx
│   ├── screen-header.tsx
│   ├── reminder-sync.tsx
│   ├── voice-capture-sheet.tsx
│   ├── floating-mic-button.tsx
│   └── auth/
├── context/
│   ├── assistant-context.tsx
│   ├── auth-context.tsx
│   ├── app-flow-context.tsx
│   ├── user-preferences-context.tsx
│   └── voice-capture-context.tsx
├── services/
│   ├── records/             # API + records-service (mock fallback)
│   ├── mock/                # Demo local
│   ├── reminders/           # Notificaciones locales
│   ├── insight-engine.ts
│   ├── finance-analytics.ts
│   ├── whisper-service.ts
│   └── assistant-api.ts
├── types/
│   ├── record.ts, insight.ts, assistant.ts, api.ts
├── hooks/
│   ├── use-reminder-sync.ts
│   └── use-quick-actions-setup.ts
├── constants/
│   ├── mock-data.ts         # Semilla demo
│   └── labels.ts
└── config/
    └── api.ts
```

---

## Fases completadas

| Fase | Descripción |
|------|-------------|
| 0 | Tipos `Record` e `Insight` |
| 1 | Stack sin tabs + placeholders |
| 2 | Home rediseñado: insights + chat fusionado |
| 3 | Onboarding fusionado (setup eliminado) |
| 4 | Backend records + `assistant-context` refactor |
| 6–7 | Agenda simplificada, Finanzas, limpieza reportes PDF |
| Mock | Capa demo local con AsyncStorage |
| 10 | Recordatorios inteligentes (`expo-notifications`) |
| 11 | Documentación actualizada |
| 5 | Memoria con búsqueda y filtros por tipo |
| 8 | Perfil secundario (integraciones colapsables) |
| 9 | Limpieza de archivos huérfanos |

### Eliminado en refactor

- 5 tabs (`app-tabs.tsx`)
- `SetupScreen.tsx` (fusionado en onboarding)
- Reportes PDF (`report-panel`, `report-pdf`, `report-analytics`)
- Calendario de rango (`date-range-calendar.tsx`)
- Tab Conversar y Tareas como pantallas independientes

---

## Roadmap

- Conectar Supabase real (`EXPO_PUBLIC_USE_MOCK_DATA=false`)
- Push notifications remotas (actualmente solo locales)
- Widget, lock screen, integraciones externas
- Trabajo en equipo

---

## Convenciones

- **Código y nombres:** inglés
- **UI y documentación:** español
- **Marca:** púrpura `#7C3AED`
- **Expo docs:** https://docs.expo.dev/

---

*Última actualización: v2.0.0 — Julio 2026*
