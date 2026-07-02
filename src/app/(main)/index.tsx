import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { VoiceAssistantCard } from '@/components/voice-assistant-card';
import { useAuth } from '@/context/auth-context';

export default function HomeScreen() {
  const { user } = useAuth();

  return (
    <SafeAreaView className="flex-1 bg-canvas dark:bg-canvas-dark">
      <ScrollView contentContainerClassName="w-full max-w-3xl gap-6 self-center px-6 pb-28">
        <View className="gap-1 pt-2">
          <Text className="text-[15px] text-subtle dark:text-subtle-dark">Bienvenido de vuelta</Text>
          <Text className="text-[28px] font-bold text-foreground dark:text-foreground-dark">
            Hola, {user?.name ?? 'Usuario'}
          </Text>
        </View>

        <VoiceAssistantCard />

        <View className="gap-3 rounded-2xl border border-border bg-surface p-6 dark:border-border-dark dark:bg-surface-dark">
          <Text className="text-base font-semibold text-foreground dark:text-foreground-dark">
            Actividad reciente
          </Text>
          <Text className="text-sm leading-5 text-subtle dark:text-subtle-dark">
            Tus notas de voz procesadas aparecerán aquí próximamente.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
