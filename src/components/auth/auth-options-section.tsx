import { View } from 'react-native';

import { SocialAuthButton } from '@/components/auth/social-auth-button';
import { Button } from '@/components/ui/button';

type AuthOptionsSectionProps = {
  emailButtonLabel: string;
  onGooglePress?: () => void;
  onApplePress?: () => void;
  onEmailPress?: () => void;
};

export function AuthOptionsSection({
  emailButtonLabel,
  onGooglePress,
  onApplePress,
  onEmailPress,
}: AuthOptionsSectionProps) {
  return (
    <View className="gap-3">
      <SocialAuthButton provider="google" label="Continuar con Google" onPress={onGooglePress} />
      <SocialAuthButton provider="apple" label="Continuar con Apple" onPress={onApplePress} />
      <Button label={emailButtonLabel} variant="ghost" onPress={onEmailPress} icon="mail-outline" />
    </View>
  );
}
