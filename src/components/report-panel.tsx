import Ionicons from '@react-native-vector-icons/ionicons';
import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, View } from 'react-native';

import { DateRangeCalendar } from '@/components/date-range-calendar';
import { REPORT_PRESET_LABELS } from '@/constants/mock-data';
import { useAuth } from '@/context/auth-context';
import { useAssistant } from '@/context/assistant-context';
import {
  buildProductivityReport,
  filterTasksByRange,
} from '@/services/report-analytics';
import { exportReportPdf } from '@/services/report-pdf';
import type { DateRange, ReportPreset } from '@/types/assistant';
import { formatRangeLabel, getPresetRange, todayIso } from '@/utils/date-utils';

const REPORT_PRESETS: ReportPreset[] = ['week', 'month', 'quarter', 'year', 'custom'];

export function ReportPanel() {
  const { user } = useAuth();
  const { tasks } = useAssistant();
  const [expanded, setExpanded] = useState(false);
  const [range, setRange] = useState<DateRange>(getPresetRange('month', todayIso()));
  const [preset, setPreset] = useState<ReportPreset>('month');
  const [showCalendar, setShowCalendar] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const report = useMemo(
    () => buildProductivityReport(tasks, range, user?.name ?? 'Usuario'),
    [tasks, range, user?.name],
  );

  const scopedTasks = useMemo(() => filterTasksByRange(tasks, range), [tasks, range]);

  function handlePresetChange(nextPreset: ReportPreset) {
    setPreset(nextPreset);
    if (nextPreset === 'custom') {
      setShowCalendar(true);
      setExpanded(true);
      return;
    }
    setShowCalendar(false);
    setRange(getPresetRange(nextPreset, todayIso()));
  }

  async function handleExportPdf() {
    try {
      setIsExporting(true);
      await exportReportPdf(report, scopedTasks, preset);
    } catch (error) {
      Alert.alert(
        'No se pudo exportar',
        error instanceof Error ? error.message : 'Intenta de nuevo en unos segundos.',
      );
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <View className="overflow-hidden rounded-[28px] border border-border bg-surface dark:border-border-dark dark:bg-surface-dark">
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        onPress={() => setExpanded((prev) => !prev)}
        className="flex-row items-center gap-4 p-5 active:opacity-90">
        <View className="h-12 w-12 items-center justify-center rounded-2xl bg-muted dark:bg-muted-dark">
          <Ionicons name="bar-chart-outline" size={24} color="#7C3AED" />
        </View>
        <View className="flex-1 gap-0.5">
          <Text className="text-base font-semibold text-foreground dark:text-foreground-dark">
            Reporte de productividad
          </Text>
          <Text className="text-sm text-subtle dark:text-subtle-dark">
            {report.completedTasks}/{report.totalTasks} completadas · {report.efficiencyScore}%
            eficiencia
          </Text>
        </View>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={22}
          color="#6B6475"
        />
      </Pressable>

      {expanded ? (
        <View className="gap-4 border-t border-border px-5 pb-5 pt-4 dark:border-border-dark">
          <Text className="text-sm text-subtle dark:text-subtle-dark">
            {formatRangeLabel(range)}
          </Text>

          <View className="flex-row flex-wrap gap-2">
            {REPORT_PRESETS.map((item) => (
              <Pressable
                key={item}
                accessibilityRole="button"
                onPress={() => handlePresetChange(item)}
                className={`rounded-full px-3 py-2 ${
                  preset === item
                    ? 'bg-brand dark:bg-brand-dark'
                    : 'border border-border bg-canvas dark:border-border-dark dark:bg-canvas-dark'
                }`}>
                <Text
                  className={`text-xs font-semibold ${
                    preset === item ? 'text-white' : 'text-brand dark:text-brand-dark'
                  }`}>
                  {REPORT_PRESET_LABELS[item]}
                </Text>
              </Pressable>
            ))}
          </View>

          {showCalendar ? (
            <DateRangeCalendar
              range={range}
              onChange={(nextRange) => {
                setRange(nextRange);
                setPreset('custom');
              }}
            />
          ) : null}

          <View className="flex-row flex-wrap gap-3">
            <MetricCard label="Completadas" value={`${report.completedTasks}/${report.totalTasks}`} />
            <MetricCard label="Eficiencia" value={`${report.efficiencyScore}%`} />
            <MetricCard label="Completado" value={`${report.completionRate}%`} />
          </View>

          {report.busiestWeekday ? (
            <InsightRow
              icon="calendar-outline"
              text={`Día con más tareas: ${report.busiestWeekday} (${report.busiestWeekdayCount})`}
            />
          ) : null}

          {report.slowestCategory ? (
            <InsightRow
              icon="time-outline"
              text={`Categoría más lenta: ${report.slowestCategory}`}
            />
          ) : null}

          {report.mostRepeatedTaskTitle ? (
            <InsightRow
              icon="repeat-outline"
              text={`Tarea más repetida: ${report.mostRepeatedTaskTitle}`}
            />
          ) : null}

          {report.recommendations.length > 0 ? (
            <View className="gap-2 rounded-2xl bg-surface-soft p-4 dark:bg-surface-soft-dark">
              <Text className="text-xs font-semibold uppercase text-brand dark:text-brand-dark">
                Recomendaciones
              </Text>
              {report.recommendations.map((tip) => (
                <Text
                  key={tip}
                  className="text-sm leading-6 text-foreground dark:text-foreground-dark">
                  • {tip}
                </Text>
              ))}
            </View>
          ) : null}

          <Pressable
            accessibilityRole="button"
            onPress={handleExportPdf}
            disabled={isExporting || report.totalTasks === 0}
            className={`min-h-[48px] flex-row items-center justify-center gap-2 rounded-2xl bg-brand active:opacity-85 dark:bg-brand-dark ${
              isExporting || report.totalTasks === 0 ? 'opacity-50' : ''
            }`}>
            {isExporting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Ionicons name="download-outline" size={18} color="#FFFFFF" />
            )}
            <Text className="text-sm font-semibold text-white">
              {isExporting ? 'Generando PDF...' : 'Descargar PDF'}
            </Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <View className="min-w-[90px] flex-1 rounded-2xl border border-border bg-canvas p-3 dark:border-border-dark dark:bg-canvas-dark">
      <Text className="text-xs text-subtle dark:text-subtle-dark">{label}</Text>
      <Text className="text-base font-bold text-brand dark:text-brand-dark">{value}</Text>
    </View>
  );
}

function InsightRow({
  icon,
  text,
}: {
  icon: 'calendar-outline' | 'time-outline' | 'repeat-outline';
  text: string;
}) {
  return (
    <View className="flex-row items-center gap-3 rounded-2xl bg-canvas p-3 dark:bg-canvas-dark">
      <Ionicons name={icon} size={18} color="#7C3AED" />
      <Text className="flex-1 text-sm text-foreground dark:text-foreground-dark">{text}</Text>
    </View>
  );
}
