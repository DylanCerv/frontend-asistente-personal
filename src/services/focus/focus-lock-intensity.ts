export const FOCUS_LOCK_INTENSITY_OPTIONS = ['standard', 'strict'] as const;

export type FocusLockIntensity = (typeof FOCUS_LOCK_INTENSITY_OPTIONS)[number];

export const DEFAULT_FOCUS_LOCK_INTENSITY: FocusLockIntensity = 'standard';

export function isFocusLockIntensity(value: unknown): value is FocusLockIntensity {
  return value === 'standard' || value === 'strict';
}

export function parseFocusLockIntensity(raw: string | null): FocusLockIntensity {
  if (isFocusLockIntensity(raw)) return raw;
  return DEFAULT_FOCUS_LOCK_INTENSITY;
}

export function getFocusLockIntensityLabel(intensity: FocusLockIntensity): string {
  return intensity === 'strict' ? 'Estricto' : 'Estándar';
}

export function getFocusLockIntensityDescription(intensity: FocusLockIntensity): string {
  if (intensity === 'strict') {
    return 'No Molestar, notificación persistente, overlay sobre otras apps y servicio en primer plano.';
  }
  return 'No Molestar y notificación persistente con Completar, Posponer y Aumentar.';
}

export function getFocusLockIntensityShortLabel(intensity: FocusLockIntensity): string {
  return getFocusLockIntensityLabel(intensity);
}
