export const APP_NAME = 'Kivo';
export const APP_TAGLINE = 'Habla. Nosotros organizamos.';
export const APP_DESCRIPTION =
  'Tu asistente personal con IA. No organizas tu vida, solo hablas.';
export const APP_SCHEME = 'kivo';
export const APP_SPLASH_TAGLINE = 'Kinetic Intelligence';
export const APP_SPLASH_STATUS = 'System Ready';
export const APP_VERSION = '1.0.0';
export const APP_VERSION_LABEL = `Kivo Kinetic v${APP_VERSION}`;

const APP_NAME_TYPOS = /\b[Kk]ibo\b/g;

/** Visible copy always uses Kivo — never Kibo or other misspellings. */
export function correctAppBrandName(text: string): string {
  return text.replace(APP_NAME_TYPOS, APP_NAME);
}

export const ASSISTANT_WELCOME_MESSAGE =
  'Hola. Usa el micrófono para crear tareas, recordatorios o ver qué tienes hoy.';

export function getAssistantWelcomeMessage(preferredName?: string): string {
  const name = preferredName?.trim();
  if (!name) return ASSISTANT_WELCOME_MESSAGE;
  return `Hola, ${name}. Usa el micrófono para crear tareas, recordatorios o ver qué tienes hoy.`;
}
