import { Pressable, Text } from 'react-native';

type AuthFooterLinkProps = {
  text: string;
  actionLabel: string;
  onPress?: () => void;
};

export function AuthFooterLink({ text, actionLabel, onPress }: AuthFooterLinkProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className="items-center rounded-2xl border border-border/60 bg-surface/60 px-5 py-4 active:opacity-75 dark:border-border-dark/60 dark:bg-surface-dark/60">
      <Text className="text-center text-sm text-subtle dark:text-subtle-dark">
        {text}{' '}
        <Text className="font-semibold text-brand dark:text-brand-dark">{actionLabel}</Text>
      </Text>
    </Pressable>
  );
}
