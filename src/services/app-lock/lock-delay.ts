export const APP_LOCK_DELAY_OPTIONS = [0, 15, 30, 60, 300] as const;

export type AppLockDelaySeconds = (typeof APP_LOCK_DELAY_OPTIONS)[number];

export const DEFAULT_APP_LOCK_DELAY_SECONDS: AppLockDelaySeconds = 0;

export function isAppLockDelaySeconds(value: number): value is AppLockDelaySeconds {
  return (APP_LOCK_DELAY_OPTIONS as readonly number[]).includes(value);
}

export function parseAppLockDelaySeconds(raw: string | null): AppLockDelaySeconds {
  if (!raw) return DEFAULT_APP_LOCK_DELAY_SECONDS;
  const parsed = Number(raw);
  return isAppLockDelaySeconds(parsed) ? parsed : DEFAULT_APP_LOCK_DELAY_SECONDS;
}

export function getAppLockDelayLabel(seconds: AppLockDelaySeconds): string {
  switch (seconds) {
    case 0:
      return 'Al salir de la app';
    case 15:
      return '15 segundos después';
    case 30:
      return '30 segundos después';
    case 60:
      return '1 minuto después';
    case 300:
      return '5 minutos después';
    default:
      return 'Al salir de la app';
  }
}

export function getAppLockDelayShortLabel(seconds: AppLockDelaySeconds): string {
  switch (seconds) {
    case 0:
      return 'Al salir';
    case 15:
      return '15 s';
    case 30:
      return '30 s';
    case 60:
      return '1 min';
    case 300:
      return '5 min';
    default:
      return 'Al salir';
  }
}

export function getAppLockDelayDescription(seconds: AppLockDelaySeconds): string {
  if (seconds === 0) {
    return 'Kivo se bloquea en cuanto cambias a otra app.';
  }
  if (seconds === 60) {
    return 'Si vuelves antes de 1 minuto, no pedirá desbloqueo.';
  }
  if (seconds === 300) {
    return 'Si vuelves antes de 5 minutos, no pedirá desbloqueo.';
  }
  return `Si vuelves antes de ${seconds} segundos, no pedirá desbloqueo.`;
}
