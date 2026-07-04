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

export type { AppLanguage, AppPlan };

/** Local cache — provides instant state on startup while backend loads */
const CACHE_KEY = '@asistente/settings_cache_v2';
/** Biometric lock is device-specific, never synced to backend */
const BIOMETRIC_KEY = '@asistente/biometric_lock';

const DEFAULTS: Omit<UserSettings, 'user_id' | 'created_at' | 'updated_at'> = {
  language: 'es',
  push_notifications: true,
  reminder_notifications: true,
  auto_send_audio: false,
  biometric_lock: false,
  preferred_name: '',
  plan: 'free',
};

type UserPreferencesContextValue = {
  isLoading: boolean;
  language: AppLanguage;
  pushNotifications: boolean;
  reminderNotifications: boolean;
  autoSendVoice: boolean;
  biometricLock: boolean;
  preferredName: string;
  plan: AppPlan;
  setLanguage: (value: AppLanguage) => Promise<void>;
  setPushNotifications: (value: boolean) => Promise<void>;
  setReminderNotifications: (value: boolean) => Promise<void>;
  setAutoSendVoice: (value: boolean) => Promise<void>;
  setBiometricLock: (value: boolean) => Promise<void>;
  setPreferredName: (value: string) => Promise<void>;
  setPlan: (value: AppPlan) => Promise<void>;
  /** Call after login to hydrate settings from the backend */
  loadFromBackend: () => Promise<void>;
};

const UserPreferencesContext = createContext<UserPreferencesContextValue | null>(null);

export function UserPreferencesProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [language, setLanguageState] = useState<AppLanguage>(DEFAULTS.language);
  const [pushNotifications, setPushNotificationsState] = useState(DEFAULTS.push_notifications);
  const [reminderNotifications, setReminderNotificationsState] = useState(DEFAULTS.reminder_notifications);
  const [autoSendVoice, setAutoSendVoiceState] = useState(DEFAULTS.auto_send_audio);
  const [biometricLock, setBiometricLockState] = useState<boolean>(DEFAULTS.biometric_lock ?? false);
  const [preferredName, setPreferredNameState] = useState(DEFAULTS.preferred_name);
  const [plan, setPlanState] = useState<AppPlan>(DEFAULTS.plan);

  function applySettings(s: Partial<typeof DEFAULTS>) {
    if (s.language === 'es' || s.language === 'en') setLanguageState(s.language);
    if (typeof s.push_notifications === 'boolean') setPushNotificationsState(s.push_notifications);
    if (typeof s.reminder_notifications === 'boolean') setReminderNotificationsState(s.reminder_notifications);
    if (typeof s.auto_send_audio === 'boolean') setAutoSendVoiceState(s.auto_send_audio);
    if (typeof s.biometric_lock === 'boolean') setBiometricLockState(s.biometric_lock);
    if (typeof s.preferred_name === 'string') setPreferredNameState(s.preferred_name);
    if (s.plan === 'free' || s.plan === 'pro') setPlanState(s.plan);
  }

  /** Load from local cache for instant startup (biometric is always local) */
  useEffect(() => {
    let isMounted = true;

    async function loadCached() {
      try {
        const [raw, biometric] = await Promise.all([
          AsyncStorage.getItem(CACHE_KEY),
          AsyncStorage.getItem(BIOMETRIC_KEY),
        ]);
        if (!isMounted) return;
        if (raw) applySettings(JSON.parse(raw) as Partial<typeof DEFAULTS>);
        if (biometric !== null) setBiometricLockState(biometric === 'true' ? true : false);
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

  const setLanguage = useCallback(async (value: AppLanguage) => {
    setLanguageState(value);
    await persist({ language: value });
  }, []);

  const setPushNotifications = useCallback(async (value: boolean) => {
    setPushNotificationsState(value);
    await persist({ push_notifications: value });
  }, []);

  const setReminderNotifications = useCallback(async (value: boolean) => {
    setReminderNotificationsState(value);
    await persist({ reminder_notifications: value });
  }, []);

  const setAutoSendVoice = useCallback(async (value: boolean) => {
    setAutoSendVoiceState(value);
    await persist({ auto_send_audio: value });
  }, []);

  /** Biometric lock is device-only — stored in AsyncStorage, never sent to backend */
  const setBiometricLock = useCallback(async (value: boolean) => {
    setBiometricLockState(value);
    await AsyncStorage.setItem(BIOMETRIC_KEY, value ? 'true' : 'false');
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

  const contextValue = useMemo(
    () => ({
      isLoading,
      language,
      pushNotifications,
      reminderNotifications,
      autoSendVoice,
      biometricLock,
      preferredName,
      plan,
      setLanguage,
      setPushNotifications,
      setReminderNotifications,
      setAutoSendVoice,
      setBiometricLock,
      setPreferredName,
      setPlan,
      loadFromBackend,
    }),
    [
      isLoading,
      language,
      pushNotifications,
      reminderNotifications,
      autoSendVoice,
      biometricLock,
      preferredName,
      plan,
      setLanguage,
      setPushNotifications,
      setReminderNotifications,
      setAutoSendVoice,
      setBiometricLock,
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
