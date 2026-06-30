import { useRouter } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/auth-context';
import { useThemePreference } from '@/context/theme-preference-context';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { mode } = useThemePreference();

  function handleSignOut() {
    signOut();
    router.replace('/login');
  }

  return (
    <SafeAreaView className="flex-1 bg-canvas dark:bg-canvas-dark">
      <ScrollView contentContainerClassName="w-full max-w-3xl gap-6 self-center px-6 pb-28">
        <View className="gap-1 pt-2">
          <Text className="text-[28px] font-bold text-foreground dark:text-foreground-dark">Perfil</Text>
          <Text className="text-[15px] text-subtle dark:text-subtle-dark">Configura tu experiencia</Text>
        </View>

        <View className="items-center gap-3 rounded-2xl border border-border bg-surface p-6 dark:border-border-dark dark:bg-surface-dark">
          <View className="h-16 w-16 items-center justify-center rounded-full bg-muted dark:bg-muted-dark">
            <Text className="text-[26px] font-bold text-brand dark:text-brand-dark">
              {user?.name?.charAt(0) ?? 'A'}
            </Text>
          </View>
          <Text className="text-xl font-semibold text-foreground dark:text-foreground-dark">
            {user?.name ?? 'Usuario'}
          </Text>
          <Text className="text-sm text-subtle dark:text-subtle-dark">{user?.email}</Text>
        </View>

        <View className="gap-4 rounded-2xl border border-border bg-surface p-6 dark:border-border-dark dark:bg-surface-dark">
          <Text className="text-base font-semibold text-foreground dark:text-foreground-dark">Apariencia</Text>
          <Text className="text-sm leading-5 text-subtle dark:text-subtle-dark">
            Modo actual: {mode === 'light' ? 'Claro' : 'Oscuro'}
          </Text>
          <ThemeToggle />
        </View>

        <Button label="Cerrar sesión" variant="secondary" onPress={handleSignOut} />
      </ScrollView>
    </SafeAreaView>
  );
}
