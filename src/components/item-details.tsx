import { Text, View } from 'react-native';

import { DetailRow } from '@/components/expandable-item-card';
import { PRIORITY_LABELS } from '@/constants/mock-data';
import type { CalendarEvent, TaskItem } from '@/types/assistant';
import { formatLongDate } from '@/utils/date-utils';

export function TaskDetailsContent({ task }: { task: TaskItem }) {
  return (
    <View className="gap-3">
      {task.description ? (
        <DetailRow label="Descripción" value={task.description} icon="document-text-outline" />
      ) : null}
      <DetailRow
        label="Fecha"
        value={task.dueLabel ?? formatLongDate(task.scheduledAt)}
        icon="calendar-outline"
      />
      <DetailRow label="Categoría" value={task.category} icon="folder-outline" />
      <DetailRow
        label="Prioridad"
        value={PRIORITY_LABELS[task.priority]}
        icon="flag-outline"
      />
      <DetailRow
        label="Estado"
        value={task.status === 'completed' ? 'Completada' : 'Pendiente'}
        icon="checkbox-outline"
      />
      {task.estimatedMinutes ? (
        <DetailRow
          label="Tiempo estimado"
          value={`${task.estimatedMinutes} min`}
          icon="time-outline"
        />
      ) : null}
      {task.actualMinutes ? (
        <DetailRow
          label="Tiempo real"
          value={`${task.actualMinutes} min`}
          icon="stopwatch-outline"
        />
      ) : null}
      {task.tags.length > 0 ? (
        <DetailRow label="Etiquetas" value={task.tags.map((t) => `#${t}`).join(' ')} icon="pricetag-outline" />
      ) : null}
      {task.subtasks && task.subtasks.length > 0 ? (
        <View className="gap-2">
          <Text className="text-xs text-subtle dark:text-subtle-dark">Subtareas</Text>
          {task.subtasks.map((sub) => (
            <Text key={sub.id} className="text-sm text-foreground dark:text-foreground-dark">
              {sub.completed ? '✓' : '○'} {sub.title}
            </Text>
          ))}
        </View>
      ) : null}
    </View>
  );
}

export function EventDetailsContent({ event }: { event: CalendarEvent }) {
  const typeLabels = {
    meeting: 'Reunión',
    event: 'Evento',
    reminder: 'Recordatorio',
  };

  return (
    <View className="gap-3">
      <DetailRow label="Fecha" value={formatLongDate(event.scheduledAt)} icon="calendar-outline" />
      <DetailRow label="Hora" value={event.time} icon="time-outline" />
      <DetailRow
        label="Tipo"
        value={typeLabels[event.type]}
        icon="bookmark-outline"
      />
      {event.location ? (
        <DetailRow label="Ubicación" value={event.location} icon="location-outline" />
      ) : null}
    </View>
  );
}
