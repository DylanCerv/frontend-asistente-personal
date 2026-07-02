import { buildMonthlyFinanceSummary } from '@/services/finance-analytics';
import type { CalendarEvent, TaskItem } from '@/types/assistant';
import type { MemoryRecord } from '@/types/record';
import { todayIso } from '@/utils/date-utils';

import { parseVoiceTextToRecords } from './mock-voice-parser';

type MockChatContext = {
  tasks: TaskItem[];
  events: CalendarEvent[];
  records: MemoryRecord[];
};

type MockChatResult = {
  reply: string;
  newRecords: MemoryRecord[];
};

function formatTaskList(tasks: TaskItem[]): string {
  if (tasks.length === 0) return 'No tienes tareas pendientes para ese periodo.';
  return tasks
    .slice(0, 5)
    .map((task, index) => `${index + 1}. ${task.title}`)
    .join('\n');
}

export function runMockAssistant(message: string, context: MockChatContext): MockChatResult {
  const text = message.trim().toLowerCase();

  if (/gast|ingreso|recu[eé]rdame|tarea|reuni|entregar|llamar/i.test(message)) {
    const parsed = parseVoiceTextToRecords(message);
    return {
      reply: `${parsed.summary} (modo demo local)`,
      newRecords: parsed.records,
    };
  }

  if (text.includes('qué tengo hoy') || text.includes('que tengo hoy')) {
    const today = todayIso();
    const todayTasks = context.tasks.filter(
      (task) => task.status === 'pending' && task.scheduledAt === today,
    );
    const todayEvents = context.events.filter((event) => event.scheduledAt === today);

    const parts: string[] = [];
    if (todayTasks.length > 0) {
      parts.push(`Tienes ${todayTasks.length} tarea(s) hoy:\n${formatTaskList(todayTasks)}`);
    }
    if (todayEvents.length > 0) {
      parts.push(
        `Tienes ${todayEvents.length} evento(s) hoy: ${todayEvents.map((event) => event.title).join(', ')}.`,
      );
    }
    if (parts.length === 0) {
      return { reply: 'Hoy no tienes tareas ni eventos registrados.', newRecords: [] };
    }
    return { reply: parts.join('\n\n'), newRecords: [] };
  }

  if (text.includes('cuánto gasté') || text.includes('cuanto gaste')) {
    const summary = buildMonthlyFinanceSummary(context.records, todayIso());
    return {
      reply: `Este mes llevas ${summary.expense} ${summary.currency} en gastos y ${summary.income} ${summary.currency} en ingresos.`,
      newRecords: [],
    };
  }

  if (text.includes('tareas pendientes') || text.includes('tareas importantes')) {
    const pending = context.tasks.filter((task) => task.status === 'pending');
    const important = pending.filter((task) => task.priority === 'high');
    const list = important.length > 0 ? important : pending;
    return {
      reply: formatTaskList(list),
      newRecords: [],
    };
  }

  return {
    reply:
      'Puedo ayudarte con frases como "¿Qué tengo hoy?", "¿Cuánto gasté este mes?" o "Recuérdame llamar al cliente mañana". (modo demo local)',
    newRecords: [],
  };
}
