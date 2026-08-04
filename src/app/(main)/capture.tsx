import { ScreenSafeArea } from '@/components/screen-safe-area';
import { useEffect } from 'react';
import { View } from 'react-native';

import { useVoiceCapture } from '@/context/voice-capture-context';

export default function CaptureScreen() {
  const { openCapture } = useVoiceCapture();

  useEffect(() => {
    openCapture({ autoStart: true });
  }, [openCapture]);

  return (
    <ScreenSafeArea>
      <View className="flex-1" />
    </ScreenSafeArea>
  );
}
