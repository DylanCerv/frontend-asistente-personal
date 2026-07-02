export type DateRange = {
  start: string;
  end: string;
};

export type ReportPreset = 'week' | 'month' | 'quarter' | 'year' | 'custom';

export const WEEKDAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'] as const;

export const MONTH_LABELS = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
] as const;

export function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseIsoDate(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function addDays(iso: string, days: number): string {
  const date = parseIsoDate(iso);
  date.setDate(date.getDate() + days);
  return toIsoDate(date);
}

export function startOfWeek(iso: string): string {
  const date = parseIsoDate(iso);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return toIsoDate(date);
}

export function endOfWeek(iso: string): string {
  return addDays(startOfWeek(iso), 6);
}

export function startOfMonth(iso: string): string {
  const date = parseIsoDate(iso);
  return toIsoDate(new Date(date.getFullYear(), date.getMonth(), 1));
}

export function endOfMonth(iso: string): string {
  const date = parseIsoDate(iso);
  return toIsoDate(new Date(date.getFullYear(), date.getMonth() + 1, 0));
}

export function todayIso(): string {
  return toIsoDate(new Date());
}

export function daysAgoIso(days: number): string {
  return addDays(todayIso(), -days);
}

export function daysFromNowIso(days: number): string {
  return addDays(todayIso(), days);
}

export function isDateInRange(date: string, range: DateRange): boolean {
  return date >= range.start && date <= range.end;
}

export function getPresetRange(preset: ReportPreset, reference = todayIso()): DateRange {
  switch (preset) {
    case 'week':
      return { start: startOfWeek(reference), end: endOfWeek(reference) };
    case 'month':
      return { start: startOfMonth(reference), end: endOfMonth(reference) };
    case 'quarter': {
      const date = parseIsoDate(reference);
      const quarterStartMonth = Math.floor(date.getMonth() / 3) * 3;
      const start = toIsoDate(new Date(date.getFullYear(), quarterStartMonth, 1));
      const end = toIsoDate(new Date(date.getFullYear(), quarterStartMonth + 3, 0));
      return { start, end };
    }
    case 'year':
      return {
        start: toIsoDate(new Date(parseIsoDate(reference).getFullYear(), 0, 1)),
        end: toIsoDate(new Date(parseIsoDate(reference).getFullYear(), 11, 31)),
      };
    case 'custom':
    default:
      return { start: reference, end: reference };
  }
}

export function formatRangeLabel(range: DateRange): string {
  const start = parseIsoDate(range.start);
  const end = parseIsoDate(range.end);

  if (range.start === range.end) {
    return formatLongDate(range.start);
  }

  const sameYear = start.getFullYear() === end.getFullYear();
  const sameMonth = sameYear && start.getMonth() === end.getMonth();

  if (sameMonth) {
    return `${start.getDate()} – ${end.getDate()} de ${MONTH_LABELS[start.getMonth()]} ${start.getFullYear()}`;
  }

  if (sameYear) {
    return `${start.getDate()} ${MONTH_LABELS[start.getMonth()].slice(0, 3)} – ${end.getDate()} ${MONTH_LABELS[end.getMonth()].slice(0, 3)} ${start.getFullYear()}`;
  }

  return `${formatLongDate(range.start)} – ${formatLongDate(range.end)}`;
}

export function formatLongDate(iso: string): string {
  const date = parseIsoDate(iso);
  const weekday = WEEKDAY_LABELS[date.getDay()];
  return `${weekday}, ${date.getDate()} de ${MONTH_LABELS[date.getMonth()]} ${date.getFullYear()}`;
}

export function formatShortDate(iso: string): string {
  const date = parseIsoDate(iso);
  return `${date.getDate()} ${MONTH_LABELS[date.getMonth()].slice(0, 3)}`;
}

export function getCalendarDays(year: number, month: number): (string | null)[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startPadding = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
  const days: (string | null)[] = [];

  for (let i = 0; i < startPadding; i++) {
    days.push(null);
  }

  for (let day = 1; day <= lastDay.getDate(); day++) {
    days.push(toIsoDate(new Date(year, month, day)));
  }

  return days;
}

export function compareRanges(a: DateRange, b: DateRange): boolean {
  return a.start === b.start && a.end === b.end;
}

export function normalizeRange(start: string, end: string): DateRange {
  if (start <= end) {
    return { start, end };
  }
  return { start: end, end: start };
}

export function enumerateDates(range: DateRange): string[] {
  const dates: string[] = [];
  let current = range.start;

  while (current <= range.end) {
    dates.push(current);
    current = addDays(current, 1);
  }

  return dates;
}

export function isToday(iso: string): boolean {
  return iso === todayIso();
}

export function isTomorrow(iso: string): boolean {
  return iso === daysFromNowIso(1);
}

export function relativeDayLabel(iso: string): string {
  if (isToday(iso)) return 'Hoy';
  if (isTomorrow(iso)) return 'Mañana';
  return formatLongDate(iso);
}
