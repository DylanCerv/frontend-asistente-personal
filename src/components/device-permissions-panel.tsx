import Ionicons from '@react-native-vector-icons/ionicons';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Platform, Pressable, Text, View } from 'react-native';

import {
  APP_ACCENT,
  APP_BORDER,
  APP_SURFACE,
  APP_TEXT_MUTED,
} from '@/constants/app-colors';
import { useUserPreferences } from '@/context/user-preferences-context';
import { showAppAlert } from '@/services/app-dialog';
import {
  checkCalendarPermissionResult,
  requestCalendarPermissionResult,
} from '@/services/calendar/device-calendar';
import {
  canDrawOverlays,
  hasNotificationPolicyAccess,
  openNotificationPolicySettings,
  openOverlaySettings,
} from '@/services/focus/focus-native';
import {
  canUseFocusNativeFeatures,
  openAppNotificationSettings,
} from '@/services/focus/focus-permissions';
import {
  permissionStatusLabel,
  permissionUnavailableMessage,
  type PermissionResult,
  type PermissionStatus,
} from '@/services/permissions/permission-result';
import { showPermissionResultAlert } from '@/services/permissions/show-permission-alert';
import {
  checkExactAlarmPermissionResult,
  openFullScreenIntentSettings,
} from '@/services/reminders/critical-alarm-notifications';
import {
  canScheduleLocalNotifications,
  checkNotificationPermissionResult,
  requestNotificationPermissionResult,
} from '@/services/reminders/reminder-notifications';

type DevicePermissionsPanelProps = {
  onOpenWidgetSetup?: () => void;
};

type PermissionRowState = {
  id: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  description: string;
  status: PermissionStatus;
  reason?: PermissionResult['reason'];
  actionLabel?: string;
  onAction?: () => void | Promise<void>;
  androidOnly?: boolean;
};

const STATUS_COLOR: Record<PermissionStatus, string> = {
  granted: '#2DD4BF',
  denied: '#FF7A5C',
  unavailable: APP_TEXT_MUTED,
};

export function DevicePermissionsPanel({ onOpenWidgetSetup }: DevicePermissionsPanelProps) {
  const { homeWidgetEnabled, setDeviceCalendarSyncEnabled, setPushNotifications } =
    useUserPreferences();
  const [rows, setRows] = useState<PermissionRowState[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const onOpenWidgetSetupRef = useRef(onOpenWidgetSetup);
  const refreshRef = useRef<() => Promise<void>>(async () => undefined);

  useEffect(() => {
    onOpenWidgetSetupRef.current = onOpenWidgetSetup;
  }, [onOpenWidgetSetup]);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const notifications = await checkNotificationPermissionResult();
      const calendar = await checkCalendarPermissionResult();
      const exactAlarm =
        Platform.OS === 'android'
          ? await checkExactAlarmPermissionResult()
          : ({ status: 'unavailable' as const, reason: 'unsupported_platform' as const });

      let dndStatus: PermissionStatus = 'unavailable';
      let overlayStatus: PermissionStatus = 'unavailable';
      const focusNative = canUseFocusNativeFeatures();

      if (focusNative) {
        dndStatus = (await hasNotificationPolicyAccess()) ? 'granted' : 'denied';
        overlayStatus = (await canDrawOverlays()) ? 'granted' : 'denied';
      }

      const widgetsAvailable = canScheduleLocalNotifications();
      const widgetsStatus: PermissionStatus = !widgetsAvailable
        ? 'unavailable'
        : homeWidgetEnabled
          ? 'granted'
          : 'denied';

      const next: PermissionRowState[] = [
        {
          id: 'notifications',
          icon: 'notifications-outline',
          label: 'Notificaciones del sistema',
          description: 'Alertas y recordatorios locales',
          status: notifications.status,
          reason: notifications.reason,
          actionLabel: notifications.status === 'denied' ? 'Permitir' : undefined,
          onAction:
            notifications.status === 'denied'
              ? async () => {
                  const result = await requestNotificationPermissionResult();
                  if (result.status === 'granted') {
                    await setPushNotifications(true);
                  } else {
                    showPermissionResultAlert(result, {
                      deniedMessage:
                        'Sin acceso a notificaciones, Kivo no puede enviarte alertas. Actívalas en la configuración del sistema.',
                    });
                  }
                  await refreshRef.current();
                }
              : undefined,
        },
        {
          id: 'exact-alarms',
          icon: 'alarm-outline',
          label: 'Alarmas exactas',
          description: 'Pantalla completa a la hora programada',
          status: exactAlarm.status,
          reason: exactAlarm.reason,
          androidOnly: true,
          actionLabel: exactAlarm.status === 'denied' ? 'Abrir ajustes' : undefined,
          onAction:
            exactAlarm.status === 'denied'
              ? async () => {
                  await openFullScreenIntentSettings();
                }
              : undefined,
        },
        {
          id: 'calendar',
          icon: 'calendar-outline',
          label: 'Calendario del dispositivo',
          description: 'Importa reuniones con hora (solo lectura) a Agenda y Focus',
          status: calendar.status,
          reason: calendar.reason,
          actionLabel: calendar.status === 'denied' ? 'Permitir' : undefined,
          onAction:
            calendar.status === 'denied'
              ? async () => {
                  const result = await requestCalendarPermissionResult();
                  if (result.status === 'granted') {
                    await setDeviceCalendarSyncEnabled(true);
                  } else {
                    showPermissionResultAlert(result, {
                      deniedTitle: 'Permiso requerido',
                      deniedMessage:
                        'Sin acceso al calendario, Kivo no puede importar tus reuniones.',
                      onOpenSettings: openAppNotificationSettings,
                    });
                  }
                  await refreshRef.current();
                }
              : undefined,
        },
      ];

      if (Platform.OS === 'android') {
        next.push(
          {
            id: 'dnd',
            icon: 'moon-outline',
            label: 'No molestar (Focus)',
            description: 'Silenciar interrupciones en modo Focus',
            status: focusNative ? dndStatus : 'unavailable',
            reason: focusNative ? undefined : notifications.reason,
            actionLabel: dndStatus === 'denied' ? 'Abrir ajustes' : undefined,
            onAction:
              dndStatus === 'denied'
                ? async () => {
                    await openNotificationPolicySettings();
                    await refreshRef.current();
                  }
                : undefined,
          },
          {
            id: 'overlay',
            icon: 'layers-outline',
            label: 'Mostrar sobre otras apps',
            description: 'Bloqueo visual estricto de Focus',
            status: focusNative ? overlayStatus : 'unavailable',
            reason: focusNative ? undefined : notifications.reason,
            actionLabel: overlayStatus === 'denied' ? 'Abrir ajustes' : undefined,
            onAction:
              overlayStatus === 'denied'
                ? async () => {
                    await openOverlaySettings();
                    await refreshRef.current();
                  }
                : undefined,
          },
        );
      }

      next.push({
        id: 'widgets',
        icon: 'grid-outline',
        label: 'Widgets de inicio',
        description: widgetsAvailable
          ? 'Agenda, No olvides de y captura rápida'
          : permissionUnavailableMessage(notifications.reason ?? 'expo_go'),
        status: widgetsStatus,
        reason: widgetsAvailable ? undefined : notifications.reason,
        actionLabel: widgetsAvailable ? 'Cómo añadir' : undefined,
        onAction: widgetsAvailable
          ? () => {
              onOpenWidgetSetupRef.current?.();
            }
          : undefined,
      });

      setRows(next.filter((row) => !(row.androidOnly && Platform.OS !== 'android')));
    } finally {
      setIsRefreshing(false);
    }
  }, [homeWidgetEnabled, setDeviceCalendarSyncEnabled, setPushNotifications]);

  useEffect(() => {
    refreshRef.current = refresh;
  }, [refresh]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        void refreshRef.current();
      }
    });
    return () => subscription.remove();
  }, []);

  const nativeAvailable = canScheduleLocalNotifications();

  return (
    <View className="gap-3">
      {!nativeAvailable ? (
        <View
          className="rounded-2xl border px-4 py-3"
          style={{ backgroundColor: APP_SURFACE, borderColor: APP_BORDER }}>
          <Text className="text-[13px] font-semibold" style={{ color: APP_ACCENT }}>
            No disponible aquí
          </Text>
          <Text className="mt-1 text-xs leading-5" style={{ color: APP_TEXT_MUTED }}>
            Notificaciones, alarmas, calendario y widgets funcionan en la app Kivo instalada en el
            teléfono.
          </Text>
        </View>
      ) : null}

      <View className="flex-row items-center justify-between px-1">
        <Text
          className="text-[11px] font-bold uppercase tracking-[1.2px]"
          style={{ color: APP_ACCENT }}>
          Estado de permisos
        </Text>
        <Pressable
          accessibilityRole="button"
          disabled={isRefreshing}
          onPress={() => void refresh()}
          className="active:opacity-70">
          <Text className="text-xs font-semibold" style={{ color: APP_ACCENT }}>
            {isRefreshing ? 'Actualizando…' : 'Actualizar'}
          </Text>
        </Pressable>
      </View>

      {rows.map((row) => (
        <PermissionStatusRow
          key={row.id}
          row={row}
          onExplainUnavailable={() => {
            showAppAlert('No disponible', permissionUnavailableMessage(row.reason));
          }}
        />
      ))}
    </View>
  );
}

function PermissionStatusRow({
  row,
  onExplainUnavailable,
}: {
  row: PermissionRowState;
  onExplainUnavailable: () => void;
}) {
  return (
    <View
      className="flex-row items-center gap-3 rounded-2xl border px-4 py-3.5"
      style={{
        backgroundColor: APP_SURFACE,
        borderColor: APP_BORDER,
      }}>
      <Ionicons name={row.icon} size={20} color={APP_ACCENT} />
      <View className="flex-1 gap-0.5">
        <Text className="text-[14px] font-medium text-white">{row.label}</Text>
        <Text className="text-xs leading-4" style={{ color: APP_TEXT_MUTED }}>
          {row.description}
        </Text>
        <Text
          className="mt-1 text-[11px] font-semibold uppercase tracking-[0.8px]"
          style={{ color: STATUS_COLOR[row.status] }}>
          {permissionStatusLabel(row.status)}
        </Text>
      </View>
      {row.actionLabel && row.onAction ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => void row.onAction?.()}
          className="rounded-xl px-3 py-2 active:opacity-80"
          style={{ backgroundColor: 'rgba(45, 212, 191, 0.15)' }}>
          <Text className="text-xs font-semibold" style={{ color: APP_ACCENT }}>
            {row.actionLabel}
          </Text>
        </Pressable>
      ) : row.status === 'unavailable' ? (
        <Pressable
          accessibilityRole="button"
          onPress={onExplainUnavailable}
          className="active:opacity-70">
          <Ionicons name="information-circle-outline" size={20} color={APP_TEXT_MUTED} />
        </Pressable>
      ) : (
        <Ionicons name="checkmark-circle" size={20} color={STATUS_COLOR.granted} />
      )}
    </View>
  );
}
