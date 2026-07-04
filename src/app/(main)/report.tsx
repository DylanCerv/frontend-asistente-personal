import Ionicons from '@react-native-vector-icons/ionicons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';

import { DateRangePicker, useDateRangeState } from '@/components/date-range-picker';
import { ScreenHeader } from '@/components/screen-header';
import { ScreenSafeArea } from '@/components/screen-safe-area';
import { PRIORITY_LABELS } from '@/constants/labels';
import { useAssistant } from '@/context/assistant-context';
import { useUserPreferences } from '@/context/user-preferences-context';
import { useAuth } from '@/context/auth-context';
import { buildProgressReport } from '@/services/progress-report';
import { buildProgressReportHtml, sharePdfReport } from '@/services/report-export';
import { filterTasksByRange } from '@/utils/agenda-utils';
import { formatLongDate, formatRangeLabel, isDateInRange } from '@/utils/date-utils';

function ProgressBar({ percent }: { percent: number }) {
  return (
    <View className="h-3 overflow-hidden rounded-full bg-muted dark:bg-muted-dark">
      <View
        className="h-full rounded-full bg-brand dark:bg-brand-dark"
        style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
      />
    </View>
  );
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <View className="min-w-[46%] flex-1 gap-1 rounded-2xl border border-border bg-surface p-4 dark:border-border-dark dark:bg-surface-dark">
      <Text className="text-xs font-medium text-subtle dark:text-subtle-dark">{label}</Text>
      <Text className="text-2xl font-bold text-foreground dark:text-foreground-dark">{value}</Text>
      {hint ? (
        <Text className="text-xs text-subtle dark:text-subtle-dark">{hint}</Text>
      ) : null}
    </View>
  );
}

export default function ReportScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { preferredName } = useUserPreferences();
  const { tasks, events, records, isRecordsLoading, refreshRecords } = useAssistant();
  const { preset, range, onChange } = useDateRangeState('week');
  const [isExporting, setIsExporting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const report = useMemo(
    () => buildProgressReport(tasks, events, records, range),
    [tasks, events, records, range],
  );

  const rangeTasks = useMemo(() => filterTasksByRange(tasks, range), [tasks, range]);
  const rangeEvents = useMemo(
    () => events.filter((event) => isDateInRange(event.scheduledAt, range)),
    [events, range],
  );

  const displayName = preferredName.trim() || user?.name || 'Usuario';
  const statusLabel =
    report.progressPercent >= 80
      ? 'Excelente ritmo'
      : report.progressPercent >= 50
        ? 'Buen avance'
        : report.progressPercent > 0
          ? 'Vas en camino'
          : 'Aún no hay tareas completadas';

  async function handleDownload() {
    setIsExporting(true);
    try {
      const html = buildProgressReportHtml({
        displayName,
        range,
        tasks: rangeTasks,
        events: rangeEvents,
      });
      await sharePdfReport(`Reporte ${formatRangeLabel(range)}`, html);
    } finally {
      setIsExporting(false);
    }
  }

  async function handleRefresh() {
    setIsRefreshing(true);
    try {
      await refreshRecords();
    } finally {
      setIsRefreshing(false);
    }
  }

  return (
    <ScreenSafeArea>
      <ScreenHeader title="Reporte" subtitle="Tu avance real, en un vistazo" />
      <ScrollView
        contentContainerClassName="w-full max-w-3xl gap-5 self-center px-6 pb-36 pt-2"
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing || isRecordsLoading}
            onRefresh={handleRefresh}
            tintColor="#7C3AED"
            colors={['#7C3AED']}
          />
        }>
        <DateRangePicker preset={preset} range={range} onChange={onChange} />

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Descargar reporte"
          onPress={handleDownload}
          disabled={isExporting}
          className="flex-row items-center justify-center gap-2 rounded-2xl bg-brand px-4 py-3.5 active:opacity-90 dark:bg-brand-dark">
          {isExporting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Ionicons name="download-outline" size={18} color="#FFFFFF" />
          )}
          <Text className="text-sm font-semibold text-white">
            {isExporting ? 'Generando PDF...' : 'Descargar reporte PDF'}
          </Text>
        </Pressable>

        <View className="gap-4 rounded-[28px] border border-border bg-surface p-5 dark:border-border-dark dark:bg-surface-dark">
          <View className="flex-row items-center gap-3">
            <View className="h-11 w-11 items-center justify-center rounded-2xl bg-surface-soft dark:bg-surface-soft-dark">
              <Ionicons name="stats-chart-outline" size={22} color="#7C3AED" />
            </View>
            <View className="flex-1 gap-0.5">
              <Text className="text-lg font-bold text-foreground dark:text-foreground-dark">
                Hola, {displayName}
              </Text>
              <Text className="text-sm text-subtle dark:text-subtle-dark">{statusLabel}</Text>
            </View>
            <Text className="text-3xl font-bold text-brand dark:text-brand-dark">
              {report.progressPercent}%
            </Text>
          </View>

          <ProgressBar percent={report.progressPercent} />

          <Text className="text-sm leading-6 text-subtle dark:text-subtle-dark">
            {report.completedTasks} de {report.totalTasks} tareas completadas en{' '}
            {formatRangeLabel(range)}.
            {report.pendingTasks > 0
              ? ` Te quedan ${report.pendingTasks} pendientes.`
              : ' No tienes pendientes por ahora.'}
          </Text>
        </View>

        <View className="flex-row flex-wrap gap-3">
          <StatCard label="Completadas" value={report.completedTasks} />
          <StatCard label="Pendientes" value={report.pendingTasks} />
          <StatCard
            label="Urgentes"
            value={report.highPriorityPending}
            hint="Prioridad alta"
          />
          <StatCard
            label="Vencen hoy"
            value={report.dueTodayPending}
            hint={report.overduePending > 0 ? `${report.overduePending} atrasadas` : 'Al día'}
          />
        </View>

        <View className="gap-3 rounded-[28px] border border-border bg-surface p-5 dark:border-border-dark dark:bg-surface-dark">
          <Text className="text-base font-semibold text-foreground dark:text-foreground-dark">
            En este periodo
          </Text>
          <View className="flex-row gap-3">
            <StatCard label="Completadas" value={report.completedInRange} />
            <StatCard label="Eventos" value={report.eventsInRange} />
          </View>
          <View className="flex-row gap-3">
            <StatCard label="Próximos eventos" value={report.upcomingEvents} />
            <StatCard label="Movimientos" value={report.financeRecords} />
          </View>
        </View>

        <View className="gap-3 rounded-[28px] border border-border bg-surface p-5 dark:border-border-dark dark:bg-surface-dark">
          <Text className="text-base font-semibold text-foreground dark:text-foreground-dark">
            Pendientes por prioridad
          </Text>
          <PriorityRow label="Alta" count={report.highPriorityPending} tone="danger" />
          <PriorityRow label="Media" count={report.mediumPriorityPending} tone="brand" />
          <PriorityRow label="Baja" count={report.lowPriorityPending} tone="subtle" />
        </View>

        {report.pendingTaskList.length > 0 ? (
          <View className="gap-3 rounded-[28px] border border-border bg-surface p-5 dark:border-border-dark dark:bg-surface-dark">
            <Text className="text-base font-semibold text-foreground dark:text-foreground-dark">
              Tareas pendientes
            </Text>
            {report.pendingTaskList.map((task, index) => (
              <Pressable
                key={task.id}
                accessibilityRole="button"
                accessibilityLabel={`Ver detalle de ${task.title}`}
                onPress={() =>
                  router.push({ pathname: '/agenda', params: { taskId: task.id } })
                }
                className="flex-row items-start gap-3 rounded-2xl bg-canvas px-3 py-3 active:opacity-85 dark:bg-canvas-dark">
                <Text className="text-sm font-semibold text-brand dark:text-brand-dark">
                  {index + 1}.
                </Text>
                <View className="min-w-0 flex-1 gap-0.5">
                  <Text className="text-sm font-semibold text-foreground dark:text-foreground-dark">
                    {task.title}
                  </Text>
                  <Text className="text-xs text-subtle dark:text-subtle-dark">
                    {PRIORITY_LABELS[task.priority]} · {task.category}
                    {task.scheduledAt ? ` · ${formatLongDate(task.scheduledAt)}` : ''}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#6B6475" />
              </Pressable>
            ))}
          </View>
        ) : (
          <View className="items-center gap-2 rounded-[28px] border border-border bg-surface p-8 dark:border-border-dark dark:bg-surface-dark">
            <Ionicons name="checkmark-circle-outline" size={32} color="#7C3AED" />
            <Text className="text-center text-base font-semibold text-foreground dark:text-foreground-dark">
              Sin pendientes
            </Text>
            <Text className="text-center text-sm text-subtle dark:text-subtle-dark">
              Habla con Kivo para crear nuevas tareas.
            </Text>
          </View>
        )}

        {report.completedTaskList.length > 0 ? (
          <View className="gap-3 rounded-[28px] border border-border bg-surface p-5 dark:border-border-dark dark:bg-surface-dark">
            <Text className="text-base font-semibold text-foreground dark:text-foreground-dark">
              Completadas en el periodo
            </Text>
            {report.completedTaskList.map((task) => (
              <Pressable
                key={task.id}
                accessibilityRole="button"
                onPress={() =>
                  router.push({ pathname: '/agenda', params: { taskId: task.id } })
                }
                className="flex-row items-center gap-3 rounded-2xl bg-canvas px-3 py-3 active:opacity-85 dark:bg-canvas-dark">
                <Ionicons name="checkmark-circle" size={18} color="#7C3AED" />
                <Text className="flex-1 text-sm text-foreground dark:text-foreground-dark">
                  {task.title}
                </Text>
                <Ionicons name="chevron-forward" size={16} color="#6B6475" />
              </Pressable>
            ))}
          </View>
        ) : null}
      </ScrollView>
    </ScreenSafeArea>
  );
}

function PriorityRow({
  label,
  count,
  tone,
}: {
  label: string;
  count: number;
  tone: 'danger' | 'brand' | 'subtle';
}) {
  const color =
    tone === 'danger' ? '#DC2626' : tone === 'brand' ? '#7C3AED' : '#6B6475';

  return (
    <View className="flex-row items-center justify-between rounded-2xl bg-canvas px-4 py-3 dark:bg-canvas-dark">
      <Text className="text-sm font-medium text-foreground dark:text-foreground-dark">{label}</Text>
      <Text className="text-sm font-bold" style={{ color }}>
        {count}
      </Text>
    </View>
  );
}
