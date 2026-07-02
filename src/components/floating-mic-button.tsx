import Ionicons from '@react-native-vector-icons/ionicons';
import { useSegments } from 'expo-router';
import { Pressable, View } from 'react-native';
import { useBottomInset } from '@/components/screen-safe-area';

import { useVoiceCapture } from '@/context/voice-capture-context';

function isHomeScreen(segments: string[]): boolean {
  const last = segments[segments.length - 1];
  return last === 'index' || (segments.length === 1 && segments[0] === '(main)');
}

export function FloatingMicButton() {
  const bottomOffset = useBottomInset(24);
  const segments = useSegments();
  const { openCapture } = useVoiceCapture();

  if (isHomeScreen(segments as string[])) {
    return null;
  }

  return (
    <View
      className="absolute right-5 z-50"
      style={{ bottom: bottomOffset }}
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
