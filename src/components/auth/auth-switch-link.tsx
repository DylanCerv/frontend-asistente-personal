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
      className="items-center py-2 active:opacity-70">
      <Text className="text-center text-sm text-subtle dark:text-subtle-dark">
        {text}{' '}
        <Text className="font-semibold text-brand dark:text-brand-dark">{actionLabel}</Text>
      </Text>
    </Pressable>
  );
}
