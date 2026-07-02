import Ionicons from '@react-native-vector-icons/ionicons';
import { ActivityIndicator, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export function SplashScreen() {
  return (
    <SafeAreaView className="flex-1 bg-canvas dark:bg-canvas-dark">
      <View className="flex-1 items-center justify-center gap-8 px-6">
        <View className="items-center gap-4">
          <View className="h-20 w-20 items-center justify-center rounded-3xl bg-muted dark:bg-muted-dark">
            <Ionicons name="sparkles-outline" size={40} color="#7C3AED" />
          </View>
          <Text className="text-[32px] font-bold tracking-tight text-foreground dark:text-foreground-dark">
            Asistente
          </Text>
        </View>

        <View className="items-center gap-3">
          <ActivityIndicator size="large" color="#7C3AED" />
          <Text className="text-sm text-subtle dark:text-subtle-dark">Cargando...</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
