import { showAppAlert } from '@/services/app-dialog';
import { openAppNotificationSettings } from '@/services/focus/focus-permissions';
import {
  permissionUnavailableMessage,
  type PermissionResult,
} from '@/services/permissions/permission-result';

type PermissionAlertOptions = {
  deniedTitle?: string;
  deniedMessage?: string;
  unavailableTitle?: string;
  onOpenSettings?: () => void | Promise<void>;
};

export function showPermissionResultAlert(
  result: PermissionResult,
  options: PermissionAlertOptions = {},
): void {
  if (result.status === 'granted') return;

  if (result.status === 'unavailable') {
    showAppAlert(
      options.unavailableTitle ?? 'No disponible',
      permissionUnavailableMessage(result.reason),
    );
    return;
  }

  const openSettings = options.onOpenSettings ?? openAppNotificationSettings;
  showAppAlert(
    options.deniedTitle ?? 'Permiso requerido',
    options.deniedMessage ??
      'Activa este permiso en la configuración del sistema para usar la función.',
    [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Abrir ajustes',
        onPress: () => {
          void openSettings();
        },
      },
    ],
  );
}
