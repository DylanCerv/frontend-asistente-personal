import Ionicons from '@react-native-vector-icons/ionicons';
import { Pressable } from 'react-native';

type AuthBackButtonProps = {
  onPress?: () => void;
};

export function AuthBackButton({ onPress }: AuthBackButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Volver"
      onPress={onPress}
      hitSlop={8}
      className="h-11 w-11 items-center justify-center rounded-full bg-[#1F1F1F] active:opacity-70">
      <Ionicons name="chevron-back" size={22} color="#C4B5FD" />
    </Pressable>
  );
}
