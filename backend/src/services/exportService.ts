// Enterprise Export Center — meals, supplements, nutrient logs, health scores, analytics, reports

import { EnterpriseReport, reportToCSV, reportToJSON, reportToPrint, ExportFormat } from './reportingEngine';

export type ExportEntity = 'meals' | 'supplements' | 'reminders' | 'nutrient_logs' | 'health_scores' | 'analytics' | 'reports';
export type ExportType = 'csv' | 'json' | 'xlsx' | 'pdf' | 'print';

export interface ExportOptions {
  entity: ExportEntity;
  format: ExportType;
  dateRange?: { start: string; end: string };
  includeHeaders?: boolean;
  includeMetadata?: boolean;
}

export interface ExportResult {
  filename: string;
  content: string | Blob;
  type: string;
  size: number;
}

export function generateExportFilename(options: ExportOptions): string {
  const date = new Date().toISOString().split('T')[0];
  const range = options.dateRange
    ? `_${options.dateRange.start}_to_${options.dateRange.end}`
    : `_${date}`;
  return `vitanexa_${options.entity}${range}.${options.format}`;
}

export function exportMealsToCSV(
  meals: { mealTime: string; foods: string; calories?: number | null; macros?: string | null; notes?: string | null }[]
): string {
  const rows = ['mealTime,foods,calories,macros,notes'];
  for (const m of meals) {
    rows.push(`"${m.mealTime}","${(m.foods || '').replace(/"/g, '""')}","${m.calories || ''}","${m.macros || ''}","${(m.notes || '').replace(/"/g, '""')}"`);
  }
  return rows.join('\n');
}

export function exportSupplementsToCSV(
  supplements: { name: string; brand?: string | null; dosage?: string | null; frequency?: string | null; timeOfDay?: string | null; startDate: string; notes?: string | null }[]
): string {
  const rows = ['name,brand,dosage,frequency,timeOfDay,startDate,notes'];
  for (const s of supplements) {
    rows.push(`"${s.name}","${s.brand || ''}","${s.dosage || ''}","${s.frequency || ''}","${s.timeOfDay || ''}","${s.startDate}","${(s.notes || '').replace(/"/g, '""')}"`);
  }
  return rows.join('\n');
}

export function exportNutrientLogsToCSV(
  logs: { date: string; nutrient: string; totalEstimate: number; unit: string; percentOfRdi?: number | null }[]
): string {
  const rows = ['date,nutrient,total,unit,percentOfRdi'];
  for (const l of logs) {
    rows.push(`"${l.date}","${l.nutrient}",${l.totalEstimate},"${l.unit}",${l.percentOfRdi || ''}`);
  }
  return rows.join('\n');
}

export function exportHealthScoresToCSV(
  scores: { date: string; score: number }[]
): string {
  const rows = ['date,score'];
  for (const s of scores) {
    rows.push(`"${s.date}",${s.score}`);
  }
  return rows.join('\n');
}

export function exportAnalyticsToJSON(
  scores: any,
  trends: any,
  nutrients: any
): string {
  return JSON.stringify({
    exportedAt: new Date().toISOString(),
    scores,
    trends,
    nutrients,
    version: 'VitaNexa Enterprise v3',
  }, null, 2);
}

export function exportReport(options: {
  report: EnterpriseReport;
  format: ExportFormat;
}): ExportResult {
  const { report, format } = options;
  let content: string | Blob;

  switch (format) {
    case 'csv':
      content = reportToCSV(report);
      break;
    case 'json':
      content = reportToJSON(report);
      break;
    case 'print':
      content = reportToPrint(report);
      break;
    default:
      content = reportToJSON(report);
  }

  const filename = `vitanexa_report_${report.period}_${report.dateRange.start}.${format}`;
  return {
    filename,
    content,
    type: format === 'json' ? 'application/json' :
          format === 'csv' ? 'text/csv' :
          format === 'print' ? 'text/html' : 'application/octet-stream',
    size: content.length,
  };
}

export function exportData(options: ExportOptions, data: any): ExportResult {
  let content: string;
  const filename = generateExportFilename(options);

  switch (options.entity) {
    case 'meals':
      content = exportMealsToCSV(data.meals || []);
      break;
    case 'supplements':
      content = exportSupplementsToCSV(data.supplements || []);
      break;
    case 'nutrient_logs':
      content = exportNutrientLogsToCSV(data.nutrientLogs || []);
      break;
    case 'health_scores':
      content = exportHealthScoresToCSV(data.healthScores || []);
      break;
    case 'analytics':
      content = exportAnalyticsToJSON(data.scores, data.trends, data.nutrients);
      break;
    default:
      content = JSON.stringify(data, null, 2);
  }

  return {
    filename,
    content,
    type: options.format === 'json' ? 'application/json' : 'text/csv',
    size: content.length,
  };
}
