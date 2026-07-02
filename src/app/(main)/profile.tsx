import Ionicons from '@react-native-vector-icons/ionicons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemeToggle } from '@/components/theme-toggle';
import { useAuth } from '@/context/auth-context';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();

  function handleSignOut() {
    signOut();
    router.replace('/login');
  }

  const initial = user?.name?.charAt(0)?.toUpperCase() ?? 'A';

  return (
    <SafeAreaView className="flex-1 bg-canvas dark:bg-canvas-dark">
      <ScrollView contentContainerClassName="w-full max-w-3xl gap-6 self-center px-6 pb-28 pt-3">
        <View className="gap-1">
          <Text className="text-[30px] font-bold text-foreground dark:text-foreground-dark">
            Perfil
          </Text>
          <Text className="text-[15px] text-subtle dark:text-subtle-dark">
            Tu cuenta y preferencias
          </Text>
        </View>

        <View className="overflow-hidden rounded-[32px] border border-border bg-muted dark:border-border-dark dark:bg-muted-dark">
          <View className="items-center gap-4 px-6 pb-6 pt-8">
            <View className="h-24 w-24 items-center justify-center rounded-full border-4 border-surface bg-brand dark:border-surface-dark dark:bg-brand-dark">
              <Text className="text-4xl font-bold text-white">{initial}</Text>
            </View>
            <View className="items-center gap-1">
              <Text className="text-2xl font-bold text-foreground dark:text-foreground-dark">
                {user?.name ?? 'Usuario'}
              </Text>
              <Text className="text-sm text-subtle dark:text-subtle-dark">{user?.email}</Text>
            </View>
          </View>

          <View className="flex-row border-t border-border bg-surface dark:border-border-dark dark:bg-surface-dark">
            <View className="flex-1 items-center gap-1 border-r border-border py-4 dark:border-border-dark">
              <Ionicons name="sparkles-outline" size={20} color="#7C3AED" />
              <Text className="text-xs font-medium text-subtle dark:text-subtle-dark">Asistente</Text>
            </View>
            <View className="flex-1 items-center gap-1 py-4">
              <Ionicons name="shield-checkmark-outline" size={20} color="#7C3AED" />
              <Text className="text-xs font-medium text-subtle dark:text-subtle-dark">Cuenta activa</Text>
            </View>
          </View>
        </View>

        <View className="gap-4 rounded-[28px] border border-border bg-surface p-5 dark:border-border-dark dark:bg-surface-dark">
          <View className="gap-1">
            <Text className="text-lg font-semibold text-foreground dark:text-foreground-dark">
              Apariencia
            </Text>
            <Text className="text-sm text-subtle dark:text-subtle-dark">
              Elige cómo quieres ver la app
            </Text>
          </View>
          <ThemeToggle variant="cards" />
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={handleSignOut}
          className="min-h-[52px] flex-row items-center justify-center gap-2 rounded-2xl border border-border bg-surface active:opacity-80 dark:border-border-dark dark:bg-surface-dark">
          <Ionicons name="log-out-outline" size={20} color="#DC2626" />
          <Text className="text-base font-semibold text-danger dark:text-danger-dark">
            Cerrar sesión
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
