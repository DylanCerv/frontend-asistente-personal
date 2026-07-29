import Ionicons from '@react-native-vector-icons/ionicons';
import { Modal, Platform, Pressable, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { KivoLogo } from '@/components/kivo-logo';
import { APP_ACCENT } from '@/constants/app-colors';

type WidgetSetupSheetProps = {
  visible: boolean;
  onClose: () => void;
};

const WIDGET_NAMES = [
  'Agenda de hoy',
  'Prioridad actual',
  'Quick Capture',
  'Focus Points',
] as const;

const ANDROID_STEPS = [
  'Activa los widgets con el interruptor de Accesos rápidos.',
  'Mantén presionado un espacio vacío en tu pantalla de inicio.',
  'Toca "Widgets" y busca "Kivo".',
  'Elige Agenda de hoy, Prioridad actual, Quick Capture o Focus Points.',
  'Arrástralos donde quieras — todos usan el estilo oscuro de Kivo.',
] as const;

const IOS_STEPS = [
  'Activa los widgets con el interruptor de Accesos rápidos.',
  'Mantén presionado cualquier área vacía de la pantalla de inicio.',
  'Toca el botón "+" (esquina superior izquierda).',
  'Busca "Kivo" y elige el widget que quieras (Agenda, Prioridad, Capture o Focus Points).',
  'Selecciona el tamaño y toca "Agregar widget".',
] as const;

export function WidgetSetupSheet({ visible, onClose }: WidgetSetupSheetProps) {
  const isAndroid = Platform.OS === 'android';
  const steps = isAndroid ? ANDROID_STEPS : IOS_STEPS;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/45">
        <View className="gap-6 rounded-t-[32px] bg-canvas px-6 pb-10 pt-8 dark:bg-canvas-dark">
          <View className="items-center gap-3">
            <View className="rounded-[22px] bg-surface p-2 shadow-sm dark:bg-surface-dark">
              <KivoLogo size={48} />
            </View>
            <Text className="text-center text-xl font-bold text-foreground dark:text-foreground-dark">
              Widgets de Kivo
            </Text>
            <Text className="text-center text-sm leading-6 text-subtle dark:text-subtle-dark">
              Cuatro widgets en modo oscuro para tu pantalla de inicio: agenda, prioridad, captura
              rápida y focus points.
            </Text>
          </View>

          <View className="flex-row flex-wrap gap-2">
            {WIDGET_NAMES.map((name) => (
              <View
                key={name}
                className="rounded-full border border-border px-3 py-1.5 dark:border-border-dark">
                <Text className="text-xs font-semibold text-foreground dark:text-foreground-dark">
                  {name}
                </Text>
              </View>
            ))}
          </View>

          <View className="gap-3 rounded-2xl border border-border bg-surface p-4 dark:border-border-dark dark:bg-surface-dark">
            {steps.map((step, index) => (
              <View key={step} className="flex-row gap-3">
                <View className="h-6 w-6 items-center justify-center rounded-full bg-brand dark:bg-brand-dark">
                  <Text className="text-[11px] font-bold text-white">{index + 1}</Text>
                </View>
                <Text className="flex-1 text-sm leading-6 text-foreground dark:text-foreground-dark">
                  {step}
                </Text>
              </View>
            ))}
          </View>

          <View className="flex-row items-center gap-2 rounded-2xl bg-surface-soft px-4 py-3 dark:bg-surface-soft-dark">
            <Ionicons name="information-circle-outline" size={18} color={APP_ACCENT} />
            <Text className="flex-1 text-xs leading-5 text-subtle dark:text-subtle-dark">
              El sistema no permite agregar widgets automáticamente. Debes hacerlo manualmente una
              vez. Requiere un build nativo de Kivo (no Expo Go).
            </Text>
          </View>

          <Button label="Entendido" onPress={onClose} />
          <Pressable accessibilityRole="button" onPress={onClose} className="items-center py-1">
            <Text className="text-sm text-subtle dark:text-subtle-dark">Configurar después</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
