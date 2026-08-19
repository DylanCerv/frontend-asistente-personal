import Ionicons from '@react-native-vector-icons/ionicons';
import { Pressable, Text } from 'react-native';

import {
  APP_ACCENT,
  APP_BORDER,
  APP_SURFACE,
  APP_TEXT_MUTED,
} from '@/constants/app-colors';

type VoiceReplyToggleProps = {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  disabled?: boolean;
};

export function VoiceReplyToggle({
  enabled,
  onChange,
  disabled = false,
}: VoiceReplyToggleProps) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: enabled, disabled }}
      accessibilityLabel="Respuesta hablada"
      disabled={disabled}
      onPress={() => onChange(!enabled)}
      className="flex-row items-center self-center rounded-full border px-3 py-1.5 active:opacity-90"
      style={{
        backgroundColor: APP_SURFACE,
        borderColor: enabled ? APP_ACCENT : APP_BORDER,
        opacity: disabled ? 0.55 : 1,
      }}>
      <Ionicons
        name={enabled ? 'volume-high' : 'volume-mute-outline'}
        size={16}
        color={enabled ? APP_ACCENT : APP_TEXT_MUTED}
      />
      <Text
        className="ml-2 text-[13px] font-semibold"
        style={{ color: enabled ? APP_ACCENT : APP_TEXT_MUTED }}>
        Que me hable
      </Text>
    </Pressable>
  );
}
