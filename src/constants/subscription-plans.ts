export type PlanId = 'free' | 'pro';

export type SubscriptionPlan = {
  id: PlanId;
  name: string;
  priceLabel: string;
  priceMonthlyUsd: number;
  description: string;
  voiceMessagesPerMonth: number | null;
  aiMessagesPerMonth: number | null;
  pdfReports: boolean;
  prioritySupport: boolean;
  courseBundles: boolean;
  features: string[];
};

export const SUBSCRIPTION_PLANS: Record<PlanId, SubscriptionPlan> = {
  free: {
    id: 'free',
    name: 'Gratis',
    priceLabel: '$0',
    priceMonthlyUsd: 0,
    description: 'Ideal para empezar. Sin límite durante la beta.',
    voiceMessagesPerMonth: null,
    aiMessagesPerMonth: null,
    pdfReports: true,
    prioritySupport: false,
    courseBundles: false,
    features: [
      'Captura por voz ilimitada (beta)',
      'Chat con IA ilimitado (beta)',
      'Reportes PDF básicos',
      'Agenda y tareas',
    ],
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    priceLabel: '$4.99/mes',
    priceMonthlyUsd: 4.99,
    description: 'Para uso intensivo y paquetes de cursos.',
    voiceMessagesPerMonth: null,
    aiMessagesPerMonth: null,
    pdfReports: true,
    prioritySupport: true,
    courseBundles: true,
    features: [
      'Todo lo del plan Gratis',
      'Voz e IA sin restricciones',
      'Reportes avanzados con recomendaciones',
      'Paquetes de cursos incluidos',
      'Soporte prioritario',
    ],
  },
};

/** Post-beta limits (shown as reference in UI) */
export const FUTURE_FREE_LIMITS = {
  voiceMessagesPerMonth: 50,
  aiMessagesPerMonth: 100,
} as const;

export const PAYMENT_PROVIDER = {
  name: 'Mercado Pago',
  region: 'Ecuador',
  methods: ['Tarjetas débito/crédito', 'Transferencia', 'Efectivo (Red Activa)'],
  note: 'Pagos procesados en USD. Compatible con bancos ecuatorianos.',
} as const;

export const COURSE_BUNDLE_PRICE_USD = 9.99;
