import { Text, View } from 'react-native';

import { SocialAuthButton } from '@/components/auth/social-auth-button';
import { Button } from '@/components/ui/button';

type AuthOptionsSectionProps = {
  emailButtonLabel: string;
  onGooglePress?: () => void;
  onApplePress?: () => void;
  onEmailPress?: () => void;
  loading?: boolean;
  loadingProvider?: 'google' | 'apple' | null;
  error?: string;
};

export function AuthOptionsSection({
  emailButtonLabel,
  onGooglePress,
  onApplePress,
  onEmailPress,
  loading = false,
  loadingProvider = null,
  error,
}: AuthOptionsSectionProps) {
  return (
    <View className="gap-3">
      <SocialAuthButton
        provider="google"
        label="Continuar con Google"
        onPress={onGooglePress}
        loading={loading && loadingProvider === 'google'}
        disabled={loading}
      />
      <SocialAuthButton
        provider="apple"
        label="Continuar con Apple"
        onPress={onApplePress}
        loading={loading && loadingProvider === 'apple'}
        disabled={loading}
      />
      <Button
        label={emailButtonLabel}
        variant="ghost"
        onPress={onEmailPress}
        icon="mail-outline"
        disabled={loading}
      />
      {error ? (
        <Text className="text-center text-sm text-danger dark:text-danger-dark">{error}</Text>
      ) : null}
    </View>
  );
}
