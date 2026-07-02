import Ionicons from '@react-native-vector-icons/ionicons';
import type { ComponentProps } from 'react';
import { Text, View } from 'react-native';

type AuthStepHeaderProps = {
  icon: ComponentProps<typeof Ionicons>['name'];
  title: string;
  subtitle: string;
};

export function AuthStepHeader({ icon, title, subtitle }: AuthStepHeaderProps) {
  return (
    <View className="items-center gap-3">
      <View className="h-14 w-14 items-center justify-center rounded-2xl bg-muted dark:bg-muted-dark">
        <Ionicons name={icon} size={26} color="#7C3AED" />
      </View>
      <View className="items-center gap-2">
        <Text className="text-center text-[28px] font-bold tracking-tight text-foreground dark:text-foreground-dark">
          {title}
        </Text>
        <Text className="max-w-xs text-center text-sm leading-6 text-subtle dark:text-subtle-dark">
          {subtitle}
        </Text>
      </View>
    </View>
  );
}
