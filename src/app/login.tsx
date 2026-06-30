import { Redirect, useRouter } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/auth-context';

export default function LoginScreen() {
  const router = useRouter();
  const { isAuthenticated, signIn } = useAuth();

  if (isAuthenticated) {
    return <Redirect href="/" />;
  }

  function handleSignIn() {
    signIn();
    router.replace('/');
  }

  return (
    <SafeAreaView className="flex-1 bg-canvas dark:bg-canvas-dark">
      <ScrollView contentContainerClassName="flex-grow px-6 pb-8">
        <View className="flex-row justify-end pt-2">
          <ThemeToggle compact />
        </View>

        <View className="w-full max-w-3xl flex-1 items-center justify-center gap-6 self-center py-8">
          <View className="h-[72px] w-[72px] items-center justify-center rounded-3xl bg-muted dark:bg-muted-dark">
            <Text className="text-[32px]">✦</Text>
          </View>

          <View className="items-center gap-1">
            <Text className="text-[32px] font-bold tracking-tight text-foreground dark:text-foreground-dark">
              Asistente
            </Text>
            <Text className="text-center text-base leading-6 text-subtle dark:text-subtle-dark">
              Tu asistente personal inteligente
            </Text>
          </View>

          <View className="w-full gap-4 rounded-2xl border border-border bg-surface p-6 dark:border-border-dark dark:bg-surface-dark">
            <Button label="Entrar" onPress={handleSignIn} />
          </View>

          <ThemeToggle />

          <Text className="text-center text-[13px] text-subtle dark:text-subtle-dark">
            Elige entre modo claro u oscuro antes de entrar
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
