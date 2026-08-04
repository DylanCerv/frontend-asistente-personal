import Ionicons from '@react-native-vector-icons/ionicons';
import { useRouter, useSegments } from 'expo-router';
import { Pressable, View } from 'react-native';

import { useBottomInset } from '@/components/screen-safe-area';
import { APP_ACCENT, APP_ON_ACCENT } from '@/constants/app-colors';

function shouldHideFloatingMic(segments: string[]): boolean {
  const last = segments[segments.length - 1];
  // Hide on Assistant (has its own capture UI). Show on Focus and the rest.
  return last === 'assistant';
}

export function FloatingMicButton() {
  const router = useRouter();
  const bottomOffset = useBottomInset(76);
  const segments = useSegments();

  if (shouldHideFloatingMic(segments as string[])) {
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
        onPress={() =>
          router.push({ pathname: '/assistant', params: { autoRecord: '1' } })
        }
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
