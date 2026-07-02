import Ionicons from '@react-native-vector-icons/ionicons';
import { Text, View } from 'react-native';

export function AuthWelcomeHero() {
  return (
    <View className="items-center gap-4">
      <View className="h-20 w-20 items-center justify-center rounded-[28px] bg-brand dark:bg-brand-dark">
        <Ionicons name="sparkles" size={40} color="#FFFFFF" />
      </View>
      <View className="items-center gap-2">
        <Text className="text-center text-[30px] font-bold tracking-tight text-foreground dark:text-foreground-dark">
          Asistente
        </Text>
        <Text className="text-center text-base font-medium text-brand dark:text-brand-dark">
          Habla. Nosotros organizamos.
        </Text>
        <Text className="max-w-xs text-center text-sm leading-6 text-subtle dark:text-subtle-dark">
          Tu asistente personal con IA. No organizas tu vida, solo hablas.
        </Text>
      </View>
    </View>
  );
}
