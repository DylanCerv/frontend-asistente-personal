import Ionicons from '@react-native-vector-icons/ionicons';
import { useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Switch,
  Text,
  View,
} from 'react-native';
import { ScreenSafeArea } from '@/components/screen-safe-area';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/text-input';
import {
  COURSE_BUNDLE_PRICE_USD,
  FUTURE_FREE_LIMITS,
  PAYMENT_PROVIDER,
  SUBSCRIPTION_PLANS,
} from '@/constants/subscription-plans';
import { useAuth } from '@/context/auth-context';
import { useSubscription } from '@/context/subscription-context';
import { useUserPreferences, type AppLanguage } from '@/context/user-preferences-context';
import { ensureNotificationPermissions } from '@/services/reminders/reminder-notifications';

export type ProfileSheetType =
  | 'personal'
  | 'security'
  | 'notifications'
  | 'language'
  | 'subscription'
  | null;

type ProfileSettingsSheetProps = {
  type: ProfileSheetType;
  onClose: () => void;
};

export function ProfileSettingsSheet({ type, onClose }: ProfileSettingsSheetProps) {
  if (!type) return null;

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <ScreenSafeArea>
        <View className="flex-row items-center justify-between border-b border-border px-5 py-4 dark:border-border-dark">
          <Text className="text-lg font-bold text-foreground dark:text-foreground-dark">
            {titles[type]}
          </Text>
          <Pressable accessibilityRole="button" onPress={onClose} className="p-2">
            <Ionicons name="close" size={24} color="#6B6475" />
          </Pressable>
        </View>

        <ScrollView contentContainerClassName="gap-6 p-5 pb-10">
          {type === 'personal' ? <PersonalDataForm onClose={onClose} /> : null}
          {type === 'security' ? <SecuritySettings /> : null}
          {type === 'notifications' ? <NotificationSettings /> : null}
          {type === 'language' ? <LanguageSettings /> : null}
          {type === 'subscription' ? <SubscriptionSettings /> : null}
        </ScrollView>
      </ScreenSafeArea>
    </Modal>
  );
}

const titles: Record<Exclude<ProfileSheetType, null>, string> = {
  personal: 'Datos personales',
  security: 'Seguridad',
  notifications: 'Notificaciones',
  language: 'Idioma',
  subscription: 'Suscripción',
};

function PersonalDataForm({ onClose }: { onClose: () => void }) {
  const { user, updateDisplayName } = useAuth();
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState('');

  function handleSave() {
    if (name.trim()) {
      updateDisplayName(name.trim());
    }
    Alert.alert('Guardado', 'Tus datos personales se actualizaron.');
    onClose();
  }

  return (
    <View className="gap-4">
      <Input label="Nombre" value={name} onChangeText={setName} autoCapitalize="words" />
      <Input
        label="Correo"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <Input
        label="Teléfono (opcional)"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        placeholder="+593 99 000 0000"
      />
      <Button label="Guardar cambios" onPress={handleSave} />
    </View>
  );
}

function SecuritySettings() {
  const { biometricLock, setBiometricLock } = useUserPreferences();

  return (
    <View className="gap-4">
      <SettingToggle
        label="Bloqueo biométrico"
        description="Usa huella o Face ID para abrir la app"
        value={biometricLock}
        onValueChange={setBiometricLock}
      />
      <View className="rounded-2xl bg-canvas p-4 dark:bg-canvas-dark">
        <Text className="text-sm font-semibold text-foreground dark:text-foreground-dark">
          Cambiar contraseña
        </Text>
        <Text className="mt-1 text-xs text-subtle dark:text-subtle-dark">
          Disponible cuando conectes tu cuenta al backend.
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => Alert.alert('Próximamente', 'Esta opción estará disponible con el backend.')}
          className="mt-3 self-start rounded-full bg-surface-soft px-4 py-2 dark:bg-surface-soft-dark">
          <Text className="text-sm font-semibold text-brand dark:text-brand-dark">Configurar</Text>
        </Pressable>
      </View>
    </View>
  );
}

function NotificationSettings() {
  const {
    pushNotifications,
    emailNotifications,
    reminderNotifications,
    setPushNotifications,
    setEmailNotifications,
    setReminderNotifications,
  } = useUserPreferences();

  async function handlePushChange(value: boolean) {
    if (value) {
      await ensureNotificationPermissions();
    }
    await setPushNotifications(value);
  }

  async function handleReminderChange(value: boolean) {
    if (value) {
      await ensureNotificationPermissions();
    }
    await setReminderNotifications(value);
  }

  return (
    <View className="gap-3">
      <SettingToggle
        label="Notificaciones push"
        description="Alertas en tu teléfono"
        value={pushNotifications}
        onValueChange={handlePushChange}
      />
      <SettingToggle
        label="Notificaciones por correo"
        description="Resúmenes y recordatorios por email"
        value={emailNotifications}
        onValueChange={setEmailNotifications}
      />
      <SettingToggle
        label="Recordatorios inteligentes"
        description="7d, 3d, mañana, hoy y 1h antes según prioridad"
        value={reminderNotifications}
        onValueChange={handleReminderChange}
      />
    </View>
  );
}

function LanguageSettings() {
  const { language, setLanguage } = useUserPreferences();

  const options: { id: AppLanguage; label: string }[] = [
    { id: 'es', label: 'Español' },
    { id: 'en', label: 'English' },
  ];

  return (
    <View className="gap-2">
      {options.map((option) => (
        <Pressable
          key={option.id}
          accessibilityRole="button"
          onPress={() => setLanguage(option.id)}
          className={`flex-row items-center justify-between rounded-2xl border p-4 ${
            language === option.id
              ? 'border-brand bg-surface-soft dark:border-brand-dark dark:bg-surface-soft-dark'
              : 'border-border bg-surface dark:border-border-dark dark:bg-surface-dark'
          }`}>
          <Text className="text-[15px] font-medium text-foreground dark:text-foreground-dark">
            {option.label}
          </Text>
          {language === option.id ? (
            <Ionicons name="checkmark-circle" size={22} color="#7C3AED" />
          ) : null}
        </Pressable>
      ))}
    </View>
  );
}

function SubscriptionSettings() {
  const {
    plan,
    planId,
    voiceUsageThisMonth,
    aiUsageThisMonth,
    isBetaUnlimited,
    upgradeToPro,
    purchaseCourseBundle,
  } = useSubscription();

  async function handleUpgrade() {
    try {
      await upgradeToPro();
      Alert.alert('Pro activado', 'Tu plan Pro está activo. ¡Gracias!');
    } catch (error) {
      Alert.alert('Pago', error instanceof Error ? error.message : 'No se pudo procesar el pago.');
    }
  }

  async function handleCourseBundle() {
    try {
      await purchaseCourseBundle();
      Alert.alert(
        'Paquete activado',
        `Plan Pro activado con paquete de cursos ($${COURSE_BUNDLE_PRICE_USD} USD).`,
      );
    } catch (error) {
      Alert.alert('Pago', error instanceof Error ? error.message : 'No se pudo procesar el pago.');
    }
  }

  return (
    <View className="gap-5">
      <View className="rounded-2xl bg-brand p-5 dark:bg-brand-dark">
        <Text className="text-sm text-white/80">Plan actual</Text>
        <Text className="text-2xl font-bold text-white">{plan.name}</Text>
        <Text className="mt-1 text-sm text-white/90">{plan.description}</Text>
      </View>

      <View className="gap-3 rounded-2xl border border-border bg-surface p-4 dark:border-border-dark dark:bg-surface-dark">
        <Text className="text-sm font-semibold text-foreground dark:text-foreground-dark">
          Uso este mes
        </Text>
        <UsageRow
          label="Mensajes de voz"
          used={voiceUsageThisMonth}
          limit={isBetaUnlimited ? null : FUTURE_FREE_LIMITS.voiceMessagesPerMonth}
        />
        <UsageRow
          label="Mensajes con IA"
          used={aiUsageThisMonth}
          limit={isBetaUnlimited ? null : FUTURE_FREE_LIMITS.aiMessagesPerMonth}
        />
        {isBetaUnlimited ? (
          <Text className="text-xs text-brand dark:text-brand-dark">
            Beta: uso ilimitado temporalmente
          </Text>
        ) : null}
      </View>

      {Object.values(SUBSCRIPTION_PLANS).map((item) => (
        <View
          key={item.id}
          className={`gap-3 rounded-2xl border p-4 ${
            planId === item.id
              ? 'border-brand bg-surface-soft dark:border-brand-dark dark:bg-surface-soft-dark'
              : 'border-border bg-surface dark:border-border-dark dark:bg-surface-dark'
          }`}>
          <View className="flex-row items-center justify-between">
            <Text className="text-lg font-bold text-foreground dark:text-foreground-dark">
              {item.name}
            </Text>
            <Text className="text-base font-semibold text-brand dark:text-brand-dark">
              {item.priceLabel}
            </Text>
          </View>
          {item.features.map((feature) => (
            <Text key={feature} className="text-sm text-subtle dark:text-subtle-dark">
              • {feature}
            </Text>
          ))}
        </View>
      ))}

      {planId === 'free' ? (
        <Button label="Actualizar a Pro — $4.99/mes" onPress={handleUpgrade} />
      ) : null}

      <Button
        label={`Paquete de cursos — $${COURSE_BUNDLE_PRICE_USD} USD`}
        variant="secondary"
        onPress={handleCourseBundle}
        className="border border-border dark:border-border-dark"
      />

      <View className="gap-2 rounded-2xl bg-canvas p-4 dark:bg-canvas-dark">
        <Text className="text-sm font-semibold text-foreground dark:text-foreground-dark">
          Pago con {PAYMENT_PROVIDER.name} ({PAYMENT_PROVIDER.region})
        </Text>
        <Text className="text-xs leading-5 text-subtle dark:text-subtle-dark">
          {PAYMENT_PROVIDER.note} Métodos: {PAYMENT_PROVIDER.methods.join(', ')}.
        </Text>
      </View>
    </View>
  );
}

function SettingToggle({
  label,
  description,
  value,
  onValueChange,
}: {
  label: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => Promise<void>;
}) {
  return (
    <View className="flex-row items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-4 dark:border-border-dark dark:bg-surface-dark">
      <View className="flex-1 gap-1">
        <Text className="text-[15px] font-semibold text-foreground dark:text-foreground-dark">
          {label}
        </Text>
        <Text className="text-xs text-subtle dark:text-subtle-dark">{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#E7DFF5', true: '#A78BFA' }}
        thumbColor={value ? '#7C3AED' : '#FFFFFF'}
      />
    </View>
  );
}

function UsageRow({
  label,
  used,
  limit,
}: {
  label: string;
  used: number;
  limit: number | null;
}) {
  return (
    <View className="flex-row items-center justify-between">
      <Text className="text-sm text-subtle dark:text-subtle-dark">{label}</Text>
      <Text className="text-sm font-semibold text-foreground dark:text-foreground-dark">
        {used}
        {limit !== null ? ` / ${limit}` : ' · Ilimitado'}
      </Text>
    </View>
  );
}
