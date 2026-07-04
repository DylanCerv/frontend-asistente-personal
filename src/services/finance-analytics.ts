import type { MemoryRecord } from '@/types/record';
import {
  addDays,
  endOfMonth,
  isDateInRange,
  startOfMonth,
  todayIso,
  type DateRange,
} from '@/utils/date-utils';

export type FinanceSummary = {
  income: number;
  expense: number;
  balance: number;
  currency: string;
  transactionCount: number;
};

function isFinanceRecord(record: MemoryRecord): boolean {
  return record.type === 'expense' || record.type === 'income';
}

function getRecordDate(record: MemoryRecord): string {
  return record.scheduledAt ?? record.createdAt?.slice(0, 10) ?? todayIso();
}

function getAmount(record: MemoryRecord): number {
  if (typeof record.amount !== 'number' || Number.isNaN(record.amount)) return 0;
  return Math.abs(record.amount);
}

function getCurrency(records: MemoryRecord[]): string {
  const withCurrency = records.find((record) => record.currency?.trim());
  return withCurrency?.currency ?? 'USD';
}

export function getFinanceRecords(records: MemoryRecord[]): MemoryRecord[] {
  return records
    .filter(isFinanceRecord)
    .sort((a, b) => getRecordDate(b).localeCompare(getRecordDate(a)));
}

export function getFinanceRecordsInRange(
  records: MemoryRecord[],
  range: DateRange,
): MemoryRecord[] {
  return getFinanceRecords(records).filter((record) =>
    isDateInRange(getRecordDate(record), range),
  );
}

export function buildFinanceSummary(
  records: MemoryRecord[],
  range: DateRange,
): FinanceSummary {
  const financeRecords = getFinanceRecordsInRange(records, range);

  let income = 0;
  let expense = 0;

  for (const record of financeRecords) {
    const amount = getAmount(record);
    if (record.type === 'income') income += amount;
    if (record.type === 'expense') expense += amount;
  }

  return {
    income,
    expense,
    balance: income - expense,
    currency: getCurrency(financeRecords),
    transactionCount: financeRecords.length,
  };
}

export function buildMonthlyFinanceSummary(
  records: MemoryRecord[],
  referenceDate = todayIso(),
): FinanceSummary {
  return buildFinanceSummary(records, {
    start: startOfMonth(referenceDate),
    end: endOfMonth(referenceDate),
  });
}

export function buildSpendingWeekComparison(records: MemoryRecord[]): {
  currentWeekExpense: number;
  previousWeekExpense: number;
  percentChange: number | null;
} {
  const today = todayIso();
  const currentWeekStart = addDays(today, -6);
  const previousWeekStart = addDays(today, -13);
  const previousWeekEnd = addDays(today, -7);

  let currentWeekExpense = 0;
  let previousWeekExpense = 0;

  for (const record of getFinanceRecords(records)) {
    if (record.type !== 'expense') continue;
    const date = getRecordDate(record);
    const amount = getAmount(record);

    if (date >= currentWeekStart && date <= today) {
      currentWeekExpense += amount;
    } else if (date >= previousWeekStart && date <= previousWeekEnd) {
      previousWeekExpense += amount;
    }
  }

  if (previousWeekExpense === 0) {
    return { currentWeekExpense, previousWeekExpense, percentChange: null };
  }

  const percentChange = Math.round(
    ((currentWeekExpense - previousWeekExpense) / previousWeekExpense) * 100,
  );

  return { currentWeekExpense, previousWeekExpense, percentChange };
}

export function formatMoney(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat('es', {
      style: 'currency',
      currency: currency.length === 3 ? currency : 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${amount} ${currency}`;
  }
}
