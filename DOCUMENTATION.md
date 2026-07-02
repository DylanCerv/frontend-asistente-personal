# Asistente — Documentación v1.0.0

> **Habla. Nosotros organizamos.**

Asistente es una aplicación móvil (Expo / React Native) que funciona como **asistente personal con IA**, no como un gestor de tareas tradicional. El usuario habla o escribe; la IA organiza tareas, eventos y recordatorios.

Este documento es la guía oficial para que cualquier miembro del equipo entienda el proyecto desde cero.

---

## Tabla de contenidos

1. [Inicio rápido](#inicio-rápido)
2. [Arquitectura del proyecto](#arquitectura-del-proyecto)
3. [Flujo de la aplicación](#flujo-de-la-aplicación)
4. [Pantallas y navegación](#pantallas-y-navegación)
5. [Funcionalidades v1](#funcionalidades-v1)
6. [Captura por voz e IA](#captura-por-voz-e-ia)
7. [Agenda y reportes](#agenda-y-reportes)
8. [Accesos rápidos](#accesos-rápidos)
9. [Configuración (.env)](#configuración-env)
10. [Estructura de archivos](#estructura-de-archivos)
11. [API del backend (pendiente)](#api-del-backend-pendiente)
12. [Changelog v1](#changelog-v1)
13. [Roadmap (no incluido en v1)](#roadmap-no-incluido-en-v1)

---

## Inicio rápido

### Requisitos

- Node.js 18+
- npm
- Expo CLI (`npx expo`)
- Para accesos rápidos nativos: build de desarrollo (`npx expo run:ios` / `run:android`)

### Instalación

```bash
npm install
cp .env.example .env
# Edita .env con tus API keys
npx expo start
```

### Credenciales mock (desarrollo)

| Campo | Valor |
|-------|-------|
| Email | `e1@gmail.com` |
| Contraseña | `ejem1234` |

También puedes usar **Google**, **Apple** o **registro por correo** (mock, sin backend real).

### Reiniciar onboarding

El onboarding y el setup se guardan en AsyncStorage. Para verlos de nuevo: desinstala la app o borra datos de la app.

---

## Arquitectura del proyecto

```
Expo 54 + React Native 0.81 + expo-router 6
NativeWind 4 (Tailwind CSS)
TypeScript
```

### Capas

| Capa | Ubicación | Responsabilidad |
|------|-----------|-----------------|
| Rutas | `src/app/` | Navegación file-based (expo-router) |
| Pantallas UI | `src/screens/` | Componentes de pantalla reutilizables |
| Componentes | `src/components/` | UI compartida (voz, calendario, reportes) |
| Contextos | `src/context/` | Estado global (auth, asistente, preferencias) |
| Servicios | `src/services/` | Whisper, API IA, reportes PDF |
| Tipos | `src/types/` | TypeScript types |
| Utilidades | `src/utils/` | Fechas, helpers |

### Providers (orden en `src/app/_layout.tsx`)

```
ThemePreferenceProvider
  └── UserPreferencesProvider
        └── AppFlowProvider (onboarding + setup)
              └── AuthProvider
                    └── Stack Navigator
```

Dentro de `(main)`:

```
AssistantProvider
  └── VoiceCaptureProvider
        └── Tabs + FAB micrófono + VoiceCaptureSheet
```

---

## Flujo de la aplicación

```
Splash ("Habla. Nosotros organizamos.")
    ↓
Onboarding (3 pantallas) — solo primera vez
    ↓
Login / Registro (Google · Apple · Correo)
    ↓
Setup inicial — solo primera vez
    ├── ¿Cómo quieres que te llame?
    ├── ¿Importar calendario?
    └── Permisos (micrófono, notificaciones, etc.)
    ↓
App principal (5 tabs)
```

---

## Pantallas y navegación

### Stack raíz (`src/app/`)

| Ruta | Archivo | Descripción |
|------|---------|-------------|
| `/splash` | `splash.tsx` | Bootstrap y redirección |
| `/onboarding` | `onboarding.tsx` | 3 slides de bienvenida |
| `/login` | `login.tsx` | Inicio de sesión |
| `/register` | `register.tsx` | Registro |
| `/setup` | `setup.tsx` | Primer uso post-login |
| `/(main)/*` | `(main)/` | App autenticada |

### Tabs principales (`src/app/(main)/`)

| Tab | Ruta | Archivo | Propósito |
|-----|------|---------|-----------|
| **Inicio** | `/` | `index.tsx` | Resumen del día, voz, reporte rápido |
| **Conversar** | `/chat` | `chat.tsx` | Chat con IA (corazón del producto) |
| **Agenda** | `/agenda` | `agenda.tsx` | Calendario, filtros, reportes PDF |
| **Tareas** | `/tasks` | `tasks.tsx` | Lista con filtros y categorías |
| **Perfil** | `/profile` | `profile.tsx` | Cuenta, voz, accesos rápidos, integraciones |

### Rutas ocultas (sin tab)

| Ruta | Archivo | Propósito |
|------|---------|-----------|
| `/capture` | `capture.tsx` | Deep link / quick action → abre micrófono |

### FAB global

Botón flotante 🎤 visible en todas las tabs → abre `VoiceCaptureSheet`.

---

## Funcionalidades v1

### Identidad

- Nombre interno: **asistente** (`package.json`, `app.json`)
- Marca visual: púrpura `#7C3AED`
- Eslogan: **"Habla. Nosotros organizamos."**
- Idioma UI: **Español**

### Autenticación (mock)

- Email/contraseña mock
- Google y Apple (simulados)
- Registro con nombre
- Sin backend persistente (sesión en memoria)

### Onboarding

1. Habla naturalmente
2. La IA organiza todo
3. Nunca olvides nada importante

### Setup inicial

- Nombre del usuario
- Importar calendario (sí/no, placeholder)
- Permisos: micrófono, notificaciones, calendario, ubicación

### Preferencias de voz (`Perfil → Voz`)

| Opción | Default | Comportamiento |
|--------|---------|----------------|
| Enviar audio automáticamente | **OFF** | Si OFF: escuchar antes de enviar. Si ON: envía al detener grabación. |

Persistido en AsyncStorage (`@asistente/auto_send_voice`).

---

## Captura por voz e IA

### Flujo

```
Audio grabado
    → Whisper API (STT, español)
    → Texto transcrito
    → Endpoint IA (POST)
    → Respuesta en chat + tareas/eventos nuevos
```

### Archivos clave

| Archivo | Función |
|---------|---------|
| `src/components/voice-capture-sheet.tsx` | Modal de grabación/revisión/envío |
| `src/services/whisper-service.ts` | Transcripción con OpenAI Whisper |
| `src/services/assistant-api.ts` | Llamada al endpoint de IA |
| `src/context/assistant-context.tsx` | Estado del chat, tareas, eventos |

### Sin mocks de conversación

La v1 **no usa respuestas simuladas** en el chat. Si falta configuración o el endpoint falla, se muestra un error claro al usuario.

---

## Agenda y reportes

### Filtros de agenda

| Modo | Descripción |
|------|-------------|
| **Día** | Solo hoy |
| **Semana** | Semana actual |
| **Mes** | Mes actual |
| **Rango** | Calendario visual + presets (7 días, 30 días, 3 meses, 1 año) |

En modo **Rango** puedes seleccionar cualquier periodo histórico (ej. hace 3 meses, hace 1 año) tocando inicio y fin en el calendario.

### Reporte de productividad (PDF)

Disponible en **Agenda** (completo) e **Inicio** (compacto).

**Presets:** Semanal · Mensual · Trimestral · Anual · Rango personalizado

**Métricas incluidas:**

- Tareas totales, completadas, pendientes
- Tasa de completado (%)
- Eficiencia (tareas completadas a tiempo vs estimado)
- Tiempo promedio de completado
- Categorías con más tareas
- Día de la semana con más carga
- Tarea más repetida
- Categoría que más demora

**Recomendaciones automáticas** (ejemplos):

- "El lunes es tu día con más tareas — distribuye la carga"
- "Las tareas de Trabajo demoran más — divídelas en pasos"
- "Configura tareas recurrentes para las que se repiten"

**Exportar:** botón "Descargar reporte PDF" → genera PDF con `expo-print` y comparte con `expo-sharing`.

### Archivos de reportes

| Archivo | Función |
|---------|---------|
| `src/utils/date-utils.ts` | Rangos, calendario, formateo |
| `src/components/date-range-calendar.tsx` | Selector visual de rango |
| `src/components/report-panel.tsx` | UI de reporte + exportar |
| `src/services/report-analytics.ts` | Cálculo de métricas |
| `src/services/report-pdf.ts` | Generación HTML → PDF |

---

## Accesos rápidos

### Activos en v1

| Acceso | Cómo usarlo |
|--------|-------------|
| **Ícono de la app (long press)** | Mantén presionado → "Hablar" o "¿Qué tengo hoy?" |
| **Deep link** | `asistente://capture` abre captura de voz |
| **FAB 🎤** | Siempre visible dentro de la app |

Implementado con `expo-quick-actions`. Requiere **build nativo** (no Expo Go completo).

### Próximamente (listados en Perfil)

- Widget pantalla de inicio
- Pantalla bloqueada
- Botón de volumen
- Doble toque atrás (Android)
- Dynamic Island / Live Activities
- Reloj inteligente
- Auriculares
- Comando de voz del sistema (Siri / Google)

---

## Configuración (.env)

Copia `.env.example` a `.env`:

```env
# Whisper (OpenAI)
EXPO_PUBLIC_OPENAI_API_KEY=sk-...

# Endpoint del asistente IA
EXPO_PUBLIC_ASSISTANT_API_URL=https://tu-api.com/assistant/chat

# Opcionales
# EXPO_PUBLIC_WHISPER_API_URL=...
# EXPO_PUBLIC_WHISPER_MODEL=whisper-1
# EXPO_PUBLIC_WHISPER_LANGUAGE=es
```

Reinicia Expo tras cambiar variables.

---

## Estructura de archivos

```
src/
├── app/                    # Rutas expo-router
│   ├── _layout.tsx         # Root layout + providers
│   ├── splash.tsx
│   ├── onboarding.tsx
│   ├── login.tsx
│   ├── register.tsx
│   ├── setup.tsx
│   └── (main)/
│       ├── _layout.tsx     # Tabs + FAB + voz
│       ├── index.tsx       # Inicio
│       ├── chat.tsx        # Conversar
│       ├── agenda.tsx      # Agenda + reportes
│       ├── tasks.tsx       # Tareas
│       ├── profile.tsx     # Perfil
│       └── capture.tsx     # Deep link voz
├── components/
│   ├── voice-capture-sheet.tsx
│   ├── voice-home-card.tsx
│   ├── floating-mic-button.tsx
│   ├── date-range-calendar.tsx
│   ├── report-panel.tsx
│   ├── chat-bubble.tsx
│   └── app-tabs.tsx
├── context/
│   ├── auth-context.tsx
│   ├── assistant-context.tsx
│   ├── app-flow-context.tsx
│   ├── user-preferences-context.tsx
│   └── voice-capture-context.tsx
├── services/
│   ├── whisper-service.ts
│   ├── assistant-api.ts
│   ├── report-analytics.ts
│   ├── report-pdf.ts
│   └── chat-utils.ts
├── screens/
│   ├── SplashScreen.tsx
│   ├── OnboardingScreen.tsx
│   ├── SetupScreen.tsx
│   └── auth/
├── types/
│   ├── assistant.ts
│   └── api.ts
├── utils/
│   └── date-utils.ts
├── constants/
│   └── mock-data.ts
└── config/
    └── api.ts
```

---

## API del backend (pendiente)

### POST `EXPO_PUBLIC_ASSISTANT_API_URL`

**Request:**

```json
{
  "message": "Recuérdame llamar a Carlos mañana",
  "userName": "Carlos",
  "userEmail": "carlos@email.com",
  "context": {
    "tasks": [...],
    "events": [...]
  }
}
```

**Response:**

```json
{
  "reply": "Listo, creé el recordatorio.",
  "newTasks": [{
    "id": "unique-id",
    "title": "Llamar a Carlos",
    "scheduledAt": "2026-07-03",
    "priority": "medium",
    "status": "pending",
    "category": "Personal",
    "tags": []
  }],
  "newEvents": [],
  "completedTaskIds": []
}
```

### Campos importantes en tareas

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `scheduledAt` | `YYYY-MM-DD` | Fecha para agenda y reportes |
| `completedAt` | ISO string | Cuándo se completó |
| `estimatedMinutes` | number | Tiempo estimado |
| `actualMinutes` | number | Tiempo real (para eficiencia) |
| `category` | string | Trabajo, Personal, Salud, etc. |

---

## Changelog v1

### Agregado

- Identidad "Asistente" con eslogan
- Onboarding 3 pantallas + setup inicial
- Auth: Google, Apple, correo (mock)
- 5 tabs: Inicio, Conversar, Agenda, Tareas, Perfil
- Chat con IA vía endpoint externo
- Whisper para speech-to-text
- Captura por voz con revisión o envío automático
- FAB micrófono global
- Quick actions (ícono app + deep link)
- Agenda con filtros: día, semana, mes, rango personalizado
- Calendario visual para seleccionar rango de fechas
- Reportes PDF: semanal, mensual, trimestral, anual, custom
- Métricas de productividad y recomendaciones
- Tema claro/oscuro
- Documentación v1 (este archivo)

### Removido / reemplazado

- Motor mock de conversaciones (`assistant-engine.ts`) → reemplazado por Whisper + API
- Transcripción simulada de voz
- 3 tabs originales → 5 tabs
- Splash genérico → splash con eslogan

### Datos

- Tareas y eventos usan datos mock locales con historial de hasta 1 año
- Sin persistencia en backend (se pierde al cerrar sesión)

---

## Roadmap (no incluido en v1)

- Backend real (auth, DB, sync)
- Widget, lock screen, auriculares, reloj
- Integraciones: calendario, WhatsApp, Slack, Notion
- Notificaciones push inteligentes
- Trabajo en equipo y asignación de tareas
- Modo automóvil

---

## Contacto y convenciones

- **Código y nombres:** inglés
- **UI y documentación:** español
- **Commits:** describir el "por qué", no solo el "qué"
- **Expo docs:** siempre verificar versión en https://docs.expo.dev/versions/v56.0.0/

---

*Última actualización: v1.0.0 — Julio 2026*
