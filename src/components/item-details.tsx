import Ionicons from '@react-native-vector-icons/ionicons';
import { Text, View } from 'react-native';

import { DetailRow } from '@/components/expandable-item-card';
import { getCategoryIcon } from '@/constants/categories';
import { PRIORITY_LABELS } from '@/constants/labels';
import {
  APP_ACCENT,
  APP_SURFACE,
  APP_TEXT,
  APP_TEXT_MUTED,
} from '@/constants/app-colors';
import type { CalendarEvent, TaskItem } from '@/types/assistant';
import { getTaskTimeLabel } from '@/utils/agenda-utils';
import { formatLongDate } from '@/utils/date-utils';

function CategoryDetailRow({ category }: { category: string }) {
  return (
    <View className="flex-row items-start gap-2.5">
      <Ionicons name="folder-outline" size={16} color={APP_ACCENT} style={{ marginTop: 2 }} />
      <View className="flex-1 gap-1">
        <Text className="text-[11px]" style={{ color: APP_TEXT_MUTED }}>
          Categoría
        </Text>
        <View
          className="flex-row items-center gap-2 self-start rounded-lg border px-2.5 py-1"
          style={{ borderColor: 'rgba(196,181,253,0.28)', backgroundColor: APP_SURFACE }}>
          <Ionicons name={getCategoryIcon(category) as never} size={13} color={APP_ACCENT} />
          <Text className="text-[13px] font-semibold" style={{ color: APP_ACCENT }}>
            {category}
          </Text>
        </View>
      </View>
    </View>
  );
}

export function TaskDetailsContent({ task }: { task: TaskItem }) {
  const timeLabel = getTaskTimeLabel(task);
  const dateLabel = task.scheduledAt
    ? formatLongDate(task.scheduledAt)
    : 'Sin fecha (pendiente abierto)';

  return (
    <View className="gap-2.5">
      <DetailRow label="Título" value={task.title} icon="bookmark-outline" />
      {task.description ? (
        <DetailRow label="Descripción" value={task.description} icon="document-text-outline" />
      ) : null}
      <DetailRow label="Fecha" value={dateLabel} icon="calendar-outline" />
      {timeLabel ? <DetailRow label="Hora" value={timeLabel} icon="time-outline" /> : null}
      {task.project ? (
        <DetailRow label="Proyecto" value={task.project} icon="folder-outline" />
      ) : null}
      {task.completedAt ? (
        <DetailRow
          label="Completada"
          value={formatLongDate(task.completedAt.slice(0, 10))}
          icon="checkbox-outline"
        />
      ) : null}
      <CategoryDetailRow category={task.category} />
      <DetailRow label="Prioridad" value={PRIORITY_LABELS[task.priority]} icon="flag-outline" />
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
        <DetailRow
          label="Etiquetas"
          value={task.tags.map((tag) => `#${tag}`).join(' ')}
          icon="pricetag-outline"
        />
      ) : null}
      {task.subtasks && task.subtasks.length > 0 ? (
        <View className="gap-1.5">
          <Text className="text-[11px]" style={{ color: APP_TEXT_MUTED }}>
            Subtareas
          </Text>
          {task.subtasks.map((sub) => (
            <Text key={sub.id} className="text-[13px]" style={{ color: APP_TEXT }}>
              {sub.completed ? '✓' : '○'} {sub.title}
            </Text>
          ))}
        </View>
      ) : null}
    </View>
  );
}

export function EventDetailsContent({ event }: { event: CalendarEvent }) {
  const isDevice = event.source === 'device' || event.readOnly === true;
  const kindLabel = isDevice
    ? 'Calendario'
    : event.type === 'meeting'
      ? 'Cita'
      : event.type === 'reminder'
        ? 'Aviso'
        : 'Evento';

  return (
    <View className="gap-2.5">
      <DetailRow label="Título" value={event.title} icon="bookmark-outline" />
      <DetailRow label="Tipo" value={kindLabel} icon="pricetag-outline" />
      <DetailRow label="Fecha" value={formatLongDate(event.scheduledAt)} icon="calendar-outline" />
      <DetailRow
        label="Hora"
        value={event.endTime ? `${event.time} – ${event.endTime}` : event.time}
        icon="time-outline"
      />
      {event.description ? (
        <DetailRow label="Descripción" value={event.description} icon="document-text-outline" />
      ) : null}
      {event.location ? (
        <DetailRow label="Ubicación" value={event.location} icon="location-outline" />
      ) : null}
      {isDevice ? (
        <DetailRow
          label="Origen"
          value={
            event.calendarName ? `Calendario · ${event.calendarName}` : 'Calendario del teléfono'
          }
          icon="calendar-outline"
        />
      ) : (
        <DetailRow
          label="Estado"
          value={event.status === 'completed' ? 'Completado' : 'Pendiente'}
          icon="checkbox-outline"
        />
      )}
    </View>
  );
}
