import Ionicons from '@react-native-vector-icons/ionicons';
import { useMemo } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { ScreenSafeArea } from '@/components/screen-safe-area';

import { ExpandableItemCard, DetailRow } from '@/components/expandable-item-card';
import { ScreenHeader } from '@/components/screen-header';
import { useAssistant } from '@/context/assistant-context';
import {
  buildMonthlyFinanceSummary,
  formatMoney,
  getFinanceRecords,
} from '@/services/finance-analytics';
import type { MemoryRecord } from '@/types/record';
import { formatLongDate, todayIso } from '@/utils/date-utils';

function FinanceSummaryCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: 'income' | 'expense' | 'balance';
}) {
  const toneClass =
    tone === 'income'
      ? 'border-brand/30 bg-surface-soft'
      : tone === 'expense'
        ? 'border-danger/20 bg-danger/5'
        : 'border-border bg-surface';

  return (
    <View className={`flex-1 gap-1 rounded-2xl border p-4 dark:bg-surface-dark ${toneClass}`}>
      <Text className="text-xs font-semibold uppercase text-subtle dark:text-subtle-dark">
        {label}
      </Text>
      <Text className="text-xl font-bold text-foreground dark:text-foreground-dark">{value}</Text>
    </View>
  );
}

function FinanceRecordCard({ record }: { record: MemoryRecord }) {
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
            color={isIncome ? '#7C3AED' : '#DC2626'}
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
          className={`text-base font-bold ${
            isIncome ? 'text-brand dark:text-brand-dark' : 'text-danger dark:text-danger-dark'
          }`}>
          {isIncome ? '+' : '-'}
          {formatMoney(Math.abs(amount), currency)}
        </Text>
      </View>
    </ExpandableItemCard>
  );
}

export default function FinancesScreen() {
  const { records, isRecordsLoading, recordsError } = useAssistant();

  const summary = useMemo(
    () => buildMonthlyFinanceSummary(records, todayIso()),
    [records],
  );

  const financeRecords = useMemo(() => getFinanceRecords(records), [records]);

  return (
    <ScreenSafeArea>
      <ScreenHeader
        title="Finanzas"
        subtitle={`Resumen del mes · ${summary.transactionCount} movimientos`}
      />
      <ScrollView contentContainerClassName="w-full max-w-3xl gap-5 self-center px-6 pb-36 pt-4">
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
          />
          <FinanceSummaryCard
            label="Gastos"
            value={formatMoney(summary.expense, summary.currency)}
            tone="expense"
          />
        </View>

        <View className="rounded-2xl border border-border bg-surface p-4 dark:border-border-dark dark:bg-surface-dark">
          <Text className="text-xs font-semibold uppercase text-subtle dark:text-subtle-dark">
            Balance del mes
          </Text>
          <Text
            className={`mt-1 text-2xl font-bold ${
              summary.balance >= 0
                ? 'text-brand dark:text-brand-dark'
                : 'text-danger dark:text-danger-dark'
            }`}>
            {formatMoney(summary.balance, summary.currency)}
          </Text>
        </View>

        {isRecordsLoading ? (
          <Text className="text-center text-subtle dark:text-subtle-dark">Cargando movimientos...</Text>
        ) : financeRecords.length === 0 ? (
          <View className="items-center gap-3 rounded-[28px] border border-dashed border-border p-10 dark:border-border-dark">
            <Ionicons name="wallet-outline" size={40} color="#6B6475" />
            <Text className="text-center text-subtle dark:text-subtle-dark">
              Di algo como &quot;Gasté 80 dólares en gasolina&quot; desde Inicio y aparecerá aquí.
            </Text>
          </View>
        ) : (
          <View className="gap-3">
            <Text className="text-base font-semibold text-foreground dark:text-foreground-dark">
              Movimientos recientes
            </Text>
            {financeRecords.map((record) => (
              <FinanceRecordCard key={record.id} record={record} />
            ))}
          </View>
        )}
      </ScrollView>
    </ScreenSafeArea>
  );
}
