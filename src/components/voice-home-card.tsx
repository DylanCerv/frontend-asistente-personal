import Ionicons from '@react-native-vector-icons/ionicons';
import { Pressable, Text, View } from 'react-native';

import { useVoiceCapture } from '@/context/voice-capture-context';

export function VoiceHomeCard() {
  const { openCapture } = useVoiceCapture();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => openCapture({ autoStart: true })}
      className="gap-4 rounded-[32px] border border-brand/20 bg-brand p-6 active:opacity-90 dark:border-brand-dark/30 dark:bg-brand-dark">
      <View className="flex-row items-center gap-4">
        <View className="h-16 w-16 items-center justify-center rounded-full bg-white/20">
          <Ionicons name="mic" size={32} color="#FFFFFF" />
        </View>
        <View className="flex-1 gap-1">
          <Text className="text-xl font-bold text-white">¿Qué necesitas recordar?</Text>
          <Text className="text-sm text-white/80">Toca para hablar. La IA hace el resto.</Text>
        </View>
      </View>
    </Pressable>
  );
}
