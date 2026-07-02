import type { MemoryRecord } from '@/types/record';
import { daysFromNowIso, todayIso } from '@/utils/date-utils';

type ParsedVoiceInput = {
  transcription: string;
  records: MemoryRecord[];
  summary: string;
};

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function parseAmount(text: string): number | null {
  const match = text.match(/(\d+(?:[.,]\d{1,2})?)/);
  if (!match) return null;
  return Number(match[1].replace(',', '.'));
}

function parseExpense(text: string): MemoryRecord | null {
  if (!/gast|pagu|compr/i.test(text)) return null;
  const amount = parseAmount(text);
  return {
    id: createId('expense'),
    type: 'expense',
    title: amount ? `Gasto de ${amount}` : 'Gasto registrado',
    amount: amount ?? undefined,
    currency: /dólar|usd|\$/i.test(text) ? 'USD' : 'USD',
    scheduledAt: todayIso(),
    category: 'General',
    createdAt: new Date().toISOString(),
  };
}

function parseIncome(text: string): MemoryRecord | null {
  if (!/ingreso|recib|cobr|pagaron/i.test(text)) return null;
  const amount = parseAmount(text);
  return {
    id: createId('income'),
    type: 'income',
    title: amount ? `Ingreso de ${amount}` : 'Ingreso registrado',
    amount: amount ?? undefined,
    currency: 'USD',
    scheduledAt: todayIso(),
    category: 'General',
    createdAt: new Date().toISOString(),
  };
}

function parseReminder(text: string): MemoryRecord | null {
  if (!/recu[eé]rdame|recordatorio/i.test(text)) return null;
  const cleaned = text.replace(/recu[eé]rdame\s*/i, '').trim();
  return {
    id: createId('reminder'),
    type: 'reminder',
    title: cleaned || 'Recordatorio',
    scheduledAt: /mañana/i.test(text) ? daysFromNowIso(1) : todayIso(),
    createdAt: new Date().toISOString(),
  };
}

function parseTask(text: string): MemoryRecord | null {
  if (!/tarea|entregar|hacer|llamar/i.test(text)) return null;
  return {
    id: createId('task'),
    type: 'task',
    title: text.length > 80 ? `${text.slice(0, 77)}...` : text,
    status: 'pending',
    priority: /urgente|importante/i.test(text) ? 'high' : 'medium',
    scheduledAt: /mañana/i.test(text) ? daysFromNowIso(1) : todayIso(),
    category: 'General',
    tags: [],
    createdAt: new Date().toISOString(),
  };
}

function parseMeeting(text: string): MemoryRecord | null {
  if (!/reuni[oó]n|cita/i.test(text)) return null;
  return {
    id: createId('meeting'),
    type: 'meeting',
    title: text.length > 80 ? `${text.slice(0, 77)}...` : text,
    scheduledAt: /mañana/i.test(text) ? daysFromNowIso(1) : todayIso(),
    time: '10:00 AM',
    createdAt: new Date().toISOString(),
  };
}

export function parseVoiceTextToRecords(text: string): ParsedVoiceInput {
  const transcription = text.trim();
  const parsers = [parseExpense, parseIncome, parseReminder, parseMeeting, parseTask];
  const records: MemoryRecord[] = [];

  for (const parser of parsers) {
    const record = parser(transcription);
    if (record) {
      records.push(record);
      break;
    }
  }

  if (records.length === 0) {
    records.push({
      id: createId('note'),
      type: 'note',
      title: transcription.length > 60 ? `${transcription.slice(0, 57)}...` : transcription,
      description: transcription,
      scheduledAt: todayIso(),
      createdAt: new Date().toISOString(),
    });
  }

  const summary =
    records.length === 1
      ? `Listo, registré: ${records[0].title}.`
      : `Listo, registré ${records.length} elementos.`;

  return { transcription, records, summary };
}

export async function simulateVoiceProcessing(
  transcribe: () => Promise<string>,
): Promise<ParsedVoiceInput> {
  await new Promise((resolve) => setTimeout(resolve, 1200));
  const transcription = await transcribe();
  return parseVoiceTextToRecords(transcription);
}
