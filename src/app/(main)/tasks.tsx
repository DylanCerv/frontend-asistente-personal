import Ionicons from '@react-native-vector-icons/ionicons';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ExpandableItemCard } from '@/components/expandable-item-card';
import { TaskDetailsContent } from '@/components/item-details';
import { PRIORITY_LABELS } from '@/constants/mock-data';
import { useAssistant } from '@/context/assistant-context';

type FilterMode = 'pending' | 'completed' | 'all';

const FILTERS: { id: FilterMode; label: string }[] = [
  { id: 'pending', label: 'Pendientes' },
  { id: 'completed', label: 'Completadas' },
  { id: 'all', label: 'Todas' },
];

export default function TasksScreen() {
  const { tasks, toggleTaskComplete } = useAssistant();
  const [filter, setFilter] = useState<FilterMode>('pending');

  const filteredTasks = useMemo(() => {
    if (filter === 'pending') return tasks.filter((t) => t.status === 'pending');
    if (filter === 'completed') return tasks.filter((t) => t.status === 'completed');
    return tasks;
  }, [tasks, filter]);

  const categories = useMemo(() => {
    const cats = new Set(tasks.map((t) => t.category));
    return Array.from(cats);
  }, [tasks]);

  return (
    <SafeAreaView className="flex-1 bg-canvas dark:bg-canvas-dark">
      <ScrollView contentContainerClassName="w-full max-w-3xl gap-6 self-center px-6 pb-36 pt-3">
        <View className="gap-1">
          <Text className="text-[30px] font-bold text-foreground dark:text-foreground-dark">
            Tareas
          </Text>
          <Text className="text-[15px] text-subtle dark:text-subtle-dark">
            Vista de gestión — qué hacer y en qué estado está
          </Text>
        </View>

        <View className="flex-row gap-2">
          {FILTERS.map((f) => (
            <Pressable
              key={f.id}
              accessibilityRole="button"
              onPress={() => setFilter(f.id)}
              className={`rounded-full px-4 py-2 ${
                filter === f.id
                  ? 'bg-brand dark:bg-brand-dark'
                  : 'border border-border bg-surface dark:border-border-dark dark:bg-surface-dark'
              }`}>
              <Text
                className={`text-sm font-semibold ${
                  filter === f.id ? 'text-white' : 'text-subtle dark:text-subtle-dark'
                }`}>
                {f.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
          {categories.map((cat) => (
            <View
              key={cat}
              className="rounded-full bg-surface-soft px-3 py-1.5 dark:bg-surface-soft-dark">
              <Text className="text-xs font-semibold text-brand dark:text-brand-dark">{cat}</Text>
            </View>
          ))}
        </ScrollView>

        <View className="gap-3">
          {filteredTasks.length === 0 ? (
            <View className="items-center gap-3 rounded-[28px] border border-dashed border-border p-10 dark:border-border-dark">
              <Ionicons name="checkbox-outline" size={40} color="#6B6475" />
              <Text className="text-center text-subtle dark:text-subtle-dark">
                No hay tareas aquí. Habla con tu asistente para crear una.
              </Text>
            </View>
          ) : (
            filteredTasks.map((task) => (
              <View key={task.id} className="flex-row items-start gap-2">
                <Pressable
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: task.status === 'completed' }}
                  onPress={() => toggleTaskComplete(task.id)}
                  className={`mt-4 h-6 w-6 items-center justify-center rounded-lg border-2 ${
                    task.status === 'completed'
                      ? 'border-brand bg-brand dark:border-brand-dark dark:bg-brand-dark'
                      : 'border-border dark:border-border-dark'
                  }`}>
                  {task.status === 'completed' ? (
                    <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                  ) : null}
                </Pressable>

                <View className="flex-1">
                  <ExpandableItemCard expandedContent={<TaskDetailsContent task={task} />}>
                    <View className="gap-1">
                      <Text
                        className={`text-base font-semibold ${
                          task.status === 'completed'
                            ? 'text-subtle line-through dark:text-subtle-dark'
                            : 'text-foreground dark:text-foreground-dark'
                        }`}>
                        {task.title}
                      </Text>
                      {task.description ? (
                        <Text
                          className="text-sm text-subtle dark:text-subtle-dark"
                          numberOfLines={1}>
                          {task.description}
                        </Text>
                      ) : null}
                      <View className="flex-row flex-wrap items-center gap-2">
                        {task.dueLabel ? (
                          <Text className="text-xs text-subtle dark:text-subtle-dark">
                            {task.dueLabel}
                          </Text>
                        ) : null}
                        <Text className="text-xs text-brand dark:text-brand-dark">
                          {PRIORITY_LABELS[task.priority]}
                        </Text>
                      </View>
                    </View>
                  </ExpandableItemCard>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
