import Ionicons from '@react-native-vector-icons/ionicons';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useVoiceCapture } from '@/context/voice-capture-context';

export function FloatingMicButton() {
  const insets = useSafeAreaInsets();
  const { openCapture } = useVoiceCapture();

  return (
    <View
      className="absolute right-5 z-50"
      style={{ bottom: insets.bottom + 72 }}
      pointerEvents="box-none">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Captura por voz"
        onPress={() => openCapture({ autoStart: true })}
        className="h-16 w-16 items-center justify-center rounded-full bg-brand shadow-lg active:opacity-85 dark:bg-brand-dark"
        style={{
          shadowColor: '#7C3AED',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.35,
          shadowRadius: 8,
          elevation: 8,
        }}>
        <Ionicons name="mic" size={28} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}
