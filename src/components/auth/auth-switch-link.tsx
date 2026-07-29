import { Pressable, Text } from 'react-native';

type AuthSwitchLinkProps = {
  text: string;
  actionLabel: string;
  onPress?: () => void;
};

export function AuthSwitchLink({ text, actionLabel, onPress }: AuthSwitchLinkProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className="items-center py-1 active:opacity-70">
      <Text className="text-center text-sm text-[#8A8A8A]">
        {text}{' '}
        <Text className="font-semibold text-[#C4B5FD]">{actionLabel}</Text>
      </Text>
    </Pressable>
  );
}
