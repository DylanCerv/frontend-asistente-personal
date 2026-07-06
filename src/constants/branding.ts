export const APP_NAME = 'Kivo';
export const APP_TAGLINE = 'Habla. Nosotros organizamos.';
export const APP_DESCRIPTION =
  'Tu asistente personal con IA. No organizas tu vida, solo hablas.';
export const APP_SCHEME = 'kivo';

export const ASSISTANT_WELCOME_MESSAGE =
  'Hola. Usa el micrófono para crear tareas, recordatorios o ver qué tienes hoy.';

export function getAssistantWelcomeMessage(preferredName?: string): string {
  const name = preferredName?.trim();
  if (!name) return ASSISTANT_WELCOME_MESSAGE;
  return `Hola, ${name}. Usa el micrófono para crear tareas, recordatorios o ver qué tienes hoy.`;
}
