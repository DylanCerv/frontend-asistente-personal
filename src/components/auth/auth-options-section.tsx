import { Text, View } from 'react-native';

import { GoogleLogoIcon } from '@/components/auth/google-logo-icon';
import { Button } from '@/components/ui/button';

type AuthOptionsSectionProps = {
  emailButtonLabel: string;
  onEmailPress?: () => void;
  loading?: boolean;
  error?: string;
};

export function AuthOptionsSection({
  emailButtonLabel,
  onEmailPress,
  loading = false,
  error,
}: AuthOptionsSectionProps) {
  return (
    <View className="gap-4">
      <Button
        label={emailButtonLabel}
        variant="primary"
        onPress={onEmailPress}
        icon="mail-outline"
        loading={loading}
        disabled={loading}
      />

      {error ? (
        <Text className="text-center text-sm text-danger dark:text-danger-dark">{error}</Text>
      ) : null}

      <View className="items-center gap-3">
        <View className="flex-row items-center gap-3">
          <View className="h-px flex-1 bg-border dark:bg-border-dark" />
          <Text className="text-[11px] text-subtle dark:text-subtle-dark">Próximamente</Text>
          <View className="h-px flex-1 bg-border dark:bg-border-dark" />
        </View>

        <View className="flex-row items-center gap-2 opacity-35">
          <GoogleLogoIcon size={15} />
          <Text className="text-sm text-foreground dark:text-foreground-dark">
            Continuar con Google
          </Text>
        </View>
      </View>
    </View>
  );
}
