import Ionicons from '@react-native-vector-icons/ionicons';
import { useSegments } from 'expo-router';
import { Pressable, View } from 'react-native';

import { useBottomInset } from '@/components/screen-safe-area';
import { APP_ACCENT, APP_ON_ACCENT } from '@/constants/app-colors';
import { useVoiceCapture } from '@/context/voice-capture-context';

function shouldHideFloatingMic(segments: string[]): boolean {
  const last = segments[segments.length - 1];
  // Hide on Assistant (has its own capture UI). Show on Focus, Tareas, Perfil, etc.
  return last === 'assistant';
}

export function FloatingMicButton() {
  const bottomOffset = useBottomInset(76);
  const segments = useSegments();
  const { isOpen, openCapture } = useVoiceCapture();

  if (shouldHideFloatingMic(segments as string[]) || isOpen) {
    return null;
  }

  return (
    <View
      className="absolute right-5 z-50"
      style={{ bottom: bottomOffset }}
      pointerEvents="box-none">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Grabar audio"
        onPress={() => openCapture({ autoStart: true })}
        className="h-16 w-16 items-center justify-center rounded-full active:opacity-85"
        style={{
          backgroundColor: APP_ACCENT,
          shadowColor: APP_ACCENT,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.45,
          shadowRadius: 12,
          elevation: 10,
        }}>
        <Ionicons name="mic" size={28} color={APP_ON_ACCENT} />
      </Pressable>
    </View>
  );
}
