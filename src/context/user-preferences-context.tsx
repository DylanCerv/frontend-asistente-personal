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

const STORAGE_KEYS = {
  autoSendVoice: '@asistente/auto_send_voice',
  language: '@asistente/language',
  pushNotifications: '@asistente/push_notifications',
  emailNotifications: '@asistente/email_notifications',
  reminderNotifications: '@asistente/reminder_notifications',
  biometricLock: '@asistente/biometric_lock',
} as const;

export type AppLanguage = 'es' | 'en';

type UserPreferencesContextValue = {
  isLoading: boolean;
  autoSendVoice: boolean;
  language: AppLanguage;
  pushNotifications: boolean;
  emailNotifications: boolean;
  reminderNotifications: boolean;
  biometricLock: boolean;
  setAutoSendVoice: (value: boolean) => Promise<void>;
  setLanguage: (value: AppLanguage) => Promise<void>;
  setPushNotifications: (value: boolean) => Promise<void>;
  setEmailNotifications: (value: boolean) => Promise<void>;
  setReminderNotifications: (value: boolean) => Promise<void>;
  setBiometricLock: (value: boolean) => Promise<void>;
};

const UserPreferencesContext = createContext<UserPreferencesContextValue | null>(null);

export function UserPreferencesProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [autoSendVoice, setAutoSendVoiceState] = useState(false);
  const [language, setLanguageState] = useState<AppLanguage>('es');
  const [pushNotifications, setPushNotificationsState] = useState(true);
  const [emailNotifications, setEmailNotificationsState] = useState(true);
  const [reminderNotifications, setReminderNotificationsState] = useState(true);
  const [biometricLock, setBiometricLockState] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadPreferences() {
      try {
        const entries = await AsyncStorage.multiGet(Object.values(STORAGE_KEYS));
        const map = Object.fromEntries(entries);

        if (!isMounted) return;

        if (map[STORAGE_KEYS.autoSendVoice] !== null) {
          setAutoSendVoiceState(map[STORAGE_KEYS.autoSendVoice] === 'true');
        }
        const lang = map[STORAGE_KEYS.language];
        if (lang === 'es' || lang === 'en') {
          setLanguageState(lang);
        }
        if (map[STORAGE_KEYS.pushNotifications] !== null) {
          setPushNotificationsState(map[STORAGE_KEYS.pushNotifications] === 'true');
        }
        if (map[STORAGE_KEYS.emailNotifications] !== null) {
          setEmailNotificationsState(map[STORAGE_KEYS.emailNotifications] === 'true');
        }
        if (map[STORAGE_KEYS.reminderNotifications] !== null) {
          setReminderNotificationsState(map[STORAGE_KEYS.reminderNotifications] === 'true');
        }
        if (map[STORAGE_KEYS.biometricLock] !== null) {
          setBiometricLockState(map[STORAGE_KEYS.biometricLock] === 'true');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadPreferences();

    return () => {
      isMounted = false;
    };
  }, []);

  const setAutoSendVoice = useCallback(async (value: boolean) => {
    await AsyncStorage.setItem(STORAGE_KEYS.autoSendVoice, value ? 'true' : 'false');
    setAutoSendVoiceState(value);
  }, []);

  const setLanguage = useCallback(async (value: AppLanguage) => {
    await AsyncStorage.setItem(STORAGE_KEYS.language, value);
    setLanguageState(value);
  }, []);

  const setPushNotifications = useCallback(async (value: boolean) => {
    await AsyncStorage.setItem(STORAGE_KEYS.pushNotifications, value ? 'true' : 'false');
    setPushNotificationsState(value);
  }, []);

  const setEmailNotifications = useCallback(async (value: boolean) => {
    await AsyncStorage.setItem(STORAGE_KEYS.emailNotifications, value ? 'true' : 'false');
    setEmailNotificationsState(value);
  }, []);

  const setReminderNotifications = useCallback(async (value: boolean) => {
    await AsyncStorage.setItem(STORAGE_KEYS.reminderNotifications, value ? 'true' : 'false');
    setReminderNotificationsState(value);
  }, []);

  const setBiometricLock = useCallback(async (value: boolean) => {
    await AsyncStorage.setItem(STORAGE_KEYS.biometricLock, value ? 'true' : 'false');
    setBiometricLockState(value);
  }, []);

  const value = useMemo(
    () => ({
      isLoading,
      autoSendVoice,
      language,
      pushNotifications,
      emailNotifications,
      reminderNotifications,
      biometricLock,
      setAutoSendVoice,
      setLanguage,
      setPushNotifications,
      setEmailNotifications,
      setReminderNotifications,
      setBiometricLock,
    }),
    [
      isLoading,
      autoSendVoice,
      language,
      pushNotifications,
      emailNotifications,
      reminderNotifications,
      biometricLock,
      setAutoSendVoice,
      setLanguage,
      setPushNotifications,
      setEmailNotifications,
      setReminderNotifications,
      setBiometricLock,
    ],
  );

  return (
    <UserPreferencesContext.Provider value={value}>{children}</UserPreferencesContext.Provider>
  );
}

export function useUserPreferences() {
  const context = useContext(UserPreferencesContext);
  if (!context) {
    throw new Error('useUserPreferences must be used within UserPreferencesProvider');
  }
  return context;
}
