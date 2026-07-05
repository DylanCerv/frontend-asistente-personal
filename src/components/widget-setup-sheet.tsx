import Ionicons from '@react-native-vector-icons/ionicons';
import { Modal, Platform, Pressable, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { KivoLogo } from '@/components/kivo-logo';

type WidgetSetupSheetProps = {
  visible: boolean;
  onClose: () => void;
};

const ANDROID_STEPS = [
  'Mantén presionado un espacio vacío en tu pantalla de inicio.',
  'Toca "Widgets" y busca "Kivo".',
  'Elige "Agenda de hoy" y arrástralo donde quieras.',
  'Listo — verás tus tareas y reuniones del día.',
] as const;

const IOS_STEPS = [
  'Mantén presionado cualquier área vacía de la pantalla de inicio.',
  'Toca el botón "+" (esquina superior izquierda).',
  'Busca "Kivo" y elige "Agenda de hoy".',
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
              Agrega el widget de hoy
            </Text>
            <Text className="text-center text-sm leading-6 text-subtle dark:text-subtle-dark">
              Mira tu agenda del día sin abrir Kivo. Los títulos serán visibles en tu pantalla de
              inicio.
            </Text>
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
            <Ionicons name="information-circle-outline" size={18} color="#7C3AED" />
            <Text className="flex-1 text-xs leading-5 text-subtle dark:text-subtle-dark">
              El sistema no permite agregar widgets automáticamente. Debes hacerlo manualmente una
              vez.
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
