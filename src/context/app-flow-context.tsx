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
const SETUP_KEY = '@asistente/setup_complete';

type AppFlowContextValue = {
  isFlowLoading: boolean;
  hasCompletedOnboarding: boolean;
  hasCompletedSetup: boolean;
  completeOnboarding: () => Promise<void>;
  completeSetup: () => Promise<void>;
  resetFlow: () => Promise<void>;
};

const AppFlowContext = createContext<AppFlowContextValue | null>(null);

export function AppFlowProvider({ children }: { children: ReactNode }) {
  const [isFlowLoading, setIsFlowLoading] = useState(true);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [hasCompletedSetup, setHasCompletedSetup] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadFlowState() {
      try {
        const [onboarding, setup] = await Promise.all([
          AsyncStorage.getItem(ONBOARDING_KEY),
          AsyncStorage.getItem(SETUP_KEY),
        ]);

        if (isMounted) {
          setHasCompletedOnboarding(onboarding === 'true');
          setHasCompletedSetup(setup === 'true');
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
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    setHasCompletedOnboarding(true);
  }, []);

  const completeSetup = useCallback(async () => {
    await AsyncStorage.setItem(SETUP_KEY, 'true');
    setHasCompletedSetup(true);
  }, []);

  const resetFlow = useCallback(async () => {
    await AsyncStorage.multiRemove([ONBOARDING_KEY, SETUP_KEY]);
    setHasCompletedOnboarding(false);
    setHasCompletedSetup(false);
  }, []);

  const value = useMemo(
    () => ({
      isFlowLoading,
      hasCompletedOnboarding,
      hasCompletedSetup,
      completeOnboarding,
      completeSetup,
      resetFlow,
    }),
    [
      isFlowLoading,
      hasCompletedOnboarding,
      hasCompletedSetup,
      completeOnboarding,
      completeSetup,
      resetFlow,
    ],
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
