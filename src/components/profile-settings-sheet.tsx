import Ionicons from '@react-native-vector-icons/ionicons';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
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

import { AppLockPinSetup } from '@/components/app-lock-pin-setup';
import {
  AppLockMethodPicker,
} from '@/components/app-lock-method-picker';
import { AppLockDelayPicker } from '@/components/app-lock-delay-picker';
import { FocusSettingsPanel } from '@/components/focus/focus-settings-panel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/text-input';
import {
  FUTURE_FREE_LIMITS,
  PAYMENT_PROVIDER,
  SUBSCRIPTION_PLANS,
} from '@/constants/subscription-plans';
import { useAuth } from '@/context/auth-context';
import { useSubscription } from '@/context/subscription-context';
import { useUserPreferences, type ReminderAlertStyle } from '@/context/user-preferences-context';
import {
  ALERT_SOUND_PRESETS,
  ALERT_VIBRATION_PRESETS,
  type ReminderAlertSoundId,
  type ReminderAlertVibrationId,
} from '@/services/reminders/reminder-alert-presets';
import { useAppLockMethodSetup } from '@/hooks/use-app-lock-method-setup';
import {
  cancelAppReminders,
  requestNotificationPermissions,
} from '@/services/reminders/reminder-notifications';
import { uploadAvatar } from '@/services/profiles/avatar-upload';
import { changePasswordRequest } from '@/services/auth/auth-api';
import { showAppAlert } from '@/services/app-dialog';

export type ProfileSheetType =
  | 'personal'
  | 'security'
  | 'notifications'
  | 'subscription'
  | 'focus'
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

        <ScrollView
          className="flex-1"
          contentContainerClassName={`flex-grow pb-10 ${type === 'security' ? 'gap-8 px-5 pt-2' : 'gap-6 p-5'}`}>
          {type === 'personal' ? <PersonalDataForm onClose={onClose} /> : null}
          {type === 'security' ? <SecuritySettings /> : null}
          {type === 'notifications' ? <NotificationSettings /> : null}
          {type === 'subscription' ? <SubscriptionSettings /> : null}
          {type === 'focus' ? <FocusSettingsPanel /> : null}
        </ScrollView>
      </ScreenSafeArea>
    </Modal>
  );
}

const titles: Record<Exclude<ProfileSheetType, null>, string> = {
  personal: 'Datos personales',
  security: 'Seguridad',
  notifications: 'Notificaciones',
  subscription: 'Suscripción',
  focus: 'Modo Focus',
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
        setAvatarUri(publicUrl);
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
  const { appLockMethod, appLockDelaySeconds, setAppLockDelaySeconds } = useUserPreferences();
  const {
    showPinSetup,
    handleMethodChange,
    handlePinSetupComplete,
    handlePinSetupCancel,
  } = useAppLockMethodSetup();
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
    <View className="w-full flex-1 gap-8">
      <View className="w-full gap-4">
        <View className="gap-1">
          <Text className="text-base font-semibold text-foreground dark:text-foreground-dark">
            Bloqueo de Kivo
          </Text>
          <Text className="text-sm text-subtle dark:text-subtle-dark">
            Un método de desbloqueo por dispositivo.
          </Text>
        </View>
        <AppLockMethodPicker value={appLockMethod} onChange={handleMethodChange} />
        {appLockMethod !== 'none' ? (
          <AppLockDelayPicker
            value={appLockDelaySeconds}
            onChange={(value) => void setAppLockDelaySeconds(value)}
          />
        ) : null}
      </View>

      <View className="h-px w-full bg-border dark:bg-border-dark" />

      <AppLockPinSetup
        visible={showPinSetup}
        title="Crea tu PIN"
        onComplete={async () => {
          await handlePinSetupComplete();
          showAppAlert('Listo', 'Kivo se desbloqueará solo con este PIN.');
        }}
        onCancel={handlePinSetupCancel}
      />

      <View className="w-full gap-4">
        <Text className="text-base font-semibold text-foreground dark:text-foreground-dark">
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
    reminderAlertStyle,
    reminderAlertSound,
    reminderAlertVibration,
    setPushNotifications,
    setReminderNotifications,
    setReminderAlertStyle,
    setReminderAlertSound,
    setReminderAlertVibration,
  } = useUserPreferences();

  const remindersAvailable = pushNotifications;
  const [isSendingTest, setIsSendingTest] = useState(false);

  async function handlePushChange(value: boolean) {
    if (!value) {
      await setPushNotifications(false);
      await setReminderNotifications(false);
      await cancelAppReminders();
      return;
    }

    const granted = await requestNotificationPermissions();
    if (!granted) {
      await setPushNotifications(false);
      await setReminderNotifications(false);
      showAppAlert(
        'Permiso requerido',
        'Sin acceso a notificaciones del celular, Kivo no puede enviarte alertas. Actívalas en la configuración del sistema.',
      );
      return;
    }

    await setPushNotifications(true);
  }

  async function handleReminderChange(value: boolean) {
    if (!value) {
      await setReminderNotifications(false);
      return;
    }

    if (!pushNotifications) {
      const granted = await requestNotificationPermissions();
      if (!granted) {
        showAppAlert(
          'Permiso requerido',
          'Primero debes permitir notificaciones del celular para usar recordatorios inteligentes.',
        );
        return;
      }
      await setPushNotifications(true);
    }

    await setReminderNotifications(true);
  }

  async function handleSendTestAlerts() {
    setIsSendingTest(true);
    try {
      const { canScheduleLocalNotifications, presentTestKivoAlerts } = await import(
        '@/services/reminders/reminder-notifications'
      );
      if (!canScheduleLocalNotifications()) {
        showAppAlert(
          'Build nativo requerido',
          'Las notificaciones del sistema solo funcionan en APK / dev client (EXPO_PUBLIC_NATIVE_BUILD=1), no en Expo Go.',
        );
        return;
      }
      const ok = await presentTestKivoAlerts(reminderAlertStyle, {
        soundId: reminderAlertSound,
        vibrationId: reminderAlertVibration,
      });
      if (!ok) {
        showAppAlert(
          'Permiso requerido',
          'Activa las notificaciones del celular para probar las alertas.',
        );
        return;
      }
      showAppAlert(
        'Alertas de prueba',
        'Se programó una alarma crítica a pantalla completa (~5 s) y un resumen del asistente. Bloquea el teléfono para probarla.',
      );
    } finally {
      setIsSendingTest(false);
    }
  }

  return (
    <View className="gap-3">
      <SettingToggle
        label="Notificaciones del celular"
        description="Permite que Kivo muestre alertas y recordatorios locales en el teléfono"
        value={pushNotifications}
        onValueChange={handlePushChange}
      />
      <SettingToggle
        label="Recordatorios inteligentes"
        description={
          remindersAvailable
            ? 'Alarmas a la hora exacta (pantalla completa) y aviso matutino a las 5:00 am'
            : 'Requiere permisos de notificaciones del celular'
        }
        value={reminderNotifications && remindersAvailable}
        onValueChange={handleReminderChange}
      />
      {reminderNotifications && remindersAvailable ? (
        <>
          <ReminderAlertStylePicker value={reminderAlertStyle} onChange={setReminderAlertStyle} />
          <ReminderAlertSoundPicker
            value={reminderAlertSound}
            enabled={reminderAlertStyle === 'sound' || reminderAlertStyle === 'both'}
            onChange={async (id) => {
              await setReminderAlertSound(id);
              const { previewAlertSound } = await import(
                '@/services/reminders/preview-alert-media'
              );
              await previewAlertSound(id);
            }}
          />
          <ReminderAlertVibrationPicker
            value={reminderAlertVibration}
            enabled={reminderAlertStyle === 'vibration' || reminderAlertStyle === 'both'}
            onChange={async (id) => {
              await setReminderAlertVibration(id);
              const { previewAlertVibration } = await import(
                '@/services/reminders/preview-alert-media'
              );
              previewAlertVibration(id);
            }}
          />
        </>
      ) : null}
      <View className="rounded-2xl bg-canvas p-4 dark:bg-canvas-dark">
        <Text className="text-xs leading-5 text-subtle dark:text-subtle-dark">
          Hora exacta: alarma a pantalla completa. Matutino (5:00 am): resumen del día y avisos
          suaves de tareas sin hora. Si niegas el permiso, las notificaciones se desactivan.
          Requiere APK (no Expo Go).
        </Text>
      </View>
      {__DEV__ ? (
        <Pressable
          accessibilityRole="button"
          disabled={isSendingTest}
          onPress={() => void handleSendTestAlerts()}
          className="min-h-[48px] items-center justify-center rounded-2xl bg-canvas active:opacity-90 dark:bg-canvas-dark"
          style={{ opacity: isSendingTest ? 0.6 : 1 }}>
          <Text className="text-sm font-semibold text-foreground dark:text-foreground-dark">
            {isSendingTest ? 'Enviando…' : 'Enviar alertas de prueba (DEV)'}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

type ReminderAlertStylePickerProps = {
  value: ReminderAlertStyle;
  onChange: (value: ReminderAlertStyle) => Promise<void>;
};

const ALERT_STYLE_OPTIONS: {
  id: ReminderAlertStyle;
  label: string;
  icon: 'volume-high-outline' | 'phone-portrait-outline' | 'notifications-outline';
}[] = [
  { id: 'sound', label: 'Sonido', icon: 'volume-high-outline' },
  { id: 'vibration', label: 'Vibración', icon: 'phone-portrait-outline' },
  { id: 'both', label: 'Ambos', icon: 'notifications-outline' },
];

function ReminderAlertStylePicker({ value, onChange }: ReminderAlertStylePickerProps) {
  return (
    <View className="gap-2 rounded-2xl border border-border bg-surface p-4 dark:border-border-dark dark:bg-surface-dark">
      <Text className="text-sm font-semibold text-foreground dark:text-foreground-dark">
        Estilo de alerta
      </Text>
      <Text className="text-xs leading-5 text-subtle dark:text-subtle-dark">
        Cómo quieres que te avise el celular cuando llegue un recordatorio.
      </Text>
      <View className="mt-1 flex-row gap-2">
        {ALERT_STYLE_OPTIONS.map((option) => {
          const selected = value === option.id;
          return (
            <Pressable
              key={option.id}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => void onChange(option.id)}
              className={`flex-1 items-center gap-1.5 rounded-2xl border px-2 py-3 active:opacity-80 ${
                selected
                  ? 'border-brand bg-surface-soft dark:border-brand-dark dark:bg-surface-soft-dark'
                  : 'border-border bg-canvas dark:border-border-dark dark:bg-canvas-dark'
              }`}>
              <Ionicons
                name={option.icon}
                size={18}
                color={selected ? '#7C3AED' : '#6B6475'}
              />
              <Text
                className={`text-xs font-medium ${
                  selected
                    ? 'text-brand dark:text-brand-dark'
                    : 'text-foreground dark:text-foreground-dark'
                }`}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

type ReminderAlertSoundPickerProps = {
  value: ReminderAlertSoundId;
  enabled: boolean;
  onChange: (value: ReminderAlertSoundId) => Promise<void>;
};

function ReminderAlertSoundPicker({ value, enabled, onChange }: ReminderAlertSoundPickerProps) {
  const [customLabel, setCustomLabel] = useState<string | null>(null);
  const [systemLabel, setSystemLabel] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void (async () => {
      const { getAlertSoundDisplayLabel } = await import('@/services/reminders/alert-sound-uri');
      setCustomLabel(await getAlertSoundDisplayLabel('custom'));
      setSystemLabel(await getAlertSoundDisplayLabel('system'));
    })();
  }, [value]);

  if (!enabled) return null;

  async function selectPreset(id: ReminderAlertSoundId) {
    await onChange(id);
  }

  async function resetSystemToDefault() {
    setBusy(true);
    try {
      const { clearSystemAlertSoundOverride } = await import('@/services/reminders/alert-sound-uri');
      await clearSystemAlertSoundOverride();
      setSystemLabel(null);
      await onChange('system');
    } finally {
      setBusy(false);
    }
  }

  async function selectCustomFile() {
    setBusy(true);
    try {
      const { pickCustomAlertSoundFile } = await import('@/services/reminders/pick-alert-sound');
      const picked = await pickCustomAlertSoundFile();
      if (!picked) return;
      setCustomLabel(picked.name);
      await onChange('custom');
    } finally {
      setBusy(false);
    }
  }

  async function pickSystemTone() {
    setBusy(true);
    try {
      const { canUseSystemRingtonePicker } = await import('@/services/reminders/alert-sound-uri');
      if (!canUseSystemRingtonePicker()) {
        showAppAlert(
          'Build nativo requerido',
          'Elegir un tono del sistema solo está disponible en la APK / dev client, no en Expo Go.',
        );
        return;
      }
      const { pickSystemRingtone } = await import('@/services/reminders/pick-alert-sound');
      const picked = await pickSystemRingtone();
      if (!picked) return;
      setSystemLabel(picked.name);
      await onChange('system');
    } finally {
      setBusy(false);
    }
  }

  return (
    <View className="gap-2 rounded-2xl border border-border bg-surface p-4 dark:border-border-dark dark:bg-surface-dark">
      <Text className="text-sm font-semibold text-foreground dark:text-foreground-dark">
        Tono de alerta
      </Text>
      <Text className="text-xs leading-5 text-subtle dark:text-subtle-dark">
        Sistema usa el tono de notificación del celular (puedes elegir otro tono del SO). Kivo es el
        tono de la app; Archivo es un audio tuyo.
      </Text>
      <View className="mt-1 gap-2" style={{ opacity: busy ? 0.6 : 1 }}>
        {ALERT_SOUND_PRESETS.map((option) => {
          const selected = value === option.id;
          const systemSubtitle =
            option.id === 'system'
              ? (systemLabel ?? 'Tono de notificación del sistema operativo')
              : option.description;
          return (
            <View key={option.id} className="gap-2">
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected }}
                disabled={busy}
                onPress={() => void selectPreset(option.id)}
                className={`flex-row items-center gap-3 rounded-2xl border px-3 py-3 active:opacity-85 ${
                  selected
                    ? 'border-brand bg-surface-soft dark:border-brand-dark dark:bg-surface-soft-dark'
                    : 'border-border bg-canvas dark:border-border-dark dark:bg-canvas-dark'
                }`}>
                <View className="h-9 w-9 items-center justify-center rounded-xl bg-muted dark:bg-muted-dark">
                  <Ionicons
                    name={option.id === 'system' ? 'phone-portrait-outline' : 'musical-notes-outline'}
                    size={18}
                    color={selected ? '#7C3AED' : '#6B6475'}
                  />
                </View>
                <View className="flex-1 gap-0.5">
                  <Text
                    className={`text-sm font-semibold ${
                      selected
                        ? 'text-brand dark:text-brand-dark'
                        : 'text-foreground dark:text-foreground-dark'
                    }`}>
                    {option.label}
                  </Text>
                  <Text className="text-xs text-subtle dark:text-subtle-dark">{systemSubtitle}</Text>
                </View>
                {selected ? <Ionicons name="checkmark-circle" size={20} color="#7C3AED" /> : null}
              </Pressable>
              {option.id === 'system' && selected ? (
                <View className="ml-12 gap-2">
                  <Pressable
                    accessibilityRole="button"
                    disabled={busy}
                    onPress={() => void pickSystemTone()}
                    className="flex-row items-center gap-2 rounded-xl border border-border px-3 py-2 active:opacity-85 dark:border-border-dark">
                    <Ionicons name="notifications-outline" size={16} color="#7C3AED" />
                    <Text className="flex-1 text-xs font-medium text-brand dark:text-brand-dark">
                      Elegir tono del sistema…
                    </Text>
                  </Pressable>
                  {systemLabel ? (
                    <Pressable
                      accessibilityRole="button"
                      disabled={busy}
                      onPress={() => void resetSystemToDefault()}
                      className="flex-row items-center gap-2 px-1 py-1 active:opacity-85">
                      <Text className="text-xs text-subtle dark:text-subtle-dark">
                        Usar tono predeterminado del SO
                      </Text>
                    </Pressable>
                  ) : null}
                </View>
              ) : null}
            </View>
          );
        })}

        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: value === 'custom' }}
          disabled={busy}
          onPress={() => void selectCustomFile()}
          className={`flex-row items-center gap-3 rounded-2xl border px-3 py-3 active:opacity-85 ${
            value === 'custom'
              ? 'border-brand bg-surface-soft dark:border-brand-dark dark:bg-surface-soft-dark'
              : 'border-border bg-canvas dark:border-border-dark dark:bg-canvas-dark'
          }`}>
          <View className="h-9 w-9 items-center justify-center rounded-xl bg-muted dark:bg-muted-dark">
            <Ionicons
              name="folder-open-outline"
              size={18}
              color={value === 'custom' ? '#7C3AED' : '#6B6475'}
            />
          </View>
          <View className="flex-1 gap-0.5">
            <Text
              className={`text-sm font-semibold ${
                value === 'custom'
                  ? 'text-brand dark:text-brand-dark'
                  : 'text-foreground dark:text-foreground-dark'
              }`}>
              Archivo…
            </Text>
            <Text className="text-xs text-subtle dark:text-subtle-dark">
              {customLabel ?? 'Elige un audio de tu almacenamiento'}
            </Text>
          </View>
          {value === 'custom' ? (
            <Ionicons name="checkmark-circle" size={20} color="#7C3AED" />
          ) : null}
        </Pressable>
      </View>
    </View>
  );
}

type ReminderAlertVibrationPickerProps = {
  value: ReminderAlertVibrationId;
  enabled: boolean;
  onChange: (value: ReminderAlertVibrationId) => Promise<void>;
};

function ReminderAlertVibrationPicker({
  value,
  enabled,
  onChange,
}: ReminderAlertVibrationPickerProps) {
  if (!enabled) return null;

  return (
    <View className="gap-2 rounded-2xl border border-border bg-surface p-4 dark:border-border-dark dark:bg-surface-dark">
      <Text className="text-sm font-semibold text-foreground dark:text-foreground-dark">
        Patrón de vibración
      </Text>
      <Text className="text-xs leading-5 text-subtle dark:text-subtle-dark">
        Ritmos claramente distintos: un toque, doble pulso o patrón de alarma.
      </Text>
      <View className="mt-1 gap-2">
        {ALERT_VIBRATION_PRESETS.map((option) => {
          const selected = value === option.id;
          return (
            <Pressable
              key={option.id}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => void onChange(option.id)}
              className={`flex-row items-center gap-3 rounded-2xl border px-3 py-3 active:opacity-85 ${
                selected
                  ? 'border-brand bg-surface-soft dark:border-brand-dark dark:bg-surface-soft-dark'
                  : 'border-border bg-canvas dark:border-border-dark dark:bg-canvas-dark'
              }`}>
              <View className="h-9 w-9 items-center justify-center rounded-xl bg-muted dark:bg-muted-dark">
                <Ionicons
                  name="pulse-outline"
                  size={18}
                  color={selected ? '#7C3AED' : '#6B6475'}
                />
              </View>
              <View className="flex-1 gap-0.5">
                <Text
                  className={`text-sm font-semibold ${
                    selected
                      ? 'text-brand dark:text-brand-dark'
                      : 'text-foreground dark:text-foreground-dark'
                  }`}>
                  {option.label}
                </Text>
                <Text className="text-xs text-subtle dark:text-subtle-dark">{option.description}</Text>
              </View>
              {selected ? <Ionicons name="checkmark-circle" size={20} color="#7C3AED" /> : null}
            </Pressable>
          );
        })}
      </View>
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

