import { Pressable, Text, View } from 'react-native';

import {
  APP_ACCENT,
  APP_BORDER,
  APP_ON_ACCENT,
  APP_SURFACE,
  APP_TEXT_MUTED,
} from '@/constants/app-colors';

type VoiceSendModeToggleProps = {
  /** true = Automático, false = Manual */
  autoSend: boolean;
  onChange: (autoSend: boolean) => void;
  disabled?: boolean;
};

export function VoiceSendModeToggle({
  autoSend,
  onChange,
  disabled = false,
}: VoiceSendModeToggleProps) {
  return (
    <View
      accessibilityRole="tablist"
      className="flex-row self-center rounded-full border p-1"
      style={{
        backgroundColor: APP_SURFACE,
        borderColor: APP_BORDER,
        opacity: disabled ? 0.55 : 1,
      }}>
      <ModeOption
        label="Manual"
        selected={!autoSend}
        disabled={disabled}
        onPress={() => onChange(false)}
      />
      <ModeOption
        label="Automático"
        selected={autoSend}
        disabled={disabled}
        onPress={() => onChange(true)}
      />
    </View>
  );
}

function ModeOption({
  label,
  selected,
  disabled,
  onPress,
}: {
  label: string;
  selected: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected, disabled }}
      accessibilityLabel={`Envío de audio: ${label}`}
      disabled={disabled}
      onPress={onPress}
      className="min-w-[108px] items-center justify-center rounded-full px-4 py-2 active:opacity-90"
      style={{
        backgroundColor: selected ? APP_ACCENT : 'transparent',
      }}>
      <Text
        className="text-[13px] font-semibold"
        style={{ color: selected ? APP_ON_ACCENT : APP_TEXT_MUTED }}>
        {label}
      </Text>
    </Pressable>
  );
}
