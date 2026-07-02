import Ionicons from '@react-native-vector-icons/ionicons';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { ScreenSafeArea } from '@/components/screen-safe-area';

import { ExpandableItemCard, DetailRow } from '@/components/expandable-item-card';
import { ScreenHeader } from '@/components/screen-header';
import { useAssistant } from '@/context/assistant-context';
import type { MemoryRecord } from '@/types/record';
import { filterMemoryRecords, type MemoryTypeFilter } from '@/utils/memory-filter';

const TYPE_LABELS: Record<MemoryRecord['type'], string> = {
  task: 'Tarea',
  reminder: 'Recordatorio',
  meeting: 'Reunión',
  expense: 'Gasto',
  income: 'Ingreso',
  note: 'Nota',
  idea: 'Idea',
};

function formatRecordMeta(record: MemoryRecord): string {
  const parts: string[] = [];
  if (record.dueLabel) parts.push(record.dueLabel);
  else if (record.time) parts.push(record.time);
  if (record.category) parts.push(record.category);
  if (record.amount !== undefined) {
    parts.push(`${record.amount}${record.currency ? ` ${record.currency}` : ''}`);
  }
  return parts.join(' · ');
}

const TYPE_FILTERS: { id: MemoryTypeFilter; label: string }[] = [
  { id: 'all', label: 'Todo' },
  { id: 'task', label: 'Tareas' },
  { id: 'meeting', label: 'Reuniones' },
  { id: 'reminder', label: 'Recordatorios' },
  { id: 'expense', label: 'Gastos' },
  { id: 'note', label: 'Notas' },
];

export default function MemoryScreen() {
  const { records, isRecordsLoading, recordsError } = useAssistant();
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<MemoryTypeFilter>('all');

  const sortedRecords = useMemo(
    () =>
      [...records].sort((a, b) =>
        (b.scheduledAt ?? b.createdAt ?? '').localeCompare(a.scheduledAt ?? a.createdAt ?? ''),
      ),
    [records],
  );

  const filteredRecords = useMemo(
    () => filterMemoryRecords(sortedRecords, searchQuery, typeFilter),
    [sortedRecords, searchQuery, typeFilter],
  );

  return (
    <ScreenSafeArea>
      <ScreenHeader
        title="Memoria"
        subtitle="Todo lo que has registrado, en orden cronológico"
      />
      <ScrollView contentContainerClassName="w-full max-w-3xl gap-3 self-center px-6 pb-36 pt-4">
        <View className="gap-3">
          <View className="flex-row items-center rounded-2xl border border-border bg-surface px-4 dark:border-border-dark dark:bg-surface-dark">
            <Ionicons name="search-outline" size={18} color="#6B6475" />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Buscar en tu memoria..."
              placeholderTextColor="#94A3B8"
              className="flex-1 px-3 py-3 text-base text-foreground dark:text-foreground-dark"
              autoCapitalize="none"
              autoCorrect={false}
              clearButtonMode="while-editing"
            />
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
            {TYPE_FILTERS.map((filter) => {
              const isActive = typeFilter === filter.id;
              return (
                <Pressable
                  key={filter.id}
                  accessibilityRole="button"
                  onPress={() => setTypeFilter(filter.id)}
                  className={`rounded-full border px-4 py-2 ${
                    isActive
                      ? 'border-brand bg-brand dark:border-brand-dark dark:bg-brand-dark'
                      : 'border-border bg-surface dark:border-border-dark dark:bg-surface-dark'
                  }`}>
                  <Text
                    className={`text-sm font-medium ${
                      isActive ? 'text-white' : 'text-subtle dark:text-subtle-dark'
                    }`}>
                    {filter.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {recordsError ? (
          <View className="rounded-2xl border border-danger/30 bg-danger/5 p-4">
            <Text className="text-sm text-danger dark:text-danger-dark">{recordsError}</Text>
          </View>
        ) : null}

        {isRecordsLoading ? (
          <Text className="text-center text-subtle dark:text-subtle-dark">Cargando memoria...</Text>
        ) : sortedRecords.length === 0 ? (
          <View className="items-center gap-3 rounded-[28px] border border-dashed border-border p-10 dark:border-border-dark">
            <Ionicons name="time-outline" size={40} color="#6B6475" />
            <Text className="text-center text-subtle dark:text-subtle-dark">
              Aún no hay registros. Habla con tu asistente desde Inicio.
            </Text>
          </View>
        ) : filteredRecords.length === 0 ? (
          <View className="items-center gap-3 rounded-[28px] border border-dashed border-border p-10 dark:border-border-dark">
            <Ionicons name="search-outline" size={40} color="#6B6475" />
            <Text className="text-center text-subtle dark:text-subtle-dark">
              No encontramos resultados para tu búsqueda.
            </Text>
          </View>
        ) : (
          filteredRecords.map((record) => (
            <ExpandableItemCard
              key={record.id}
              expandedContent={
                <View className="gap-2">
                  {record.description ? (
                    <DetailRow
                      label="Descripción"
                      value={record.description}
                      icon="document-text-outline"
                    />
                  ) : null}
                  {record.scheduledAt ? (
                    <DetailRow label="Fecha" value={record.scheduledAt} icon="calendar-outline" />
                  ) : null}
                  {record.category ? (
                    <DetailRow label="Categoría" value={record.category} icon="folder-outline" />
                  ) : null}
                  {record.client ? (
                    <DetailRow label="Cliente" value={record.client} icon="bookmark-outline" />
                  ) : null}
                  {record.project ? (
                    <DetailRow label="Proyecto" value={record.project} icon="folder-outline" />
                  ) : null}
                  {record.status ? (
                    <DetailRow
                      label="Estado"
                      value={record.status === 'completed' ? 'Completada' : 'Pendiente'}
                      icon="checkbox-outline"
                    />
                  ) : null}
                </View>
              }>
              <View className="gap-1">
                <Text className="text-xs font-semibold uppercase text-brand dark:text-brand-dark">
                  {TYPE_LABELS[record.type]}
                </Text>
                <Text className="text-base font-semibold text-foreground dark:text-foreground-dark">
                  {record.title}
                </Text>
                {formatRecordMeta(record) ? (
                  <Text className="text-sm text-subtle dark:text-subtle-dark">
                    {formatRecordMeta(record)}
                  </Text>
                ) : null}
              </View>
            </ExpandableItemCard>
          ))
        )}
      </ScrollView>
    </ScreenSafeArea>
  );
}
