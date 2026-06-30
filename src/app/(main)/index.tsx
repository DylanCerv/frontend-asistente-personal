import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/context/auth-context';

const QUICK_ACTIONS = [
  { id: 'chat', icon: '💬', title: 'Chat', subtitle: 'Pregúntame lo que quieras' },
  { id: 'tasks', icon: '✓', title: 'Tareas', subtitle: 'Organiza tu día' },
  { id: 'notes', icon: '📝', title: 'Notas', subtitle: 'Captura ideas rápido' },
  { id: 'reminders', icon: '⏰', title: 'Recordatorios', subtitle: 'No olvides nada' },
];

export default function HomeScreen() {
  const { user } = useAuth();

  return (
    <SafeAreaView className="flex-1 bg-canvas dark:bg-canvas-dark">
      <ScrollView contentContainerClassName="w-full max-w-3xl gap-6 self-center px-6 pb-28">
        <View className="gap-1 pt-2">
          <Text className="text-[15px] text-subtle dark:text-subtle-dark">Bienvenido de vuelta</Text>
          <Text className="text-[28px] font-bold text-foreground dark:text-foreground-dark">
            Hola, {user?.name ?? 'Usuario'}
          </Text>
        </View>

        <View className="gap-3 rounded-2xl border border-border bg-muted p-6 dark:border-border-dark dark:bg-muted-dark">
          <Text className="text-sm font-semibold text-brand dark:text-brand-dark">Asistente activo</Text>
          <Text className="text-lg font-semibold leading-[26px] text-foreground dark:text-foreground-dark">
            ¿En qué puedo ayudarte hoy?
          </Text>
          <View className="rounded-xl border border-border bg-canvas px-4 py-4 dark:border-border-dark dark:bg-canvas-dark">
            <Text className="text-[15px] text-subtle dark:text-subtle-dark">
              Escribe tu pregunta o elige una acción...
            </Text>
          </View>
        </View>

        <View className="gap-4">
          <Text className="text-lg font-semibold text-foreground dark:text-foreground-dark">
            Acciones rápidas
          </Text>
          <View className="flex-row flex-wrap gap-3">
            {QUICK_ACTIONS.map((action) => (
              <Pressable
                key={action.id}
                className="w-[47%] gap-1 rounded-2xl border border-border bg-surface p-4 dark:border-border-dark dark:bg-surface-dark">
                <Text className="text-[22px]">{action.icon}</Text>
                <Text className="text-[15px] font-semibold text-foreground dark:text-foreground-dark">
                  {action.title}
                </Text>
                <Text className="text-[13px] leading-[18px] text-subtle dark:text-subtle-dark">
                  {action.subtitle}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View className="gap-3 rounded-2xl border border-border bg-surface p-6 dark:border-border-dark dark:bg-surface-dark">
          <Text className="text-base font-semibold text-foreground dark:text-foreground-dark">
            Actividad reciente
          </Text>
          <Text className="text-sm leading-5 text-subtle dark:text-subtle-dark">
            Tu asistente está listo. Pronto podrás ver conversaciones, tareas y recordatorios aquí.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
