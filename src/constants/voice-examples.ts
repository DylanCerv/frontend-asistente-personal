import type { ComponentProps } from 'react';

import type Ionicons from '@react-native-vector-icons/ionicons';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

export type VoiceExample = {
  id: string;
  label: string;
  icon: IoniconName;
};

/** Common spoken examples — shown as read-only hints, not actions.
 * Prefer day + time so the AI can set reminders/alarms correctly.
 */
export const VOICE_EXAMPLES: VoiceExample[] = [
  {
    id: 'pay-internet',
    label: 'Recuérdame pagar el internet el viernes a las 9 am',
    icon: 'cash-outline',
  },
  {
    id: 'pay-rent',
    label: 'Pagar el arriendo el 1 a las 8 am, es urgente',
    icon: 'home-outline',
  },
  {
    id: 'pay-light',
    label: 'Pagar la luz mañana antes de las 11 am',
    icon: 'flash-outline',
  },
  {
    id: 'buy-groceries',
    label: 'Comprar el mercado el sábado a las 10 am',
    icon: 'cart-outline',
  },
  {
    id: 'call-mom',
    label: 'Llamar a mamá mañana a las 6 pm',
    icon: 'call-outline',
  },
  {
    id: 'doctor',
    label: 'Cita con el médico el jueves a las 10:30 am',
    icon: 'medkit-outline',
  },
  {
    id: 'gym',
    label: 'Gimnasio el lunes a las 10 am',
    icon: 'fitness-outline',
  },
  {
    id: 'meeting',
    label: 'Reunión con el equipo mañana a las 9 am',
    icon: 'people-outline',
  },
  {
    id: 'move-meeting',
    label: 'Mueve la reunión de mañana de las 3 pm a las 5 pm',
    icon: 'calendar-outline',
  },
  {
    id: 'send-email',
    label: 'Enviar el informe hoy a las 4 pm, avísame 15 minutos antes',
    icon: 'mail-outline',
  },
  {
    id: 'birthday',
    label: 'Cumpleaños de Ana el 15 a las 7 pm',
    icon: 'gift-outline',
  },
  {
    id: 'water-plants',
    label: 'Regar las plantas el domingo a las 8 am',
    icon: 'leaf-outline',
  },
  {
    id: 'study',
    label: 'Estudiar inglés hoy de 7 a 7:30 pm',
    icon: 'book-outline',
  },
  {
    id: 'invoice',
    label: 'Cobrar la factura de Pedro el martes a las 11 am',
    icon: 'receipt-outline',
  },
  {
    id: 'car-service',
    label: 'Llevar el carro al taller el lunes a las 8:30 am',
    icon: 'car-outline',
  },
  {
    id: 'pharmacy',
    label: 'Comprar las medicinas hoy a las 5 pm, es prioritario',
    icon: 'medical-outline',
  },
  {
    id: 'laundry',
    label: 'Llevar la ropa a la lavandería el miércoles a las 2 pm',
    icon: 'shirt-outline',
  },
  {
    id: 'whats-today',
    label: '¿Qué tengo pendiente para hoy?',
    icon: 'list-outline',
  },
  {
    id: 'remind-lunch',
    label: 'Recuérdame almorzar hoy a la 1 pm',
    icon: 'restaurant-outline',
  },
  {
    id: 'pay-card',
    label: 'Pagar la tarjeta el 20 a las 9 am, no se me puede pasar',
    icon: 'card-outline',
  },
  {
    id: 'dentist',
    label: 'Dentista el viernes a las 3:30 pm',
    icon: 'happy-outline',
  },
  {
    id: 'school-pickup',
    label: 'Recoger a los niños del colegio hoy a las 2:30 pm',
    icon: 'school-outline',
  },
  {
    id: 'pay-water',
    label: 'Pagar el agua el martes a las 10 am',
    icon: 'water-outline',
  },
  {
    id: 'haircut',
    label: 'Corte de pelo el sábado a las 11 am',
    icon: 'cut-outline',
  },
  {
    id: 'flight',
    label: 'Salida al aeropuerto el domingo a las 5 am, avísame a las 4',
    icon: 'airplane-outline',
  },
  {
    id: 'client-call',
    label: 'Llamar al cliente Juan hoy a las 11:15 am',
    icon: 'briefcase-outline',
  },
  {
    id: 'take-meds',
    label: 'Tomar la medicina todos los días a las 8 am y 8 pm',
    icon: 'alarm-outline',
  },
  {
    id: 'pet-vet',
    label: 'Llevar al perro al veterinario el jueves a las 4 pm',
    icon: 'paw-outline',
  },
  {
    id: 'bank',
    label: 'Ir al banco el miércoles a las 9:30 am',
    icon: 'business-outline',
  },
  {
    id: 'submit-homework',
    label: 'Entregar el trabajo de la universidad mañana a las 8 am',
    icon: 'document-text-outline',
  },
];

const VISIBLE_COUNT = 2;

function shuffleInPlace<T>(items: T[]): T[] {
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = items[i];
    items[i] = items[j]!;
    items[j] = temp!;
  }
  return items;
}

/** Picks a fresh random subset of voice examples for the Assistant screen. */
export function pickVoiceExamples(count = VISIBLE_COUNT): VoiceExample[] {
  const pool = shuffleInPlace([...VOICE_EXAMPLES]);
  return pool.slice(0, Math.min(count, pool.length));
}
