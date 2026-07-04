import * as WebBrowser from 'expo-web-browser';
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from 'react';

import {
  SUBSCRIPTION_PLANS,
  type PlanId,
} from '@/constants/subscription-plans';
import { useUserPreferences } from '@/context/user-preferences-context';

type SubscriptionContextValue = {
  planId: PlanId;
  plan: (typeof SUBSCRIPTION_PLANS)[PlanId];
  isBetaUnlimited: boolean;
  upgradeToPro: () => Promise<void>;
};

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null);

const CHECKOUT_URL = process.env.EXPO_PUBLIC_MERCADOPAGO_CHECKOUT_URL ?? '';

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { plan: planId, setPlan } = useUserPreferences();

  const isBetaUnlimited = true;

  const upgradeToPro = useCallback(async () => {
    const url =
      CHECKOUT_URL ||
      'https://www.mercadopago.com.ec/subscriptions/checkout?plan=kivo-pro';

    await WebBrowser.openBrowserAsync(url);
    await setPlan('pro');
  }, [setPlan]);

  const value = useMemo(
    () => ({
      planId,
      plan: SUBSCRIPTION_PLANS[planId],
      isBetaUnlimited,
      upgradeToPro,
    }),
    [planId, upgradeToPro],
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
