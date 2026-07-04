import Ionicons from '@react-native-vector-icons/ionicons';
import { Text, View } from 'react-native';

import { KivoLogo } from '@/components/kivo-logo';
import { APP_DESCRIPTION, APP_NAME, APP_TAGLINE } from '@/constants/branding';

export function AuthWelcomeHero() {
  return (
    <View className="items-center gap-5">
      <View className="rounded-[30px] bg-white p-2 shadow-sm dark:bg-surface-soft-dark">
        <KivoLogo size={88} />
      </View>
      <View className="items-center gap-2.5">
        <Text className="text-center text-[34px] font-bold tracking-tight text-foreground dark:text-foreground-dark">
          {APP_NAME}
        </Text>
        <Text className="text-center text-[15px] font-semibold text-brand dark:text-brand-dark">
          {APP_TAGLINE}
        </Text>
        <Text className="max-w-xs text-center text-sm leading-6 text-subtle dark:text-subtle-dark">
          {APP_DESCRIPTION}
        </Text>
      </View>
    </View>
  );
}
