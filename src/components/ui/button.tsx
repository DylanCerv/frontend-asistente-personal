import type { ComponentProps } from 'react';
import { ActivityIndicator, Pressable, Text } from 'react-native';

type ButtonProps = ComponentProps<typeof Pressable> & {
  label: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  loading?: boolean;
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
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      className={`min-h-[54px] items-center justify-center rounded-2xl px-5 py-3.5 ${variantClasses[variant]} ${isDisabled ? 'opacity-50' : ''} ${className ?? ''}`}
      {...props}>
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#FFFFFF' : '#7C3AED'} />
      ) : (
        <Text className={`text-base font-semibold ${labelClasses[variant]}`}>{label}</Text>
      )}
    </Pressable>
  );
}
