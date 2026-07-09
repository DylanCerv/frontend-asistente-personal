import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

import { showAppAlert } from '@/services/app-dialog';
import { formatMoney } from '@/services/finance-analytics';
import type { CalendarEvent, TaskItem } from '@/types/assistant';
import type { MemoryRecord } from '@/types/record';
import { formatLongDate } from '@/utils/date-utils';
import { PRIORITY_LABELS } from '@/constants/labels';

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function wrapHtml(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1f1630; padding: 28px; }
    h1 { font-size: 22px; margin: 0 0 4px; }
    h2 { font-size: 16px; margin: 24px 0 8px; }
    p, li { font-size: 13px; line-height: 1.45; }
    .meta { color: #6b6475; margin-bottom: 18px; }
    .card { border: 1px solid #e7e0f0; border-radius: 12px; padding: 12px 14px; margin-bottom: 8px; }
    .row { display: flex; justify-content: space-between; gap: 12px; }
    .muted { color: #6b6475; }
    .income { color: #7c3aed; font-weight: 700; }
    .expense { color: #dc2626; font-weight: 700; }
    .stat { display: inline-block; min-width: 120px; margin: 0 12px 12px 0; }
    .stat strong { display: block; font-size: 20px; }
  </style>
</head>
<body>${body}</body>
</html>`;
}

export async function sharePdfReport(title: string, html: string): Promise<void> {
  try {
    const { uri } = await Print.printToFileAsync({ html });
    const canShare = await Sharing.isAvailableAsync();

    if (canShare) {
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: title,
        UTI: 'com.adobe.pdf',
      });
      return;
    }

    if (Platform.OS === 'web') {
      await Print.printAsync({ html });
      return;
    }

    showAppAlert('Reporte listo', 'El PDF se generó, pero este dispositivo no permite compartir archivos.');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo generar el reporte.';
    showAppAlert('Error al exportar', message);
  }
}

export function buildProgressReportHtml(input: {
  displayName: string;
  periodLabel: string;
  tasks: TaskItem[];
  events: CalendarEvent[];
}): string {
  const pending = input.tasks.filter((task) => task.status === 'pending');
  const completed = input.tasks.filter((task) => task.status === 'completed');
  const progress =
    input.tasks.length === 0 ? 0 : Math.round((completed.length / input.tasks.length) * 100);

  const pendingRows = pending
    .map(
      (task) => `
      <div class="card">
        <div class="row">
          <strong>${escapeHtml(task.title)}</strong>
          <span class="muted">${escapeHtml(PRIORITY_LABELS[task.priority])}</span>
        </div>
        <p class="muted">${escapeHtml(task.category)} · ${escapeHtml(formatLongDate(task.scheduledAt))}</p>
        ${task.description ? `<p>${escapeHtml(task.description)}</p>` : ''}
      </div>`,
    )
    .join('');

  const completedRows = completed
    .map(
      (task) => `
      <div class="card">
        <strong>${escapeHtml(task.title)}</strong>
        <p class="muted">${escapeHtml(formatLongDate(task.scheduledAt))}</p>
      </div>`,
    )
    .join('');

  const eventRows = input.events
    .map(
      (event) => `
      <div class="card">
        <div class="row">
          <strong>${escapeHtml(event.title)}</strong>
          <span class="muted">${escapeHtml(event.time)}</span>
        </div>
        <p class="muted">${escapeHtml(formatLongDate(event.scheduledAt))} · ${escapeHtml(event.type)}</p>
      </div>`,
    )
    .join('');

  const body = `
    <h1>Reporte de avance</h1>
    <p class="meta">${escapeHtml(input.displayName)} · ${escapeHtml(input.periodLabel)}</p>
    <div class="stat"><span class="muted">Avance</span><strong>${progress}%</strong></div>
    <div class="stat"><span class="muted">Completadas</span><strong>${completed.length}</strong></div>
    <div class="stat"><span class="muted">Pendientes</span><strong>${pending.length}</strong></div>
    <div class="stat"><span class="muted">Eventos</span><strong>${input.events.length}</strong></div>
    <h2>Tareas pendientes</h2>
    ${pendingRows || '<p class="muted">Sin pendientes en este periodo.</p>'}
    <h2>Tareas completadas</h2>
    ${completedRows || '<p class="muted">Sin tareas completadas en este periodo.</p>'}
    <h2>Eventos</h2>
    ${eventRows || '<p class="muted">Sin eventos en este periodo.</p>'}
  `;

  return wrapHtml('Reporte de avance', body);
}

export function buildFinanceReportHtml(input: {
  displayName: string;
  periodLabel: string;
  records: MemoryRecord[];
  income: number;
  expense: number;
  balance: number;
  currency: string;
}): string {
  const rows = input.records
    .map((record) => {
      const isIncome = record.type === 'income';
      const amount = typeof record.amount === 'number' ? Math.abs(record.amount) : 0;
      const date = record.scheduledAt ?? record.createdAt?.slice(0, 10) ?? '';
      return `
        <div class="card">
          <div class="row">
            <strong>${escapeHtml(record.title)}</strong>
            <span class="${isIncome ? 'income' : 'expense'}">
              ${isIncome ? '+' : '-'}${escapeHtml(formatMoney(amount, input.currency))}
            </span>
          </div>
          <p class="muted">
            ${isIncome ? 'Ingreso' : 'Gasto'}
            ${record.category ? ` · ${escapeHtml(record.category)}` : ''}
            ${date ? ` · ${escapeHtml(formatLongDate(date))}` : ''}
          </p>
          ${record.description ? `<p>${escapeHtml(record.description)}</p>` : ''}
        </div>`;
    })
    .join('');

  const body = `
    <h1>Reporte financiero</h1>
    <p class="meta">${escapeHtml(input.displayName)} · ${escapeHtml(input.periodLabel)}</p>
    <div class="stat"><span class="muted">Ingresos</span><strong class="income">${escapeHtml(formatMoney(input.income, input.currency))}</strong></div>
    <div class="stat"><span class="muted">Gastos</span><strong class="expense">${escapeHtml(formatMoney(input.expense, input.currency))}</strong></div>
    <div class="stat"><span class="muted">Balance</span><strong>${escapeHtml(formatMoney(input.balance, input.currency))}</strong></div>
    <div class="stat"><span class="muted">Movimientos</span><strong>${input.records.length}</strong></div>
    <h2>Movimientos</h2>
    ${rows || '<p class="muted">Sin movimientos en este periodo.</p>'}
  `;

  return wrapHtml('Reporte financiero', body);
}
