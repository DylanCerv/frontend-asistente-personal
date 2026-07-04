import { Text, View } from 'react-native';

import { KivoLogo } from '@/components/kivo-logo';
import { APP_DESCRIPTION, APP_NAME, APP_TAGLINE } from '@/constants/branding';

export function AuthWelcomeHero() {
  return (
    <View className="items-center gap-4">
      <KivoLogo size={80} />
      <View className="items-center gap-2">
        <Text className="text-center text-[30px] font-bold tracking-tight text-foreground dark:text-foreground-dark">
          {APP_NAME}
        </Text>
        <Text className="text-center text-base font-medium text-brand dark:text-brand-dark">
          {APP_TAGLINE}
        </Text>
        <Text className="max-w-xs text-center text-sm leading-6 text-subtle dark:text-subtle-dark">
          {APP_DESCRIPTION}
        </Text>
      </View>
    </View>
  );
}
