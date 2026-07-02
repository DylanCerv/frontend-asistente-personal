import type { DateRange, TaskItem } from '@/types/assistant';
import { MONTH_LABELS, WEEKDAY_LABELS, isDateInRange, parseIsoDate } from '@/utils/date-utils';

export type CategoryStat = {
  category: string;
  total: number;
  completed: number;
  pending: number;
  avgCompletionMinutes: number | null;
};

export type ProductivityReport = {
  range: DateRange;
  generatedAt: string;
  userName: string;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  completionRate: number;
  avgCompletionMinutes: number | null;
  efficiencyScore: number;
  categories: CategoryStat[];
  busiestWeekday: string | null;
  busiestWeekdayCount: number;
  mostRepeatedTaskTitle: string | null;
  slowestCategory: string | null;
  recommendations: string[];
};

function weekdayLabel(iso: string): string {
  return WEEKDAY_LABELS[parseIsoDate(iso).getDay()];
}

function round(value: number, decimals = 1): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export function filterTasksByRange(tasks: TaskItem[], range: DateRange): TaskItem[] {
  return tasks.filter((task) => isDateInRange(task.scheduledAt, range));
}

export function buildProductivityReport(
  tasks: TaskItem[],
  range: DateRange,
  userName: string,
): ProductivityReport {
  const scopedTasks = filterTasksByRange(tasks, range);
  const completed = scopedTasks.filter((task) => task.status === 'completed');
  const pending = scopedTasks.filter((task) => task.status === 'pending');

  const completionRate =
    scopedTasks.length > 0 ? round((completed.length / scopedTasks.length) * 100) : 0;

  const completedWithTime = completed.filter(
    (task) => task.actualMinutes !== undefined && task.actualMinutes > 0,
  );
  const avgCompletionMinutes =
    completedWithTime.length > 0
      ? round(
          completedWithTime.reduce((sum, task) => sum + (task.actualMinutes ?? 0), 0) /
            completedWithTime.length,
        )
      : null;

  const categoryMap = new Map<string, CategoryStat>();
  for (const task of scopedTasks) {
    const current = categoryMap.get(task.category) ?? {
      category: task.category,
      total: 0,
      completed: 0,
      pending: 0,
      avgCompletionMinutes: null,
    };

    current.total += 1;
    if (task.status === 'completed') {
      current.completed += 1;
    } else {
      current.pending += 1;
    }
    categoryMap.set(task.category, current);
  }

  for (const [category, stat] of categoryMap.entries()) {
    const categoryCompleted = completed.filter(
      (task) => task.category === category && task.actualMinutes,
    );
    stat.avgCompletionMinutes =
      categoryCompleted.length > 0
        ? round(
            categoryCompleted.reduce((sum, task) => sum + (task.actualMinutes ?? 0), 0) /
              categoryCompleted.length,
          )
        : null;
  }

  const categories = [...categoryMap.values()].sort((a, b) => b.total - a.total);

  const weekdayCounts = new Map<string, number>();
  for (const task of scopedTasks) {
    const label = weekdayLabel(task.scheduledAt);
    weekdayCounts.set(label, (weekdayCounts.get(label) ?? 0) + 1);
  }

  let busiestWeekday: string | null = null;
  let busiestWeekdayCount = 0;
  for (const [day, count] of weekdayCounts.entries()) {
    if (count > busiestWeekdayCount) {
      busiestWeekday = day;
      busiestWeekdayCount = count;
    }
  }

  const titleCounts = new Map<string, number>();
  for (const task of scopedTasks) {
    const normalized = task.title.trim().toLowerCase();
    titleCounts.set(normalized, (titleCounts.get(normalized) ?? 0) + 1);
  }

  let mostRepeatedTaskTitle: string | null = null;
  let maxRepeat = 0;
  for (const task of scopedTasks) {
    const count = titleCounts.get(task.title.trim().toLowerCase()) ?? 0;
    if (count > maxRepeat) {
      maxRepeat = count;
      mostRepeatedTaskTitle = task.title;
    }
  }
  if (maxRepeat <= 1) {
    mostRepeatedTaskTitle = null;
  }

  const slowestCategory =
    categories
      .filter((category) => category.avgCompletionMinutes !== null)
      .sort((a, b) => (b.avgCompletionMinutes ?? 0) - (a.avgCompletionMinutes ?? 0))[0]
      ?.category ?? null;

  const onTimeTasks = completed.filter(
    (task) =>
      task.estimatedMinutes &&
      task.actualMinutes &&
      task.actualMinutes <= task.estimatedMinutes * 1.1,
  );
  const efficiencyScore =
    completed.length > 0 ? round((onTimeTasks.length / completed.length) * 100) : 0;

  const recommendations = buildRecommendations({
    completionRate,
    efficiencyScore,
    busiestWeekday,
    busiestWeekdayCount,
    mostRepeatedTaskTitle,
    maxRepeat,
    slowestCategory,
    categories,
    pendingCount: pending.length,
  });

  return {
    range,
    generatedAt: new Date().toISOString(),
    userName,
    totalTasks: scopedTasks.length,
    completedTasks: completed.length,
    pendingTasks: pending.length,
    completionRate,
    avgCompletionMinutes,
    efficiencyScore,
    categories,
    busiestWeekday,
    busiestWeekdayCount,
    mostRepeatedTaskTitle,
    slowestCategory,
    recommendations,
  };
}

function buildRecommendations(input: {
  completionRate: number;
  efficiencyScore: number;
  busiestWeekday: string | null;
  busiestWeekdayCount: number;
  mostRepeatedTaskTitle: string | null;
  maxRepeat: number;
  slowestCategory: string | null;
  categories: CategoryStat[];
  pendingCount: number;
}): string[] {
  const tips: string[] = [];

  if (input.busiestWeekday && input.busiestWeekdayCount >= 3) {
    tips.push(
      `El día con más tareas es ${input.busiestWeekday} (${input.busiestWeekdayCount} tareas). Considera distribuir la carga a mitad de semana.`,
    );
  }

  if (input.mostRepeatedTaskTitle && input.maxRepeat > 1) {
    tips.push(
      `"${input.mostRepeatedTaskTitle}" se repite con frecuencia. Configúrala como tarea recurrente para ahorrar tiempo.`,
    );
  }

  if (input.slowestCategory) {
    tips.push(
      `Las tareas de "${input.slowestCategory}" demoran más en completarse. Divide esas tareas en pasos más pequeños.`,
    );
  }

  if (input.completionRate < 70) {
    tips.push(
      `Tu tasa de completado es ${input.completionRate}%. Prioriza 2–3 tareas clave por día en lugar de acumular pendientes.`,
    );
  } else if (input.completionRate >= 85) {
    tips.push('Excelente ritmo de completado. Mantén el enfoque en las tareas de alta prioridad.');
  }

  if (input.efficiencyScore < 60) {
    tips.push(
      'Varias tareas tardaron más de lo estimado. Ajusta tus estimaciones o reserva bloques de tiempo sin interrupciones.',
    );
  }

  if (input.pendingCount > 5) {
    tips.push(`Tienes ${input.pendingCount} tareas pendientes en este periodo. Usa el asistente por voz para capturarlas y organizarlas rápido.`);
  }

  const topCategory = input.categories[0];
  if (topCategory && topCategory.total >= 3) {
    tips.push(
      `La categoría con más actividad es "${topCategory.category}" (${topCategory.total} tareas). Revisa si necesitas más tiempo dedicado a esta área.`,
    );
  }

  if (tips.length === 0) {
    tips.push('Sigue usando el asistente por voz para mantener tu agenda organizada sin esfuerzo.');
  }

  return tips.slice(0, 5);
}

export function formatReportPeriod(range: DateRange): string {
  const start = parseIsoDate(range.start);
  const end = parseIsoDate(range.end);
  return `${start.getDate()} ${MONTH_LABELS[start.getMonth()].slice(0, 3)} ${start.getFullYear()} – ${end.getDate()} ${MONTH_LABELS[end.getMonth()].slice(0, 3)} ${end.getFullYear()}`;
}
