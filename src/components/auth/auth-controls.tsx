import Ionicons from '@react-native-vector-icons/ionicons';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

type AuthPrimaryButtonProps = {
  label: string;
  onPress?: () => void;
  loading?: boolean;
  disabled?: boolean;
  showArrow?: boolean;
};

export function AuthPrimaryButton({
  label,
  onPress,
  loading = false,
  disabled = false,
  showArrow = false,
}: AuthPrimaryButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      onPress={onPress}
      className={`min-h-[52px] flex-row items-center justify-center gap-2 rounded-2xl bg-[#C4B5FD] px-5 active:opacity-90 ${
        isDisabled ? 'opacity-50' : ''
      }`}>
      {loading ? (
        <ActivityIndicator color="#1A0B2E" />
      ) : (
        <>
          <Text className="text-[15px] font-bold text-[#1A0B2E]">{label}</Text>
          {showArrow ? <Ionicons name="arrow-forward" size={18} color="#1A0B2E" /> : null}
        </>
      )}
    </Pressable>
  );
}

type AuthDividerProps = {
  label?: string;
  withLines?: boolean;
};

export function AuthDivider({ label = 'o', withLines = true }: AuthDividerProps) {
  if (!withLines) {
    return (
      <Text className="text-center text-[11px] font-semibold uppercase tracking-[1.4px] text-[#6B6B6B]">
        {label}
      </Text>
    );
  }

  return (
    <View className="flex-row items-center gap-3">
      <View className="h-px flex-1 bg-[#2E2E2E]" />
      <Text className="text-sm text-[#7A7A7A]">{label}</Text>
      <View className="h-px flex-1 bg-[#2E2E2E]" />
    </View>
  );
}
