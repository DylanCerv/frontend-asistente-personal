import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import {
  getMySettings,
  updateMySettings,
  type AppLanguage,
  type AppPlan,
  type UserSettings,
} from '@/services/settings/settings-api';
import { clearPin } from '@/services/app-lock/pin-store';
import {
  DEFAULT_APP_LOCK_DELAY_SECONDS,
  parseAppLockDelaySeconds,
  type AppLockDelaySeconds,
} from '@/services/app-lock/lock-delay';

import {
  DEFAULT_REMINDER_ALERT_STYLE,
  parseReminderAlertStyle,
  type ReminderAlertStyle,
} from '@/services/reminders/reminder-alert-style';
import {
  DEFAULT_REMINDER_ALERT_SOUND,
  DEFAULT_REMINDER_ALERT_VIBRATION,
  parseReminderAlertSound,
  parseReminderAlertVibration,
  type ReminderAlertSoundId,
  type ReminderAlertVibrationId,
} from '@/services/reminders/reminder-alert-presets';
import {
  DEFAULT_FOCUS_LOCK_INTENSITY,
  parseFocusLockIntensity,
  type FocusLockIntensity,
} from '@/services/focus/focus-lock-intensity';

export type { ReminderAlertStyle };
export type { ReminderAlertSoundId, ReminderAlertVibrationId };
export type { AppLanguage, AppPlan };
export type { AppLockDelaySeconds };
export type { FocusLockIntensity };

/** Local cache — provides instant state on startup while backend loads */
const CACHE_KEY = '@asistente/settings_cache_v3';
/** App lock is device-specific, never synced to backend */
export type AppLockMethod = 'none' | 'biometric' | 'pin';

const APP_LOCK_METHOD_KEY = '@asistente/app_lock_method';
const APP_LOCK_DELAY_KEY = '@asistente/app_lock_delay_seconds';
const LEGACY_BIOMETRIC_KEY = '@asistente/biometric_lock';
const HOME_WIDGET_ENABLED_KEY = '@asistente/home_widget_enabled';
export const HOME_WIDGET_SETUP_PENDING_KEY = '@asistente/home_widget_setup_pending';
const DAILY_SUMMARY_ENABLED_KEY = '@asistente/daily_summary_enabled';
const DEVICE_CALENDAR_SYNC_KEY = '@asistente/device_calendar_sync_enabled';
const FOCUS_LOCK_INTENSITY_KEY = '@asistente/focus_lock_intensity';
const REMINDER_ALERT_SOUND_LOCAL_KEY = '@asistente/reminder_alert_sound_local';
const REMINDER_ALERT_VIBRATION_LOCAL_KEY = '@asistente/reminder_alert_vibration_local';

const DEFAULTS: Omit<UserSettings, 'user_id' | 'created_at' | 'updated_at'> = {
  language: 'es',
  push_notifications: true,
  reminder_notifications: true,
  reminder_alert_style: DEFAULT_REMINDER_ALERT_STYLE,
  reminder_alert_sound: DEFAULT_REMINDER_ALERT_SOUND,
  reminder_alert_vibration: DEFAULT_REMINDER_ALERT_VIBRATION,
  auto_send_audio: false,
  biometric_lock: false,
  preferred_name: '',
  plan: 'free',
};

type UserPreferencesContextValue = {
  isLoading: boolean;
  /** App is Spanish-only; kept for API compatibility. */
  language: AppLanguage;
  pushNotifications: boolean;
  reminderNotifications: boolean;
  reminderAlertStyle: ReminderAlertStyle;
  reminderAlertSound: ReminderAlertSoundId;
  reminderAlertVibration: ReminderAlertVibrationId;
  dailySummaryEnabled: boolean;
  deviceCalendarSyncEnabled: boolean;
  autoSendVoice: boolean;
  /** @deprecated Use appLockMethod !== 'none' */
  biometricLock: boolean;
  appLockMethod: AppLockMethod;
  appLockDelaySeconds: AppLockDelaySeconds;
  homeWidgetEnabled: boolean;
  focusLockIntensity: FocusLockIntensity;
  preferredName: string;
  plan: AppPlan;
  setPushNotifications: (value: boolean) => Promise<void>;
  setReminderNotifications: (value: boolean) => Promise<void>;
  setReminderAlertStyle: (value: ReminderAlertStyle) => Promise<void>;
  setReminderAlertSound: (value: ReminderAlertSoundId) => Promise<void>;
  setReminderAlertVibration: (value: ReminderAlertVibrationId) => Promise<void>;
  setDailySummaryEnabled: (value: boolean) => Promise<void>;
  setDeviceCalendarSyncEnabled: (value: boolean) => Promise<void>;
  setAutoSendVoice: (value: boolean) => Promise<void>;
  setBiometricLock: (value: boolean) => Promise<void>;
  enableAppLock: (method: Exclude<AppLockMethod, 'none'>) => Promise<void>;
  disableAppLock: () => Promise<void>;
  setAppLockDelaySeconds: (value: AppLockDelaySeconds) => Promise<void>;
  setHomeWidgetEnabled: (value: boolean) => Promise<void>;
  setFocusLockIntensity: (value: FocusLockIntensity) => Promise<void>;
  setPreferredName: (value: string) => Promise<void>;
  setPlan: (value: AppPlan) => Promise<void>;
  /** Call after login to hydrate settings from the backend */
  loadFromBackend: () => Promise<void>;
};

const UserPreferencesContext = createContext<UserPreferencesContextValue | null>(null);

export function UserPreferencesProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [pushNotifications, setPushNotificationsState] = useState(DEFAULTS.push_notifications);
  const [reminderNotifications, setReminderNotificationsState] = useState(DEFAULTS.reminder_notifications);
  const [reminderAlertStyle, setReminderAlertStyleState] = useState<ReminderAlertStyle>(
    DEFAULTS.reminder_alert_style,
  );
  const [reminderAlertSound, setReminderAlertSoundState] = useState<ReminderAlertSoundId>(
    DEFAULT_REMINDER_ALERT_SOUND,
  );
  const [reminderAlertVibration, setReminderAlertVibrationState] =
    useState<ReminderAlertVibrationId>(DEFAULT_REMINDER_ALERT_VIBRATION);
  const [dailySummaryEnabled, setDailySummaryEnabledState] = useState(true);
  const [deviceCalendarSyncEnabled, setDeviceCalendarSyncEnabledState] = useState(false);
  const [autoSendVoice, setAutoSendVoiceState] = useState(DEFAULTS.auto_send_audio);
  const [appLockMethod, setAppLockMethodState] = useState<AppLockMethod>('none');
  const [appLockDelaySeconds, setAppLockDelaySecondsState] = useState<AppLockDelaySeconds>(
    DEFAULT_APP_LOCK_DELAY_SECONDS,
  );
  const [homeWidgetEnabled, setHomeWidgetEnabledState] = useState(false);
  const [focusLockIntensity, setFocusLockIntensityState] = useState<FocusLockIntensity>(
    DEFAULT_FOCUS_LOCK_INTENSITY,
  );
  const [preferredName, setPreferredNameState] = useState(DEFAULTS.preferred_name);
  const [plan, setPlanState] = useState<AppPlan>(DEFAULTS.plan);

  function applySettings(s: Partial<typeof DEFAULTS>) {
    if (typeof s.push_notifications === 'boolean') setPushNotificationsState(s.push_notifications);
    if (typeof s.reminder_notifications === 'boolean') setReminderNotificationsState(s.reminder_notifications);
    if (s.reminder_alert_style) setReminderAlertStyleState(parseReminderAlertStyle(s.reminder_alert_style));
    if (s.reminder_alert_sound) setReminderAlertSoundState(parseReminderAlertSound(s.reminder_alert_sound));
    if (s.reminder_alert_vibration) {
      setReminderAlertVibrationState(parseReminderAlertVibration(s.reminder_alert_vibration));
    }
    if (typeof s.auto_send_audio === 'boolean') setAutoSendVoiceState(s.auto_send_audio);
    if (typeof s.preferred_name === 'string') setPreferredNameState(s.preferred_name);
    if (s.plan === 'free' || s.plan === 'pro') setPlanState(s.plan);
  }

  async function persistAppLockMethod(method: AppLockMethod) {
    setAppLockMethodState(method);
    await AsyncStorage.setItem(APP_LOCK_METHOD_KEY, method);
    await AsyncStorage.setItem(LEGACY_BIOMETRIC_KEY, method !== 'none' ? 'true' : 'false');
  }

  /** Load from local cache for instant startup (app lock is always local) */
  useEffect(() => {
    let isMounted = true;

    async function loadCached() {
      try {
        const [
          raw,
          method,
          legacyBiometric,
          homeWidget,
          lockDelay,
          dailySummary,
          deviceCalendar,
          focusIntensity,
          localSound,
          localVibration,
        ] = await Promise.all([
          AsyncStorage.getItem(CACHE_KEY),
          AsyncStorage.getItem(APP_LOCK_METHOD_KEY),
          AsyncStorage.getItem(LEGACY_BIOMETRIC_KEY),
          AsyncStorage.getItem(HOME_WIDGET_ENABLED_KEY),
          AsyncStorage.getItem(APP_LOCK_DELAY_KEY),
          AsyncStorage.getItem(DAILY_SUMMARY_ENABLED_KEY),
          AsyncStorage.getItem(DEVICE_CALENDAR_SYNC_KEY),
          AsyncStorage.getItem(FOCUS_LOCK_INTENSITY_KEY),
          AsyncStorage.getItem(REMINDER_ALERT_SOUND_LOCAL_KEY),
          AsyncStorage.getItem(REMINDER_ALERT_VIBRATION_LOCAL_KEY),
        ]);
        if (!isMounted) return;
        if (raw) applySettings(JSON.parse(raw) as Partial<typeof DEFAULTS>);

        if (method === 'biometric' || method === 'pin' || method === 'none') {
          setAppLockMethodState(method);
        } else if (legacyBiometric === 'true') {
          setAppLockMethodState('biometric');
        }

        if (homeWidget === 'true') {
          setHomeWidgetEnabledState(true);
        }

        if (dailySummary === 'false') {
          setDailySummaryEnabledState(false);
        }

        if (deviceCalendar === 'true') {
          setDeviceCalendarSyncEnabledState(true);
        }

        setAppLockDelaySecondsState(parseAppLockDelaySeconds(lockDelay));
        setFocusLockIntensityState(parseFocusLockIntensity(focusIntensity));
        if (localSound) {
          setReminderAlertSoundState(parseReminderAlertSound(localSound));
        }
        if (localVibration) {
          setReminderAlertVibrationState(parseReminderAlertVibration(localVibration));
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadCached();
    return () => { isMounted = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Hydrate from backend — called by PreferencesSyncBridge after auth */
  const loadFromBackend = useCallback(async () => {
    try {
      const settings = await getMySettings();
      applySettings(settings);
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(settings));
      // Prefer device-local custom/system selection over backend enum.
      const localSound = await AsyncStorage.getItem(REMINDER_ALERT_SOUND_LOCAL_KEY);
      if (localSound === 'custom' || localSound === 'system' || localSound === 'ringtone' || localSound === 'kivo_clear') {
        setReminderAlertSoundState(parseReminderAlertSound(localSound));
      }
      const localVibration = await AsyncStorage.getItem(REMINDER_ALERT_VIBRATION_LOCAL_KEY);
      if (localVibration) {
        setReminderAlertVibrationState(parseReminderAlertVibration(localVibration));
      }
    } catch {
      // keep cached values if network is unavailable
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Persist a partial update to backend + update cache */
  async function persist(patch: Parameters<typeof updateMySettings>[0]) {
    try {
      const updated = await updateMySettings(patch);
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(updated));
    } catch {
      // save locally; will sync on next loadFromBackend
    }
  }

  const setPushNotifications = useCallback(async (value: boolean) => {
    setPushNotificationsState(value);
    await persist({ push_notifications: value });
  }, []);

  const setReminderNotifications = useCallback(async (value: boolean) => {
    setReminderNotificationsState(value);
    await persist({ reminder_notifications: value });
  }, []);

  const setReminderAlertStyle = useCallback(async (value: ReminderAlertStyle) => {
    setReminderAlertStyleState(value);
    await persist({ reminder_alert_style: value });
  }, []);

  const setReminderAlertSound = useCallback(async (value: ReminderAlertSoundId) => {
    setReminderAlertSoundState(value);
    await AsyncStorage.setItem(REMINDER_ALERT_SOUND_LOCAL_KEY, value);
    // Backend only needs bundled ids; custom stays device-local.
    if (value === 'system' || value === 'kivo_clear') {
      await persist({ reminder_alert_sound: value });
    }
  }, []);

  const setReminderAlertVibration = useCallback(async (value: ReminderAlertVibrationId) => {
    setReminderAlertVibrationState(value);
    await AsyncStorage.setItem(REMINDER_ALERT_VIBRATION_LOCAL_KEY, value);
    await persist({ reminder_alert_vibration: value });
  }, []);

  const setDailySummaryEnabled = useCallback(async (value: boolean) => {
    setDailySummaryEnabledState(value);
    await AsyncStorage.setItem(DAILY_SUMMARY_ENABLED_KEY, value ? 'true' : 'false');
  }, []);

  const setDeviceCalendarSyncEnabled = useCallback(async (value: boolean) => {
    setDeviceCalendarSyncEnabledState(value);
    await AsyncStorage.setItem(DEVICE_CALENDAR_SYNC_KEY, value ? 'true' : 'false');
  }, []);

  const setAutoSendVoice = useCallback(async (value: boolean) => {
    setAutoSendVoiceState(value);
    await persist({ auto_send_audio: value });
  }, []);

  const enableAppLock = useCallback(async (method: Exclude<AppLockMethod, 'none'>) => {
    if (method === 'biometric') {
      await clearPin();
    }
    await persistAppLockMethod(method);
  }, []);

  const disableAppLock = useCallback(async () => {
    await clearPin();
    await persistAppLockMethod('none');
  }, []);

  /** Backward-compatible toggle — prefer enableAppLock/disableAppLock in new UI */
  const setBiometricLock = useCallback(async (value: boolean) => {
    if (!value) {
      await disableAppLock();
      return;
    }
    await enableAppLock('biometric');
  }, [disableAppLock, enableAppLock]);

  const setAppLockDelaySeconds = useCallback(async (value: AppLockDelaySeconds) => {
    setAppLockDelaySecondsState(value);
    await AsyncStorage.setItem(APP_LOCK_DELAY_KEY, String(value));
  }, []);

  const setHomeWidgetEnabled = useCallback(async (value: boolean) => {
    setHomeWidgetEnabledState(value);
    await AsyncStorage.setItem(HOME_WIDGET_ENABLED_KEY, value ? 'true' : 'false');
  }, []);

  const setFocusLockIntensity = useCallback(async (value: FocusLockIntensity) => {
    setFocusLockIntensityState(value);
    await AsyncStorage.setItem(FOCUS_LOCK_INTENSITY_KEY, value);
  }, []);

  const setPreferredName = useCallback(async (value: string) => {
    const next = value.trim();
    setPreferredNameState(next);
    await persist({ preferred_name: next });
  }, []);

  const setPlan = useCallback(async (value: AppPlan) => {
    setPlanState(value);
    await persist({ plan: value });
  }, []);

  const biometricLock = appLockMethod !== 'none';

  const contextValue = useMemo(
    () => ({
      isLoading,
      language: 'es' as AppLanguage,
      pushNotifications,
      reminderNotifications,
      reminderAlertStyle,
      reminderAlertSound,
      reminderAlertVibration,
      dailySummaryEnabled,
      deviceCalendarSyncEnabled,
      autoSendVoice,
      biometricLock,
      appLockMethod,
      appLockDelaySeconds,
      homeWidgetEnabled,
      focusLockIntensity,
      preferredName,
      plan,
      setPushNotifications,
      setReminderNotifications,
      setReminderAlertStyle,
      setReminderAlertSound,
      setReminderAlertVibration,
      setDailySummaryEnabled,
      setDeviceCalendarSyncEnabled,
      setAutoSendVoice,
      setBiometricLock,
      enableAppLock,
      disableAppLock,
      setAppLockDelaySeconds,
      setHomeWidgetEnabled,
      setFocusLockIntensity,
      setPreferredName,
      setPlan,
      loadFromBackend,
    }),
    [
      isLoading,
      pushNotifications,
      reminderNotifications,
      reminderAlertStyle,
      reminderAlertSound,
      reminderAlertVibration,
      dailySummaryEnabled,
      deviceCalendarSyncEnabled,
      autoSendVoice,
      biometricLock,
      appLockMethod,
      appLockDelaySeconds,
      homeWidgetEnabled,
      focusLockIntensity,
      preferredName,
      plan,
      setPushNotifications,
      setReminderNotifications,
      setReminderAlertStyle,
      setReminderAlertSound,
      setReminderAlertVibration,
      setDailySummaryEnabled,
      setDeviceCalendarSyncEnabled,
      setAutoSendVoice,
      setBiometricLock,
      enableAppLock,
      disableAppLock,
      setAppLockDelaySeconds,
      setHomeWidgetEnabled,
      setFocusLockIntensity,
      setPreferredName,
      setPlan,
      loadFromBackend,
    ],
  );

  return (
    <UserPreferencesContext.Provider value={contextValue}>
      {children}
    </UserPreferencesContext.Provider>
  );
}

export function useUserPreferences() {
  const context = useContext(UserPreferencesContext);
  if (!context) {
    throw new Error('useUserPreferences must be used within UserPreferencesProvider');
  }
  return context;
}
