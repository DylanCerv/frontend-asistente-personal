import type { ComponentProps } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';

type ButtonProps = ComponentProps<typeof Pressable> & {
  label: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  loading?: boolean;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
};

const variantClasses = {
  primary: 'bg-brand shadow-sm dark:bg-brand-dark active:opacity-85',
  secondary: 'border border-border bg-surface dark:border-border-dark dark:bg-surface-dark active:opacity-85',
  ghost: 'bg-transparent active:opacity-70',
} as const;

const labelClasses = {
  primary: 'text-white',
  secondary: 'text-foreground dark:text-foreground-dark',
  ghost: 'text-brand dark:text-brand-dark',
} as const;

export function Button({
  label,
  variant = 'primary',
  loading = false,
  disabled,
  className,
  icon,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const iconColor = variant === 'primary' ? '#FFFFFF' : variant === 'ghost' ? '#7C3AED' : '#7C3AED';

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      className={`min-h-[54px] flex-row items-center justify-center rounded-2xl px-5 py-3.5 ${variantClasses[variant]} ${isDisabled ? 'opacity-50' : ''} ${className ?? ''}`}
      {...props}>
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#FFFFFF' : '#7C3AED'} />
      ) : (
        <View className="flex-row items-center gap-2">
          {icon ? <Ionicons name={icon} size={20} color={iconColor} /> : null}
          <Text className={`text-base font-semibold ${labelClasses[variant]}`}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}
