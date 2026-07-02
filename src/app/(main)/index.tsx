import Ionicons from '@react-native-vector-icons/ionicons';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AudioQuickAction } from '@/components/audio-quick-action';
import { useAuth } from '@/context/auth-context';

const PRIORITY_TASKS = [
  {
    id: 'medicine',
    title: 'Comprar medicamentos',
    due: 'Hoy, 6:00 PM',
    priority: 'Alta',
  },
  {
    id: 'invoice',
    title: 'Pagar factura de internet',
    due: 'Mañana, 10:00 AM',
    priority: 'Alta',
  },
  {
    id: 'meeting',
    title: 'Preparar reunión semanal',
    due: 'Viernes, 9:00 AM',
    priority: 'Media',
  },
] as const;

export default function HomeScreen() {
  const { user } = useAuth();

  return (
    <SafeAreaView className="flex-1 bg-canvas dark:bg-canvas-dark">
      <ScrollView contentContainerClassName="w-full max-w-3xl gap-6 self-center px-6 pb-28 pt-3">
        <View className="flex-row items-center justify-between gap-4">
          <View className="flex-1 gap-1">
            <Text className="text-[15px] text-subtle dark:text-subtle-dark">
              Bienvenido de vuelta
            </Text>
            <Text className="text-[30px] font-bold text-foreground dark:text-foreground-dark">
              Hola, {user?.name ?? 'Usuario'}
            </Text>
          </View>

          <View className="h-12 w-12 items-center justify-center rounded-2xl bg-muted dark:bg-muted-dark">
            <Ionicons name="sparkles-outline" size={24} color="#7C3AED" />
          </View>
        </View>

        <AudioQuickAction />

        <View className="gap-4 rounded-[28px] border border-border bg-surface p-5 dark:border-border-dark dark:bg-surface-dark">
          <View className="flex-row items-center justify-between">
            <View className="gap-1">
              <Text className="text-lg font-semibold text-foreground dark:text-foreground-dark">
                Próximas tareas prioritarias
              </Text>
              <Text className="text-sm text-subtle dark:text-subtle-dark">
                Las 3 tareas importantes que vencen primero
              </Text>
            </View>

            <View className="h-11 w-11 items-center justify-center rounded-2xl bg-surface-soft dark:bg-surface-soft-dark">
              <Ionicons name="flag-outline" size={22} color="#7C3AED" />
            </View>
          </View>

          <View className="gap-3">
            {PRIORITY_TASKS.map((task, index) => (
              <View
                key={task.id}
                className="flex-row items-center gap-3 rounded-2xl border border-border bg-canvas p-4 dark:border-border-dark dark:bg-canvas-dark">
                <View className="h-10 w-10 items-center justify-center rounded-xl bg-muted dark:bg-muted-dark">
                  <Text className="font-bold text-brand dark:text-brand-dark">{index + 1}</Text>
                </View>

                <View className="flex-1 gap-1">
                  <Text className="text-[15px] font-semibold text-foreground dark:text-foreground-dark">
                    {task.title}
                  </Text>
                  <Text className="text-sm text-subtle dark:text-subtle-dark">Vence: {task.due}</Text>
                </View>

                <View className="rounded-full bg-surface-soft px-3 py-1 dark:bg-surface-soft-dark">
                  <Text className="text-xs font-semibold text-brand dark:text-brand-dark">
                    {task.priority}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
