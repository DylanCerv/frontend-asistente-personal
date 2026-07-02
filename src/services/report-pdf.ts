import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import { formatReportPeriod, type ProductivityReport } from '@/services/report-analytics';
import { PRIORITY_LABELS, REPORT_PRESET_LABELS } from '@/constants/mock-data';
import type { ReportPreset, TaskItem } from '@/types/assistant';
import { formatLongDate } from '@/utils/date-utils';

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function buildCategoryRows(report: ProductivityReport): string {
  if (report.categories.length === 0) {
    return '<tr><td colspan="4">Sin datos en este periodo</td></tr>';
  }

  return report.categories
    .map(
      (category) => `
      <tr>
        <td>${escapeHtml(category.category)}</td>
        <td>${category.total}</td>
        <td>${category.completed}</td>
        <td>${category.avgCompletionMinutes !== null ? `${category.avgCompletionMinutes} min` : '—'}</td>
      </tr>`,
    )
    .join('');
}

function buildTaskRows(tasks: TaskItem[]): string {
  if (tasks.length === 0) {
    return '<tr><td colspan="4">Sin tareas en este periodo</td></tr>';
  }

  return tasks
    .slice(0, 30)
    .map(
      (task) => `
      <tr>
        <td>${escapeHtml(task.title)}</td>
        <td>${escapeHtml(task.category)}</td>
        <td>${task.status === 'completed' ? 'Completada' : 'Pendiente'}</td>
        <td>${PRIORITY_LABELS[task.priority]}</td>
      </tr>`,
    )
    .join('');
}

function buildRecommendations(report: ProductivityReport): string {
  return report.recommendations
    .map((tip) => `<li>${escapeHtml(tip)}</li>`)
    .join('');
}

export function buildReportHtml(
  report: ProductivityReport,
  tasks: TaskItem[],
  preset: ReportPreset,
): string {
  const period = formatReportPeriod(report.range);
  const generated = formatLongDate(report.generatedAt.split('T')[0]);

  return `
    <!DOCTYPE html>
    <html lang="es">
      <head>
        <meta charset="utf-8" />
        <style>
          * { box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            color: #181124;
            margin: 0;
            padding: 32px;
            background: #FAF8FF;
          }
          .header {
            background: linear-gradient(135deg, #7C3AED, #A78BFA);
            color: white;
            border-radius: 20px;
            padding: 28px;
            margin-bottom: 24px;
          }
          h1 { margin: 0 0 8px; font-size: 28px; }
          h2 { margin: 24px 0 12px; font-size: 18px; color: #7C3AED; }
          .subtitle { opacity: 0.9; font-size: 14px; }
          .grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
            margin-bottom: 20px;
          }
          .card {
            background: white;
            border: 1px solid #E7DFF5;
            border-radius: 16px;
            padding: 16px;
          }
          .metric-label { font-size: 12px; color: #6B6475; margin-bottom: 4px; }
          .metric-value { font-size: 24px; font-weight: 700; color: #7C3AED; }
          table {
            width: 100%;
            border-collapse: collapse;
            background: white;
            border-radius: 16px;
            overflow: hidden;
          }
          th, td {
            padding: 10px 12px;
            text-align: left;
            border-bottom: 1px solid #E7DFF5;
            font-size: 13px;
          }
          th { background: #F1EAFF; color: #181124; }
          ul { padding-left: 20px; }
          li { margin-bottom: 8px; line-height: 1.5; }
          .footer {
            margin-top: 28px;
            font-size: 12px;
            color: #6B6475;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Reporte de Productividad</h1>
          <div class="subtitle">${escapeHtml(report.userName)} · ${REPORT_PRESET_LABELS[preset]} · ${escapeHtml(period)}</div>
        </div>

        <div class="grid">
          <div class="card">
            <div class="metric-label">Tareas totales</div>
            <div class="metric-value">${report.totalTasks}</div>
          </div>
          <div class="card">
            <div class="metric-label">Completadas</div>
            <div class="metric-value">${report.completedTasks}</div>
          </div>
          <div class="card">
            <div class="metric-label">Tasa de completado</div>
            <div class="metric-value">${report.completionRate}%</div>
          </div>
          <div class="card">
            <div class="metric-label">Eficiencia</div>
            <div class="metric-value">${report.efficiencyScore}%</div>
          </div>
        </div>

        <h2>Resumen</h2>
        <div class="card">
          <p><strong>Tiempo promedio de completado:</strong> ${report.avgCompletionMinutes !== null ? `${report.avgCompletionMinutes} min` : 'Sin datos'}</p>
          <p><strong>Día con más tareas:</strong> ${report.busiestWeekday ? `${report.busiestWeekday} (${report.busiestWeekdayCount})` : 'Sin datos'}</p>
          <p><strong>Tarea más repetida:</strong> ${report.mostRepeatedTaskTitle ?? 'Ninguna'}</p>
          <p><strong>Categoría más lenta:</strong> ${report.slowestCategory ?? 'Sin datos'}</p>
        </div>

        <h2>Tareas por categoría</h2>
        <table>
          <thead>
            <tr>
              <th>Categoría</th>
              <th>Total</th>
              <th>Completadas</th>
              <th>Tiempo prom.</th>
            </tr>
          </thead>
          <tbody>${buildCategoryRows(report)}</tbody>
        </table>

        <h2>Tareas del periodo</h2>
        <table>
          <thead>
            <tr>
              <th>Tarea</th>
              <th>Categoría</th>
              <th>Estado</th>
              <th>Prioridad</th>
            </tr>
          </thead>
          <tbody>${buildTaskRows(tasks)}</tbody>
        </table>

        <h2>Recomendaciones</h2>
        <div class="card">
          <ul>${buildRecommendations(report)}</ul>
        </div>

        <div class="footer">Generado por Asistente · ${escapeHtml(generated)}</div>
      </body>
    </html>
  `;
}

export async function exportReportPdf(
  report: ProductivityReport,
  tasks: TaskItem[],
  preset: ReportPreset,
): Promise<void> {
  const html = buildReportHtml(report, tasks, preset);
  const { uri } = await Print.printToFileAsync({ html, base64: false });

  const isAvailable = await Sharing.isAvailableAsync();
  if (!isAvailable) {
    throw new Error('Compartir no está disponible en este dispositivo.');
  }

  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    dialogTitle: 'Descargar reporte de productividad',
    UTI: 'com.adobe.pdf',
  });
}
