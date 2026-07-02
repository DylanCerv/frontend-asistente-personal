import Ionicons from '@react-native-vector-icons/ionicons';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const PRIORITY_TASKS = [
  {
    id: 'medicine',
    title: 'Comprar medicamentos',
    due: 'Hoy, 6:00 PM',
    priority: 'Alta',
    detail: 'Antes de salir del trabajo',
  },
  {
    id: 'invoice',
    title: 'Pagar factura de internet',
    due: 'Mañana, 10:00 AM',
    priority: 'Alta',
    detail: 'Evitar recargo automático',
  },
  {
    id: 'meeting',
    title: 'Preparar reunión semanal',
    due: 'Viernes, 9:00 AM',
    priority: 'Media',
    detail: 'Revisar pendientes y notas',
  },
] as const;

export default function TasksScreen() {
  return (
    <SafeAreaView className="flex-1 bg-canvas dark:bg-canvas-dark">
      <ScrollView contentContainerClassName="w-full max-w-3xl gap-6 self-center px-6 pb-28 pt-3">
        <View className="gap-1">
          <Text className="text-[30px] font-bold text-foreground dark:text-foreground-dark">
            Tareas
          </Text>
          <Text className="text-[15px] text-subtle dark:text-subtle-dark">
            Prioridades próximas a vencer
          </Text>
        </View>

        <View className="gap-4">
          {PRIORITY_TASKS.map((task, index) => (
            <View
              key={task.id}
              className="gap-4 rounded-[28px] border border-border bg-surface p-5 dark:border-border-dark dark:bg-surface-dark">
              <View className="flex-row items-center gap-4">
                <View className="h-12 w-12 items-center justify-center rounded-2xl bg-muted dark:bg-muted-dark">
                  <Text className="font-bold text-brand dark:text-brand-dark">{index + 1}</Text>
                </View>

                <View className="flex-1 gap-1">
                  <Text className="text-base font-semibold text-foreground dark:text-foreground-dark">
                    {task.title}
                  </Text>
                  <Text className="text-sm text-subtle dark:text-subtle-dark">{task.detail}</Text>
                </View>

                <Ionicons name="flag-outline" size={22} color="#7C3AED" />
              </View>

              <View className="flex-row items-center justify-between rounded-2xl bg-surface-soft px-4 py-3 dark:bg-surface-soft-dark">
                <Text className="text-sm font-medium text-subtle dark:text-subtle-dark">
                  Vence: {task.due}
                </Text>
                <Text className="text-sm font-semibold text-brand dark:text-brand-dark">
                  {task.priority}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
