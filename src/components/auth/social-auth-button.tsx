import Ionicons from '@react-native-vector-icons/ionicons';
import type { ComponentProps } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { GoogleLogoIcon } from '@/components/auth/google-logo-icon';
import { useColorScheme } from '@/hooks/use-color-scheme';

type SocialProvider = 'google' | 'apple';

type SocialAuthButtonProps = Omit<ComponentProps<typeof Pressable>, 'children'> & {
  provider: SocialProvider;
  label: string;
  loading?: boolean;
};

export function SocialAuthButton({
  provider,
  label,
  loading = false,
  disabled,
  className,
  ...props
}: SocialAuthButtonProps) {
  const isDark = useColorScheme() === 'dark';
  const isDisabled = disabled || loading;
  const isGoogle = provider === 'google';
  const isApple = provider === 'apple';

  const googleContainerClass =
    'border border-[#DADCE0] bg-white shadow-sm dark:border-border-dark dark:bg-surface-dark';
  const appleContainerClass = isDark
    ? 'border border-border bg-white dark:border-border-dark'
    : 'bg-black';
  const appleLabelClass = isDark ? 'text-black' : 'text-white';
  const appleIconColor = isDark ? '#000000' : '#FFFFFF';

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      className={`min-h-[54px] flex-row items-center justify-center rounded-2xl px-5 active:opacity-90 ${
        isGoogle ? googleContainerClass : appleContainerClass
      } ${isDisabled ? 'opacity-50' : ''} ${className ?? ''}`}
      {...props}>
      {loading ? (
        <ActivityIndicator color={isGoogle ? '#4285F4' : appleIconColor} />
      ) : (
        <>
          <View className="absolute left-5 h-6 w-6 items-center justify-center">
            {isGoogle ? (
              <GoogleLogoIcon size={22} />
            ) : (
              <Ionicons name="logo-apple" size={22} color={appleIconColor} />
            )}
          </View>
          <Text
            className={`text-base font-semibold tracking-tight ${
              isApple ? appleLabelClass : 'text-[#3C4043] dark:text-foreground-dark'
            }`}>
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}
