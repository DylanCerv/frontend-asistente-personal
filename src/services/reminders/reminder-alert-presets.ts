export type ReminderAlertSoundId = 'system' | 'kivo_clear' | 'custom';

/** Distinct rhythm modes (migrated from legacy soft/strong/normal/alarm). */
export type ReminderAlertVibrationId = 'discrete' | 'standard' | 'alarm';

export const DEFAULT_REMINDER_ALERT_SOUND: ReminderAlertSoundId = 'system';
export const DEFAULT_REMINDER_ALERT_VIBRATION: ReminderAlertVibrationId = 'standard';

export type AlertSoundPreset = {
  id: ReminderAlertSoundId;
  label: string;
  description: string;
  /** Filename without extension for native notification channels; null = system default. */
  nativeSoundName: string | null;
  /** Bundled asset for in-app preview / critical-alarm screen; null = OS/custom URI. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  asset: any | null;
};

export type AlertVibrationPreset = {
  id: ReminderAlertVibrationId;
  label: string;
  description: string;
  pattern: number[];
  alarmPattern: number[];
};

/** Fixed list items (custom is an action row in the UI). */
export const ALERT_SOUND_PRESETS: AlertSoundPreset[] = [
  {
    id: 'system',
    label: 'Sistema',
    description: 'Tono de notificación / alarma del sistema operativo',
    nativeSoundName: null,
    asset: null,
  },
  {
    id: 'kivo_clear',
    label: 'Kivo',
    description: 'Tono limpio y reconocible de Kivo',
    nativeSoundName: 'kivo_clear',
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    asset: require('../../../assets/sounds/kivo_clear.wav'),
  },
];

export const ALERT_VIBRATION_PRESETS: AlertVibrationPreset[] = [
  {
    id: 'discrete',
    label: 'Discreta',
    description: 'Un solo toque corto',
    pattern: [0, 80],
    alarmPattern: [0, 100],
  },
  {
    id: 'standard',
    label: 'Estándar',
    description: 'Doble pulso claro',
    pattern: [0, 180, 120, 180],
    alarmPattern: [0, 220, 140, 220, 140, 220],
  },
  {
    id: 'alarm',
    label: 'Alarma',
    description: 'Ritmo largo repetido tipo alarma',
    pattern: [0, 500, 200, 500, 200, 500],
    alarmPattern: [0, 600, 150, 600, 150, 600, 150, 600, 150, 600],
  },
];

export function parseReminderAlertSound(value: unknown): ReminderAlertSoundId {
  if (value === 'system' || value === 'kivo_clear' || value === 'custom') {
    return value;
  }
  // Legacy: separate ringtone option → unified under Sistema.
  if (value === 'ringtone') return 'system';
  if (value === 'kivo_soft' || value === 'kivo_urgent') return 'kivo_clear';
  return DEFAULT_REMINDER_ALERT_SOUND;
}

export function parseReminderAlertVibration(value: unknown): ReminderAlertVibrationId {
  if (value === 'discrete' || value === 'standard' || value === 'alarm') {
    return value;
  }
  if (value === 'soft') return 'discrete';
  if (value === 'normal' || value === 'strong') return 'standard';
  return DEFAULT_REMINDER_ALERT_VIBRATION;
}

export function getAlertSoundPreset(id: ReminderAlertSoundId): AlertSoundPreset {
  if (id === 'custom') {
    return {
      id: 'custom',
      label: 'Archivo',
      description: 'Audio de tu almacenamiento',
      nativeSoundName: null,
      asset: null,
    };
  }
  return ALERT_SOUND_PRESETS.find((item) => item.id === id) ?? ALERT_SOUND_PRESETS[0];
}

export function getAlertVibrationPreset(id: ReminderAlertVibrationId): AlertVibrationPreset {
  return ALERT_VIBRATION_PRESETS.find((item) => item.id === id) ?? ALERT_VIBRATION_PRESETS[1];
}

/**
 * Native channel/content sound name (`default` or bundled file without extension).
 * System/custom URIs are resolved separately via alert sound URI helpers.
 */
export function resolveNativeSoundName(
  soundId: ReminderAlertSoundId,
  playSound: boolean,
): string | undefined {
  if (!playSound) return undefined;
  if (soundId === 'custom' || soundId === 'system') return undefined;
  const preset = getAlertSoundPreset(soundId);
  return preset.nativeSoundName ?? 'default';
}

export function resolveVibrationPattern(
  vibrationId: ReminderAlertVibrationId,
  isAlarm: boolean,
): number[] {
  const preset = getAlertVibrationPreset(vibrationId);
  return isAlarm ? preset.alarmPattern : preset.pattern;
}

/**
 * Notifee rejects 0 and requires an even count of strictly positive ms values.
 * RN Vibration.vibrate still accepts patterns that start with 0.
 */
export function toNotifeeVibrationPattern(pattern: number[]): number[] {
  const positive = pattern.filter((ms) => typeof ms === 'number' && Number.isFinite(ms) && ms > 0);
  if (positive.length === 0) return [200, 100];
  if (positive.length % 2 !== 0) {
    positive.push(100);
  }
  return positive;
}

/** Bundled asset for Kivo tone only. System/custom use URIs. */
export function resolvePlaybackAsset(soundId: ReminderAlertSoundId) {
  const preset = getAlertSoundPreset(soundId);
  return preset.asset;
}
