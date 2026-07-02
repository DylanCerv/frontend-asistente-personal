import { Text, View } from 'react-native';

type AuthHeaderProps = {
  title: string;
  subtitle: string;
};

export function AuthHeader({ title, subtitle }: AuthHeaderProps) {
  return (
    <View className="items-center gap-5">
      <View className="items-center justify-center rounded-[28px] border border-border/80 bg-surface p-1 dark:border-border-dark/80 dark:bg-surface-dark">
        <View className="h-[72px] w-[72px] items-center justify-center rounded-[24px] bg-muted dark:bg-muted-dark">
          <Text className="text-[34px] text-brand dark:text-brand-dark">✦</Text>
        </View>
      </View>

      <View className="items-center gap-2 px-4">
        <Text className="text-center text-[30px] font-bold tracking-tight text-foreground dark:text-foreground-dark">
          {title}
        </Text>
        <Text className="max-w-[280px] text-center text-[15px] leading-[22px] text-subtle dark:text-subtle-dark">
          {subtitle}
        </Text>
      </View>
    </View>
  );
}
