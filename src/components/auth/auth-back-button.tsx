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
      className="h-11 w-11 items-center justify-center rounded-full border border-border bg-surface/80 dark:border-border-dark dark:bg-surface-dark/80 active:opacity-70">
      <Ionicons name="chevron-back" size={22} color="#64748B" />
    </Pressable>
  );
}
