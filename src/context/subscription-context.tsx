import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
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
  COURSE_BUNDLE_PRICE_USD,
  SUBSCRIPTION_PLANS,
  type PlanId,
} from '@/constants/subscription-plans';

const PLAN_KEY = '@asistente/plan';
const VOICE_USAGE_KEY = '@asistente/voice_usage';
const AI_USAGE_KEY = '@asistente/ai_usage';

type UsageMonth = { month: string; count: number };

function currentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

async function loadUsage(key: string): Promise<number> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return 0;
  const parsed = JSON.parse(raw) as UsageMonth;
  return parsed.month === currentMonthKey() ? parsed.count : 0;
}

async function saveUsage(key: string, count: number): Promise<void> {
  const payload: UsageMonth = { month: currentMonthKey(), count };
  await AsyncStorage.setItem(key, JSON.stringify(payload));
}

type SubscriptionContextValue = {
  planId: PlanId;
  plan: (typeof SUBSCRIPTION_PLANS)[PlanId];
  voiceUsageThisMonth: number;
  aiUsageThisMonth: number;
  isBetaUnlimited: boolean;
  recordVoiceUsage: () => Promise<void>;
  recordAiUsage: () => Promise<void>;
  upgradeToPro: () => Promise<void>;
  purchaseCourseBundle: () => Promise<void>;
};

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null);

const CHECKOUT_URL = process.env.EXPO_PUBLIC_MERCADOPAGO_CHECKOUT_URL ?? '';
const COURSE_CHECKOUT_URL = process.env.EXPO_PUBLIC_MERCADOPAGO_COURSE_URL ?? '';

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [planId, setPlanId] = useState<PlanId>('free');
  const [voiceUsage, setVoiceUsage] = useState(0);
  const [aiUsage, setAiUsage] = useState(0);

  const isBetaUnlimited = true;

  useEffect(() => {
    async function load() {
      const storedPlan = await AsyncStorage.getItem(PLAN_KEY);
      if (storedPlan === 'free' || storedPlan === 'pro') {
        setPlanId(storedPlan);
      }
      setVoiceUsage(await loadUsage(VOICE_USAGE_KEY));
      setAiUsage(await loadUsage(AI_USAGE_KEY));
    }
    load();
  }, []);

  const recordVoiceUsage = useCallback(async () => {
    const next = voiceUsage + 1;
    setVoiceUsage(next);
    await saveUsage(VOICE_USAGE_KEY, next);
  }, [voiceUsage]);

  const recordAiUsage = useCallback(async () => {
    const next = aiUsage + 1;
    setAiUsage(next);
    await saveUsage(AI_USAGE_KEY, next);
  }, [aiUsage]);

  const openCheckout = useCallback(async (url: string, fallbackMessage: string) => {
    if (url) {
      await WebBrowser.openBrowserAsync(url);
      return;
    }
    await WebBrowser.openBrowserAsync(
      `https://www.mercadopago.com.ec/subscriptions/checkout?plan=asistente-pro`,
    ).catch(() => {
      throw new Error(fallbackMessage);
    });
  }, []);

  const upgradeToPro = useCallback(async () => {
    await openCheckout(
      CHECKOUT_URL,
      'Configura EXPO_PUBLIC_MERCADOPAGO_CHECKOUT_URL para activar pagos con Mercado Pago.',
    );
    await AsyncStorage.setItem(PLAN_KEY, 'pro');
    setPlanId('pro');
  }, [openCheckout]);

  const purchaseCourseBundle = useCallback(async () => {
    const url =
      COURSE_CHECKOUT_URL ||
      CHECKOUT_URL ||
      `https://www.mercadopago.com.ec/checkout/v1/payment?amount=${COURSE_BUNDLE_PRICE_USD}`;
    await openCheckout(url, 'Configura la URL de checkout para paquetes de cursos.');
    await AsyncStorage.setItem(PLAN_KEY, 'pro');
    setPlanId('pro');
  }, [openCheckout]);

  const value = useMemo(
    () => ({
      planId,
      plan: SUBSCRIPTION_PLANS[planId],
      voiceUsageThisMonth: voiceUsage,
      aiUsageThisMonth: aiUsage,
      isBetaUnlimited,
      recordVoiceUsage,
      recordAiUsage,
      upgradeToPro,
      purchaseCourseBundle,
    }),
    [
      planId,
      voiceUsage,
      aiUsage,
      recordVoiceUsage,
      recordAiUsage,
      upgradeToPro,
      purchaseCourseBundle,
    ],
  );

  return (
    <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within SubscriptionProvider');
  }
  return context;
}
