import Ionicons from '@react-native-vector-icons/ionicons';
import { Text, View } from 'react-native';

import { DetailRow } from '@/components/expandable-item-card';
import { getCategoryIcon } from '@/constants/categories';
import { PRIORITY_LABELS } from '@/constants/labels';
import type { CalendarEvent, TaskItem } from '@/types/assistant';
import { formatLongDate } from '@/utils/date-utils';

function CategoryDetailRow({ category }: { category: string }) {
  return (
    <View className="flex-row items-start gap-3">
      <Ionicons name="folder-outline" size={16} color="#7C3AED" style={{ marginTop: 2 }} />
      <View className="flex-1 gap-1.5">
        <Text className="text-xs text-subtle dark:text-subtle-dark">Categoría</Text>
        <View className="flex-row items-center gap-2 self-start rounded-xl border border-brand/20 bg-surface-soft px-3 py-1.5 dark:border-brand-dark/20 dark:bg-surface-soft-dark">
          <Ionicons name={getCategoryIcon(category) as never} size={14} color="#7C3AED" />
          <Text className="text-sm font-semibold text-brand dark:text-brand-dark">{category}</Text>
        </View>
      </View>
    </View>
  );
}

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
      <CategoryDetailRow category={task.category} />
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
  const isReminder = event.type === 'reminder';
  const isMeeting = event.type === 'meeting';
  const isDevice = event.source === 'device';
  const showDetails = (isReminder || isMeeting || isDevice) && event.description;

  return (
    <View className="gap-3">
      <DetailRow label="Fecha" value={formatLongDate(event.scheduledAt)} icon="calendar-outline" />
      <DetailRow
        label="Hora"
        value={event.endTime ? `${event.time} – ${event.endTime}` : event.time}
        icon="time-outline"
      />
      {isDevice ? (
        <DetailRow
          label="Origen"
          value={event.calendarName ? `Calendario · ${event.calendarName}` : 'Calendario del teléfono'}
          icon="calendar-outline"
        />
      ) : null}
      {!isReminder && !isMeeting && !isDevice ? (
        <DetailRow label="Tipo" value="Evento" icon="bookmark-outline" />
      ) : null}
      {showDetails ? (
        <DetailRow label="Detalles" value={event.description!} icon="document-text-outline" />
      ) : null}
      {!isDevice ? (
        <DetailRow
          label="Estado"
          value={event.status === 'completed' ? 'Completado' : 'Pendiente'}
          icon="checkbox-outline"
        />
      ) : null}
      {event.location ? (
        <DetailRow label="Ubicación" value={event.location} icon="location-outline" />
      ) : null}
    </View>
  );
}
