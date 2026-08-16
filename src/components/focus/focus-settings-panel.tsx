import Ionicons from '@react-native-vector-icons/ionicons';
import { useCallback, useEffect, useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';

import { useUserPreferences } from '@/context/user-preferences-context';
import {
  FOCUS_LOCK_INTENSITY_OPTIONS,
  getFocusLockIntensityDescription,
  getFocusLockIntensityLabel,
  type FocusLockIntensity,
} from '@/services/focus/focus-lock-intensity';
import {
  ensureFocusPermissions,
  getFocusPermissionStatus,
  type FocusPermissionStatus,
} from '@/services/focus/focus-permissions';
import { showAppAlert } from '@/services/app-dialog';

const INTENSITY_META: Record<
  FocusLockIntensity,
  { icon: 'shield-checkmark-outline' | 'lock-closed-outline' }
> = {
  standard: { icon: 'shield-checkmark-outline' },
  strict: { icon: 'lock-closed-outline' },
};

function PermissionRow({
  label,
  granted,
  available,
}: {
  label: string;
  granted: boolean;
  available: boolean;
}) {
  if (!available) {
    return (
      <View className="flex-row items-center justify-between py-1.5">
        <Text className="text-xs text-subtle dark:text-subtle-dark">{label}</Text>
        <Text className="text-xs text-subtle dark:text-subtle-dark">No aplica</Text>
      </View>
    );
  }

  return (
    <View className="flex-row items-center justify-between py-1.5">
      <Text className="text-xs text-subtle dark:text-subtle-dark">{label}</Text>
      <Text
        className={`text-xs font-semibold ${
          granted ? 'text-brand dark:text-brand-dark' : 'text-danger'
        }`}>
        {granted ? 'Concedido' : 'Faltante'}
      </Text>
    </View>
  );
}

export function FocusSettingsPanel() {
  const { focusLockIntensity, setFocusLockIntensity } = useUserPreferences();
  const [status, setStatus] = useState<FocusPermissionStatus | null>(null);
  const [isRequesting, setIsRequesting] = useState(false);

  const refreshStatus = useCallback(async () => {
    const next = await getFocusPermissionStatus(focusLockIntensity);
    setStatus(next);
  }, [focusLockIntensity]);

  useEffect(() => {
    void refreshStatus();
  }, [refreshStatus]);

  async function handleIntensityChange(value: FocusLockIntensity) {
    await setFocusLockIntensity(value);
  }

  async function handleGrantPermissions() {
    setIsRequesting(true);
    try {
      const result = await ensureFocusPermissions(focusLockIntensity, { openSettings: true });
      setStatus(result.status);
      if (!result.ok) {
        showAppAlert(
          'Permisos incompletos',
          Platform.OS === 'android'
            ? 'Concede No Molestar' +
                (focusLockIntensity === 'strict' ? ' y dibujar sobre otras apps' : '') +
                ' en Ajustes del sistema para usar este modo al máximo.'
            : 'En iOS el bloqueo de sistema es limitado. La sesión Focus funciona dentro de Kivo.',
        );
      }
    } finally {
      setIsRequesting(false);
    }
  }

  return (
    <View className="gap-5">
      <View className="gap-2 rounded-2xl border border-border bg-surface p-4 dark:border-border-dark dark:bg-surface-dark">
        <Text className="text-sm font-semibold text-foreground dark:text-foreground-dark">
          Intensidad de Focus
        </Text>
        <Text className="text-xs leading-5 text-subtle dark:text-subtle-dark">
          Elige cómo de estricto será el bloqueo cuando inicies una sesión desde la pestaña Focus.
        </Text>
        <View className="mt-1 flex-row gap-2">
          {FOCUS_LOCK_INTENSITY_OPTIONS.map((option) => {
            const selected = focusLockIntensity === option;
            return (
              <Pressable
                key={option}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => void handleIntensityChange(option)}
                className={`flex-1 items-center gap-1.5 rounded-2xl border px-2 py-3 active:opacity-80 ${
                  selected
                    ? 'border-brand bg-surface-soft dark:border-brand-dark dark:bg-surface-soft-dark'
                    : 'border-border bg-canvas dark:border-border-dark dark:bg-canvas-dark'
                }`}>
                <Ionicons
                  name={INTENSITY_META[option].icon}
                  size={18}
                  color={selected ? '#7C3AED' : '#6B6475'}
                />
                <Text
                  className={`text-xs font-medium ${
                    selected
                      ? 'text-brand dark:text-brand-dark'
                      : 'text-foreground dark:text-foreground-dark'
                  }`}>
                  {getFocusLockIntensityLabel(option)}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Text className="text-xs leading-5 text-subtle dark:text-subtle-dark">
          {getFocusLockIntensityDescription(focusLockIntensity)}
        </Text>
      </View>

      <View className="gap-2 rounded-2xl border border-border bg-surface p-4 dark:border-border-dark dark:bg-surface-dark">
        <Text className="text-sm font-semibold text-foreground dark:text-foreground-dark">
          Permisos del dispositivo
        </Text>
        <PermissionRow
          label="Notificaciones"
          granted={status?.notifications ?? false}
          available
        />
        <PermissionRow
          label="Modo No Molestar"
          granted={status?.dnd ?? false}
          available={status?.dndAvailable ?? Platform.OS === 'android'}
        />
        {focusLockIntensity === 'strict' ? (
          <PermissionRow
            label="Overlay sobre otras apps"
            granted={status?.overlay ?? false}
            available={status?.overlayAvailable ?? Platform.OS === 'android'}
          />
        ) : null}

        <Pressable
          accessibilityRole="button"
          disabled={isRequesting}
          onPress={() => void handleGrantPermissions()}
          className="mt-2 min-h-[48px] items-center justify-center rounded-2xl bg-brand active:opacity-90"
          style={{ opacity: isRequesting ? 0.6 : 1 }}>
          <Text className="text-sm font-semibold text-white">
            {isRequesting ? 'Abriendo…' : 'Conceder permisos'}
          </Text>
        </Pressable>
      </View>

      <View className="rounded-2xl bg-canvas p-4 dark:bg-canvas-dark">
        <Text className="text-xs leading-5 text-subtle dark:text-subtle-dark">
          {Platform.OS === 'ios'
            ? 'En iOS no se puede activar No Molestar ni overlay desde la app. La sesión Focus sigue disponible dentro de Kivo con temporizador y controles.'
            : 'Estos permisos aplican en Android. Si falta el overlay en modo Estricto, la sesión bajará a Estándar automáticamente.'}
        </Text>
      </View>
    </View>
  );
}
