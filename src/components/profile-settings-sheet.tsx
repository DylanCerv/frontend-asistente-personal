import Ionicons from '@react-native-vector-icons/ionicons';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { useState } from 'react';
import {
  Modal,
  Platform,
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
  FUTURE_FREE_LIMITS,
  PAYMENT_PROVIDER,
  SUBSCRIPTION_PLANS,
} from '@/constants/subscription-plans';
import { useAuth } from '@/context/auth-context';
import { useSubscription } from '@/context/subscription-context';
import { useUserPreferences, type AppLanguage } from '@/context/user-preferences-context';
import { ensureNotificationPermissions } from '@/services/reminders/reminder-notifications';
import { uploadAvatar } from '@/services/profiles/avatar-upload';
import { changePasswordRequest } from '@/services/auth/auth-api';
import { showAppAlert } from '@/services/app-dialog';

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
  const { user, updateProfile, updateAvatar } = useAuth();
  const { preferredName, setPreferredName } = useUserPreferences();
  const [name, setName] = useState(user?.name ?? '');
  const [assistantName, setAssistantName] = useState(preferredName || user?.name || '');
  const [avatarUri, setAvatarUri] = useState<string | null>(user?.avatarUrl ?? null);
  const [isSaving, setIsSaving] = useState(false);

  async function pickAvatar() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showAppAlert('Permiso requerido', 'Necesitamos acceso a tu galería para cambiar la foto.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setAvatarUri(result.assets[0].uri);
    }
  }

  async function handleSave() {
    const trimmedName = name.trim();
    if (!trimmedName) return;

    setIsSaving(true);
    try {
      await updateProfile({ fullName: trimmedName });
      await setPreferredName(assistantName.trim() || trimmedName);

      // Upload avatar only if it's a new local file (not a remote URL)
      if (avatarUri && !avatarUri.startsWith('http') && user?.id) {
        const publicUrl = await uploadAvatar(user.id, avatarUri);
        updateAvatar(publicUrl);
      }

      showAppAlert('Guardado', 'Tus datos personales se actualizaron.');
      onClose();
    } catch (error) {
      showAppAlert(
        'Error',
        error instanceof Error ? error.message : 'No se pudieron guardar los cambios.',
      );
    } finally {
      setIsSaving(false);
    }
  }

  const initial = user?.name?.charAt(0)?.toUpperCase() ?? 'A';

  return (
    <View className="gap-4">
      <Pressable
        accessibilityRole="button"
        onPress={pickAvatar}
        className="self-center items-center gap-2">
        <View className="h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 border-surface-soft bg-brand dark:border-surface-soft-dark dark:bg-brand-dark">
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={{ width: 96, height: 96 }} contentFit="cover" />
          ) : (
            <Text className="text-4xl font-bold text-white">{initial}</Text>
          )}
        </View>
        <View className="flex-row items-center gap-1">
          <Ionicons name="camera-outline" size={14} color="#7C3AED" />
          <Text className="text-xs font-semibold text-brand dark:text-brand-dark">
            Cambiar foto
          </Text>
        </View>
      </Pressable>

      <Input label="Nombre" value={name} onChangeText={setName} autoCapitalize="words" />
      <Input
        label="¿Cómo quieres que te llame Kivo?"
        value={assistantName}
        onChangeText={setAssistantName}
        placeholder="Ej. Dylan"
        autoCapitalize="words"
      />
      <Text className="text-xs leading-5 text-subtle dark:text-subtle-dark">
        Kivo usará este nombre en el chat y en tus reportes.
      </Text>
      <View className="rounded-2xl border border-border bg-surface p-4 dark:border-border-dark dark:bg-surface-dark">
        <Text className="text-xs font-semibold uppercase text-subtle dark:text-subtle-dark">
          Correo
        </Text>
        <Text className="mt-1 text-sm text-foreground dark:text-foreground-dark">
          {user?.email ?? '—'}
        </Text>
        <Text className="mt-1 text-xs text-subtle dark:text-subtle-dark">
          El correo no se puede cambiar desde la app.
        </Text>
      </View>
      <Button label={isSaving ? 'Guardando...' : 'Guardar cambios'} onPress={handleSave} />
    </View>
  );
}

function SecuritySettings() {
  const { biometricLock, setBiometricLock } = useUserPreferences();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  async function handleChangePassword() {
    if (!currentPassword || !newPassword || !confirmPassword) {
      showAppAlert('Campos requeridos', 'Completa todos los campos.');
      return;
    }
    if (newPassword !== confirmPassword) {
      showAppAlert('Error', 'La nueva contraseña y la confirmación no coinciden.');
      return;
    }
    if (newPassword.length < 8) {
      showAppAlert('Error', 'La nueva contraseña debe tener al menos 8 caracteres.');
      return;
    }

    setIsSaving(true);
    try {
      await changePasswordRequest(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showAppAlert('Listo', 'Tu contraseña se actualizó correctamente.');
    } catch (error) {
      showAppAlert('Error', error instanceof Error ? error.message : 'No se pudo cambiar la contraseña.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <View className="gap-4">
      <SettingToggle
        label="Bloqueo biométrico"
        description="Usa huella o Face ID para abrir la app (solo este dispositivo)"
        value={biometricLock}
        onValueChange={setBiometricLock}
      />

      <View className="gap-3 rounded-2xl border border-border bg-surface p-4 dark:border-border-dark dark:bg-surface-dark">
        <Text className="text-[15px] font-semibold text-foreground dark:text-foreground-dark">
          Cambiar contraseña
        </Text>
        <Input
          label="Contraseña actual"
          value={currentPassword}
          onChangeText={setCurrentPassword}
          secureTextEntry
          autoCapitalize="none"
        />
        <Input
          label="Nueva contraseña"
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry
          autoCapitalize="none"
        />
        <Input
          label="Repetir nueva contraseña"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          autoCapitalize="none"
        />
        <Button
          label={isSaving ? 'Actualizando...' : 'Actualizar contraseña'}
          onPress={handleChangePassword}
        />
      </View>
    </View>
  );
}

function NotificationSettings() {
  const {
    pushNotifications,
    reminderNotifications,
    setPushNotifications,
    setReminderNotifications,
  } = useUserPreferences();

  async function handlePushChange(value: boolean) {
    if (value) await ensureNotificationPermissions();
    await setPushNotifications(value);
  }

  async function handleReminderChange(value: boolean) {
    if (value) await ensureNotificationPermissions();
    await setReminderNotifications(value);
  }

  return (
    <View className="gap-3">
      <SettingToggle
        label="Notificaciones push"
        description="Alertas generales en tu teléfono"
        value={pushNotifications}
        onValueChange={handlePushChange}
      />
      <SettingToggle
        label="Recordatorios inteligentes"
        description="Kivo te avisa 7d, 3d, mañana, hoy y 1h antes del vencimiento de cada tarea"
        value={reminderNotifications}
        onValueChange={handleReminderChange}
      />
      <View className="rounded-2xl bg-canvas p-4 dark:bg-canvas-dark">
        <Text className="text-xs leading-5 text-subtle dark:text-subtle-dark">
          Los recordatorios se programan localmente en tu dispositivo. Asegúrate de que las
          notificaciones de Kivo estén habilitadas en la configuración del sistema.
        </Text>
      </View>
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
  const { plan, planId, isBetaUnlimited, upgradeToPro } = useSubscription();
  const voiceUsageThisMonth = 0;
  const aiUsageThisMonth = 0;

  async function handleUpgrade() {
    try {
      await upgradeToPro();
      showAppAlert('Pro activado', 'Tu plan Pro está activo. ¡Gracias!');
    } catch (error) {
      showAppAlert('Pago', error instanceof Error ? error.message : 'No se pudo procesar el pago.');
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

