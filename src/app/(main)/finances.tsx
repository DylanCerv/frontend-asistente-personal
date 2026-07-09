import Ionicons from '@react-native-vector-icons/ionicons';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { ScreenSafeArea } from '@/components/screen-safe-area';

import { AgendaCalendar, CalendarBulkActions, useAgendaCalendarState, type VisibleMonth } from '@/components/agenda-calendar';
import { ScreenAccentBar } from '@/components/screen-accent-bar';
import { ExpandableItemCard, DetailRow } from '@/components/expandable-item-card';
import { ScreenHeader } from '@/components/screen-header';
import { useScreenAccent } from '@/constants/screen-themes';
import { useAssistant } from '@/context/assistant-context';
import { useAuth } from '@/context/auth-context';
import { useUserPreferences } from '@/context/user-preferences-context';
import {
  buildFinanceSummaryOnDates,
  formatMoney,
  getFinanceRecordsOnDates,
} from '@/services/finance-analytics';
import { buildFinanceReportHtml, sharePdfReport } from '@/services/report-export';
import type { MemoryRecord } from '@/types/record';
import {
  formatLongDate,
  formatSelectedDatesLabel,
  todayIso,
} from '@/utils/date-utils';

function FinanceSummaryCard({
  label,
  value,
  tone,
  accentColor,
}: {
  label: string;
  value: string;
  tone: 'income' | 'expense' | 'balance';
  accentColor?: string;
}) {
  const toneStyle =
    tone === 'income'
      ? { borderColor: accentColor ?? '#CA8A04', backgroundColor: 'rgba(202, 138, 4, 0.08)' }
      : tone === 'expense'
        ? undefined
        : undefined;

  const toneClass =
    tone === 'expense'
      ? 'border-danger/20 bg-danger/5'
      : tone === 'balance'
        ? 'border-border bg-surface'
        : '';

  return (
    <View
      className={`flex-1 gap-1 rounded-2xl border p-4 dark:bg-surface-dark ${toneClass}`}
      style={toneStyle}>
      <Text className="text-xs font-semibold uppercase text-subtle dark:text-subtle-dark">
        {label}
      </Text>
      <Text className="text-xl font-bold text-foreground dark:text-foreground-dark">{value}</Text>
    </View>
  );
}

function FinanceRecordCard({ record, accentColor }: { record: MemoryRecord; accentColor: string }) {
  const isIncome = record.type === 'income';
  const amount = typeof record.amount === 'number' ? record.amount : 0;
  const currency = record.currency ?? 'USD';
  const dateLabel = record.scheduledAt ? formatLongDate(record.scheduledAt) : 'Sin fecha';

  return (
    <ExpandableItemCard
      expandedContent={
        <View className="gap-2">
          {record.description ? (
            <DetailRow label="Descripción" value={record.description} icon="document-text-outline" />
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
          <DetailRow label="Fecha" value={dateLabel} icon="calendar-outline" />
        </View>
      }>
      <View className="flex-row items-center gap-3">
        <View className="h-10 w-10 items-center justify-center rounded-xl bg-muted dark:bg-muted-dark">
          <Ionicons
            name={isIncome ? 'arrow-down-circle-outline' : 'arrow-up-circle-outline'}
            size={20}
            color={isIncome ? accentColor : '#DC2626'}
          />
        </View>
        <View className="flex-1 gap-0.5">
          <Text className="text-[15px] font-semibold text-foreground dark:text-foreground-dark">
            {record.title}
          </Text>
          <Text className="text-xs text-subtle dark:text-subtle-dark">
            {isIncome ? 'Ingreso' : 'Gasto'}
            {record.category ? ` · ${record.category}` : ''}
          </Text>
        </View>
        <Text
          className={`text-base font-bold ${isIncome ? '' : 'text-danger dark:text-danger-dark'}`}
          style={isIncome ? { color: accentColor } : undefined}>
          {isIncome ? '+' : '-'}
          {formatMoney(Math.abs(amount), currency)}
        </Text>
      </View>
    </ExpandableItemCard>
  );
}

function getRecordDate(record: MemoryRecord): string {
  return record.scheduledAt ?? record.createdAt?.slice(0, 10) ?? todayIso();
}

export default function FinancesScreen() {
  const { user } = useAuth();
  const { preferredName } = useUserPreferences();
  const { records, isRecordsLoading, recordsError, refreshRecords } = useAssistant();
  const { selectedDates, onChange } = useAgendaCalendarState(todayIso());
  const accent = useScreenAccent('finances');
  const [visibleMonth, setVisibleMonth] = useState<VisibleMonth>(() => {
    const today = new Date();
    return { year: today.getFullYear(), month: today.getMonth() };
  });
  const [isExporting, setIsExporting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const summary = useMemo(
    () => buildFinanceSummaryOnDates(records, selectedDates),
    [records, selectedDates],
  );
  const financeRecords = useMemo(
    () => getFinanceRecordsOnDates(records, selectedDates),
    [records, selectedDates],
  );

  const markedDates = useMemo(() => {
    const dates = new Set<string>();
    for (const record of records) {
      if (record.type === 'expense' || record.type === 'income') {
        dates.add(getRecordDate(record));
      }
    }
    return Array.from(dates);
  }, [records]);

  const periodLabel = useMemo(() => formatSelectedDatesLabel(selectedDates), [selectedDates]);

  const displayName = preferredName.trim() || user?.name || 'Usuario';

  async function handleDownload() {
    setIsExporting(true);
    try {
      const html = buildFinanceReportHtml({
        displayName,
        periodLabel,
        records: financeRecords,
        income: summary.income,
        expense: summary.expense,
        balance: summary.balance,
        currency: summary.currency,
      });
      await sharePdfReport(`Finanzas ${periodLabel}`, html);
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
      <ScreenHeader
        title="Finanzas"
        subtitle={`${periodLabel} · ${summary.transactionCount} movimientos`}
        accent={accent}
      />
      <ScreenAccentBar accent={accent} />
      <ScrollView
        contentContainerClassName="w-full max-w-3xl gap-5 self-center px-6 pb-36 pt-4"
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing || isRecordsLoading}
            onRefresh={handleRefresh}
            tintColor={accent.main}
            colors={[accent.main]}
          />
        }>
        <AgendaCalendar
          selectedDates={selectedDates}
          markedDates={markedDates}
          onChange={onChange}
          onVisibleMonthChange={setVisibleMonth}
          accent={accent}
          footerContent={
            <CalendarBulkActions
              selectedDates={selectedDates}
              visibleMonth={visibleMonth}
              onChange={onChange}
              accent={accent}
            />
          }
        />

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Descargar reporte financiero"
          onPress={handleDownload}
          disabled={isExporting}
          className="flex-row items-center justify-center gap-2 rounded-2xl px-4 py-3.5 active:opacity-90"
          style={{ backgroundColor: accent.main }}>
          {isExporting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Ionicons name="download-outline" size={18} color="#FFFFFF" />
          )}
          <Text className="text-sm font-semibold text-white">
            {isExporting ? 'Generando PDF...' : 'Descargar reporte PDF'}
          </Text>
        </Pressable>

        {recordsError ? (
          <View className="rounded-2xl border border-danger/30 bg-danger/5 p-4">
            <Text className="text-sm text-danger dark:text-danger-dark">{recordsError}</Text>
          </View>
        ) : null}

        <View className="flex-row gap-3">
          <FinanceSummaryCard
            label="Ingresos"
            value={formatMoney(summary.income, summary.currency)}
            tone="income"
            accentColor={accent.main}
          />
          <FinanceSummaryCard
            label="Gastos"
            value={formatMoney(summary.expense, summary.currency)}
            tone="expense"
          />
        </View>

        <View className="rounded-2xl border border-border bg-surface p-4 dark:border-border-dark dark:bg-surface-dark">
          <Text className="text-xs font-semibold uppercase text-subtle dark:text-subtle-dark">
            Balance del periodo
          </Text>
          <Text
            className={`mt-1 text-2xl font-bold ${
              summary.balance >= 0 ? '' : 'text-danger dark:text-danger-dark'
            }`}
            style={summary.balance >= 0 ? { color: accent.main } : undefined}>
            {formatMoney(summary.balance, summary.currency)}
          </Text>
        </View>

        {isRecordsLoading ? (
          <Text className="text-center text-subtle dark:text-subtle-dark">Cargando movimientos...</Text>
        ) : financeRecords.length === 0 ? (
          <View className="items-center gap-3 rounded-[28px] border border-dashed p-10" style={{ borderColor: accent.border }}>
            <Ionicons name="wallet-outline" size={40} color={accent.main} />
            <Text className="text-center text-subtle dark:text-subtle-dark">
              {selectedDates.length === 0
                ? 'Selecciona al menos un día en el calendario.'
                : 'No hay movimientos en las fechas seleccionadas. Di algo como "Gasté 80 dólares en gasolina" desde Inicio.'}
            </Text>
          </View>
        ) : (
          <View className="gap-3">
            <Text className="text-base font-semibold text-foreground dark:text-foreground-dark">
              Movimientos del periodo
            </Text>
            {financeRecords.map((record) => (
              <FinanceRecordCard key={record.id} record={record} accentColor={accent.main} />
            ))}
          </View>
        )}
      </ScrollView>
    </ScreenSafeArea>
  );
}
