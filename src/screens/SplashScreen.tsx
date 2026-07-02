import Ionicons from '@react-native-vector-icons/ionicons';
import { Text, View } from 'react-native';
import { ScreenSafeArea } from '@/components/screen-safe-area';

export function SplashScreen() {
  return (
    <ScreenSafeArea>
      <View className="flex-1 items-center justify-center gap-10 px-6">
        <View className="items-center gap-5">
          <View className="h-24 w-24 items-center justify-center rounded-[28px] bg-brand dark:bg-brand-dark">
            <Ionicons name="sparkles" size={48} color="#FFFFFF" />
          </View>
          <View className="items-center gap-2">
            <Text className="text-[36px] font-bold tracking-tight text-foreground dark:text-foreground-dark">
              Asistente
            </Text>
            <Text className="text-center text-lg font-medium text-brand dark:text-brand-dark">
              Habla. Nosotros organizamos.
            </Text>
          </View>
        </View>
      </View>
    </ScreenSafeArea>
  );
}
