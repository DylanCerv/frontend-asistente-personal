export const APP_NAME = 'Kivo';
export const APP_TAGLINE = 'Habla. Nosotros organizamos.';
export const APP_DESCRIPTION =
  'Tu asistente personal con IA. No organizas tu vida, solo hablas.';
export const APP_SCHEME = 'kivo';

export const ASSISTANT_WELCOME_MESSAGE =
  'Hola, soy Kivo, tu asistente personal. Puedes preguntarme qué tienes hoy, pedirme recordatorios o simplemente hablarme. ¿En qué te ayudo?';

export function getAssistantWelcomeMessage(preferredName?: string): string {
  const name = preferredName?.trim();
  if (!name) return ASSISTANT_WELCOME_MESSAGE;
  return `Hola ${name}, soy Kivo, tu asistente personal. Puedes preguntarme qué tienes hoy, pedirme recordatorios o simplemente hablarme. ¿En qué te ayudo?`;
}
