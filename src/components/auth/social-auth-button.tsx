import { ActivityIndicator, Pressable, Text } from 'react-native';

import { GoogleLogoIcon } from '@/components/auth/google-logo-icon';

type SocialAuthButtonProps = {
  label: string;
  onPress?: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'dark' | 'light';
};

export function SocialAuthButton({
  label,
  onPress,
  loading = false,
  disabled = false,
  variant = 'dark',
}: SocialAuthButtonProps) {
  const isDisabled = disabled || loading;
  const isLight = variant === 'light';

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      onPress={onPress}
      className={`min-h-[52px] flex-row items-center justify-center gap-3 rounded-2xl px-5 active:opacity-85 ${
        isLight ? 'bg-white' : 'bg-[#2A2A2A]'
      } ${isDisabled ? 'opacity-50' : ''}`}>
      {loading ? (
        <ActivityIndicator color={isLight ? '#1A1A1A' : '#C4B5FD'} />
      ) : (
        <>
          <GoogleLogoIcon size={20} />
          <Text
            className={`text-[15px] font-semibold ${isLight ? 'text-[#1A1A1A]' : 'text-white'}`}>
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}
