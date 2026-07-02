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

const ONBOARDING_KEY = '@asistente/onboarding_complete';
const LEGACY_SETUP_KEY = '@asistente/setup_complete';

type AppFlowContextValue = {
  isFlowLoading: boolean;
  hasCompletedOnboarding: boolean;
  completeOnboarding: () => Promise<void>;
  beginOnboarding: () => Promise<void>;
  resetFlow: () => Promise<void>;
};

const AppFlowContext = createContext<AppFlowContextValue | null>(null);

export function AppFlowProvider({ children }: { children: ReactNode }) {
  const [isFlowLoading, setIsFlowLoading] = useState(true);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadFlowState() {
      try {
        const [onboarding, legacySetup] = await Promise.all([
          AsyncStorage.getItem(ONBOARDING_KEY),
          AsyncStorage.getItem(LEGACY_SETUP_KEY),
        ]);

        if (isMounted) {
          setHasCompletedOnboarding(onboarding === 'true' || legacySetup === 'true');
        }
      } finally {
        if (isMounted) {
          setIsFlowLoading(false);
        }
      }
    }

    loadFlowState();

    return () => {
      isMounted = false;
    };
  }, []);

  const completeOnboarding = useCallback(async () => {
    await AsyncStorage.multiSet([
      [ONBOARDING_KEY, 'true'],
      [LEGACY_SETUP_KEY, 'true'],
    ]);
    setHasCompletedOnboarding(true);
  }, []);

  const beginOnboarding = useCallback(async () => {
    await AsyncStorage.removeItem(ONBOARDING_KEY);
    setHasCompletedOnboarding(false);
  }, []);

  const resetFlow = useCallback(async () => {
    await AsyncStorage.multiRemove([ONBOARDING_KEY, LEGACY_SETUP_KEY]);
    setHasCompletedOnboarding(false);
  }, []);

  const value = useMemo(
    () => ({
      isFlowLoading,
      hasCompletedOnboarding,
      completeOnboarding,
      beginOnboarding,
      resetFlow,
    }),
    [isFlowLoading, hasCompletedOnboarding, completeOnboarding, beginOnboarding, resetFlow],
  );

  return <AppFlowContext.Provider value={value}>{children}</AppFlowContext.Provider>;
}

export function useAppFlow() {
  const context = useContext(AppFlowContext);
  if (!context) {
    throw new Error('useAppFlow must be used within AppFlowProvider');
  }
  return context;
}
