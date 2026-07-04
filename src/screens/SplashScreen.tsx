import { Text, View } from 'react-native';

import { KivoLogo } from '@/components/kivo-logo';
import { ScreenSafeArea } from '@/components/screen-safe-area';
import { APP_NAME, APP_TAGLINE } from '@/constants/branding';

export function SplashScreen() {
  return (
    <ScreenSafeArea>
      <View className="flex-1 items-center justify-center gap-10 px-6">
        <View className="items-center gap-5">
          <KivoLogo size={96} />
          <View className="items-center gap-2">
            <Text className="text-[36px] font-bold tracking-tight text-foreground dark:text-foreground-dark">
              {APP_NAME}
            </Text>
            <Text className="text-center text-lg font-medium text-brand dark:text-brand-dark">
              {APP_TAGLINE}
            </Text>
          </View>
        </View>
      </View>
    </ScreenSafeArea>
  );
}
