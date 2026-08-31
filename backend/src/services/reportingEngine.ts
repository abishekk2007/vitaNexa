// Enterprise Smart Reporting Engine — PDF, CSV, Excel, JSON for daily/weekly/monthly/quarterly/yearly

import { HealthScores, TrendData, NutrientTrend } from './analyticsEngine';

export type ReportPeriod = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
export type ExportFormat = 'pdf' | 'csv' | 'xlsx' | 'json' | 'print';

export interface ReportSection {
  title: string;
  type: 'summary' | 'table' | 'chart' | 'list' | 'metric';
  data: any;
}

export interface EnterpriseReport {
  id: string;
  title: string;
  period: ReportPeriod;
  format: ExportFormat;
  generatedAt: string;
  dateRange: { start: string; end: string };
  user: { name: string; email?: string };
  sections: ReportSection[];
  scores?: HealthScores;
  trends?: { daily: TrendData[]; weekly: TrendData[]; monthly: TrendData[] };
  nutrientTrends?: NutrientTrend[];
  metadata: {
    totalMeals: number;
    totalSupplements: number;
    totalDays: number;
    avgHealthScore: number;
  };
}

export function generateDailyReport(params: {
  date: string;
  meals: number;
  supplements: number;
  healthScore: number;
  nutrients: Record<string, { percent: number; status: string }>;
  scores: HealthScores;
}): EnterpriseReport {
  return {
    id: `daily-${params.date}`,
    title: `Daily Health Report — ${params.date}`,
    period: 'daily',
    format: 'json',
    generatedAt: new Date().toISOString(),
    dateRange: { start: params.date, end: params.date },
    user: { name: 'User' },
    sections: [
      {
        title: 'Daily Overview',
        type: 'summary',
        data: { date: params.date, meals: params.meals, supplements: params.supplements, healthScore: params.healthScore },
      },
      {
        title: 'Health Scores',
        type: 'metric',
        data: params.scores,
      },
      {
        title: 'Nutrient Status',
        type: 'table',
        data: Object.entries(params.nutrients).map(([k, v]) => ({
          nutrient: k,
          percent: v.percent,
          status: v.status,
        })),
      },
    ],
    scores: params.scores,
    metadata: {
      totalMeals: params.meals,
      totalSupplements: params.supplements,
      totalDays: 1,
      avgHealthScore: params.healthScore,
    },
  };
}

export function generateWeeklyReport(params: {
  startDate: string;
  endDate: string;
  totalMeals: number;
  totalSupplements: number;
  avgHealthScore: number;
  scores: HealthScores;
  dailyScores: { date: string; score: number }[];
  topFoods: { food: string; count: number }[];
  missedNutrients: { nutrient: string; status: string }[];
}): EnterpriseReport {
  return {
    id: `weekly-${params.startDate}-to-${params.endDate}`,
    title: `Weekly Health Report — ${params.startDate} to ${params.endDate}`,
    period: 'weekly',
    format: 'json',
    generatedAt: new Date().toISOString(),
    dateRange: { start: params.startDate, end: params.endDate },
    user: { name: 'User' },
    sections: [
      {
        title: 'Weekly Summary',
        type: 'summary',
        data: {
          totalMeals: params.totalMeals,
          totalSupplements: params.totalSupplements,
          avgHealthScore: params.avgHealthScore,
          daysTracked: params.dailyScores.length,
        },
      },
      {
        title: 'Health Scores',
        type: 'metric',
        data: params.scores,
      },
      {
        title: 'Daily Trend',
        type: 'chart',
        data: params.dailyScores,
      },
      {
        title: 'Top Foods',
        type: 'list',
        data: params.topFoods,
      },
      {
        title: 'Nutrient Gaps',
        type: 'table',
        data: params.missedNutrients,
      },
    ],
    scores: params.scores,
    metadata: {
      totalMeals: params.totalMeals,
      totalSupplements: params.totalSupplements,
      totalDays: params.dailyScores.length,
      avgHealthScore: params.avgHealthScore,
    },
  };
}

export function generateMonthlyReport(params: {
  year: number;
  month: number;
  totalMeals: number;
  totalSupplements: number;
  avgHealthScore: number;
  scores: HealthScores;
  dailyScores: { date: string; score: number }[];
  weeklyAverages: number[];
  topFoods: { food: string; count: number }[];
  nutrientTrends: NutrientTrend[];
}): EnterpriseReport {
  const monthName = new Date(params.year, params.month - 1).toLocaleString('default', { month: 'long' });
  return {
    id: `monthly-${params.year}-${params.month}`,
    title: `Monthly Health Report — ${monthName} ${params.year}`,
    period: 'monthly',
    format: 'json',
    generatedAt: new Date().toISOString(),
    dateRange: {
      start: `${params.year}-${String(params.month).padStart(2, '0')}-01`,
      end: `${params.year}-${String(params.month).padStart(2, '0')}-${new Date(params.year, params.month, 0).getDate()}`,
    },
    user: { name: 'User' },
    sections: [
      {
        title: 'Monthly Summary',
        type: 'summary',
        data: {
          month: monthName,
          year: params.year,
          totalMeals: params.totalMeals,
          totalSupplements: params.totalSupplements,
          avgHealthScore: params.avgHealthScore,
          weeksActive: params.weeklyAverages.filter(w => w > 0).length,
        },
      },
      {
        title: 'Health Scores',
        type: 'metric',
        data: params.scores,
      },
      {
        title: 'Weekly Trend',
        type: 'chart',
        data: params.weeklyAverages.map((v, i) => ({ week: `Week ${i + 1}`, value: v })),
      },
      {
        title: 'Nutrient Trends',
        type: 'table',
        data: params.nutrientTrends,
      },
      {
        title: 'Top Foods',
        type: 'list',
        data: params.topFoods,
      },
    ],
    scores: params.scores,
    nutrientTrends: params.nutrientTrends,
    metadata: {
      totalMeals: params.totalMeals,
      totalSupplements: params.totalSupplements,
      totalDays: params.dailyScores.length,
      avgHealthScore: params.avgHealthScore,
    },
  };
}

export function generateQuarterlyReport(params: {
  year: number;
  quarter: number;
  totalMeals: number;
  totalSupplements: number;
  avgHealthScore: number;
  scores: HealthScores;
  monthlyAverages: number[];
  topFoods: { food: string; count: number }[];
  nutrientTrends: NutrientTrend[];
}): EnterpriseReport {
  return {
    id: `quarterly-${params.year}-Q${params.quarter}`,
    title: `Quarterly Health Report — Q${params.quarter} ${params.year}`,
    period: 'quarterly',
    format: 'json',
    generatedAt: new Date().toISOString(),
    dateRange: {
      start: `${params.year}-${String((params.quarter - 1) * 3 + 1).padStart(2, '0')}-01`,
      end: `${params.year}-${String(params.quarter * 3).padStart(2, '0')}-${new Date(params.year, params.quarter * 3, 0).getDate()}`,
    },
    user: { name: 'User' },
    sections: [
      {
        title: 'Quarterly Summary',
        type: 'summary',
        data: {
          quarter: `Q${params.quarter}`,
          year: params.year,
          totalMeals: params.totalMeals,
          totalSupplements: params.totalSupplements,
          avgHealthScore: params.avgHealthScore,
        },
      },
      {
        title: 'Health Scores',
        type: 'metric',
        data: params.scores,
      },
      {
        title: 'Monthly Trend',
        type: 'chart',
        data: params.monthlyAverages.map((v, i) => ({ month: `Month ${i + 1}`, value: v })),
      },
      {
        title: 'Nutrient Trends',
        type: 'table',
        data: params.nutrientTrends,
      },
    ],
    scores: params.scores,
    nutrientTrends: params.nutrientTrends,
    metadata: {
      totalMeals: params.totalMeals,
      totalSupplements: params.totalSupplements,
      totalDays: 90,
      avgHealthScore: params.avgHealthScore,
    },
  };
}

export function generateYearlyReport(params: {
  year: number;
  totalMeals: number;
  totalSupplements: number;
  avgHealthScore: number;
  scores: HealthScores;
  monthlyAverages: number[];
  topFoods: { food: string; count: number }[];
  nutrientTrends: NutrientTrend[];
}): EnterpriseReport {
  return {
    id: `yearly-${params.year}`,
    title: `Yearly Health Report — ${params.year}`,
    period: 'yearly',
    format: 'json',
    generatedAt: new Date().toISOString(),
    dateRange: {
      start: `${params.year}-01-01`,
      end: `${params.year}-12-31`,
    },
    user: { name: 'User' },
    sections: [
      {
        title: 'Yearly Summary',
        type: 'summary',
        data: {
          year: params.year,
          totalMeals: params.totalMeals,
          totalSupplements: params.totalSupplements,
          avgHealthScore: params.avgHealthScore,
        },
      },
      {
        title: 'Annual Health Scores',
        type: 'metric',
        data: params.scores,
      },
      {
        title: 'Monthly Trend',
        type: 'chart',
        data: params.monthlyAverages.map((v, i) => ({ month: new Date(params.year, i).toLocaleString('default', { month: 'short' }), value: v })),
      },
      {
        title: 'Yearly Nutrient Trends',
        type: 'table',
        data: params.nutrientTrends,
      },
    ],
    scores: params.scores,
    nutrientTrends: params.nutrientTrends,
    metadata: {
      totalMeals: params.totalMeals,
      totalSupplements: params.totalSupplements,
      totalDays: 365,
      avgHealthScore: params.avgHealthScore,
    },
  };
}

export function reportToCSV(report: EnterpriseReport): string {
  const rows: string[] = ['section,field,value'];
  for (const section of report.sections) {
    if (section.type === 'metric' && section.data) {
      for (const [key, val] of Object.entries(section.data)) {
        rows.push(`${section.title},${key},${val}`);
      }
    } else if (section.type === 'table' && Array.isArray(section.data)) {
      const headers = Object.keys(section.data[0] || {}).join(',');
      rows.push(`${section.title},${headers},`);
      for (const row of section.data) {
        rows.push(`${section.title},${Object.values(row).join(',')},`);
      }
    } else if (section.type === 'list' && Array.isArray(section.data)) {
      for (const item of section.data) {
        rows.push(`${section.title},${Object.values(item).join(',')},`);
      }
    } else if (section.type === 'summary' && section.data) {
      for (const [key, val] of Object.entries(section.data)) {
        rows.push(`${section.title},${key},${val}`);
      }
    }
  }
  rows.push(`metadata,totalMeals,${report.metadata.totalMeals}`);
  rows.push(`metadata,totalSupplements,${report.metadata.totalSupplements}`);
  rows.push(`metadata,avgHealthScore,${report.metadata.avgHealthScore}`);
  return rows.join('\n');
}

export function reportToJSON(report: EnterpriseReport): string {
  return JSON.stringify(report, null, 2);
}

export function reportToPrint(report: EnterpriseReport): string {
  let html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${report.title}</title>
<style>
  body { font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; color: #333; }
  h1 { color: #0f766e; border-bottom: 2px solid #0f766e; padding-bottom: 8px; }
  h2 { color: #0369a1; margin-top: 24px; }
  .section { margin: 16px 0; padding: 12px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; }
  table { width: 100%; border-collapse: collapse; }
  th, td { padding: 6px 10px; text-align: left; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
  th { background: #f1f5f9; font-weight: 600; }
  .score { display: inline-block; padding: 4px 12px; border-radius: 12px; font-weight: 600; font-size: 14px; }
  .high { background: #dcfce7; color: #166534; }
  .mid { background: #fef3c7; color: #92400e; }
  .low { background: #fee2e2; color: #991b1b; }
  .footer { margin-top: 32px; padding-top: 12px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center; }
</style></head><body>
<h1>${report.title}</h1>
<p>Generated: ${new Date(report.generatedAt).toLocaleString()} | Period: ${report.dateRange.start} to ${report.dateRange.end}</p>
<p>Total Meals: ${report.metadata.totalMeals} | Supplements: ${report.metadata.totalSupplements} | Avg Score: ${report.metadata.avgHealthScore}</p>`;

  for (const section of report.sections) {
    html += `<div class="section"><h2>${section.title}</h2>`;
    if (section.type === 'metric' && section.data) {
      html += '<table><tr><th>Metric</th><th>Value</th></tr>';
      for (const [key, val] of Object.entries(section.data)) {
        const displayKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());
        html += `<tr><td>${displayKey}</td><td>${val}</td></tr>`;
      }
      html += '</table>';
    } else if (section.type === 'table' && Array.isArray(section.data)) {
      const headers = Object.keys(section.data[0] || {});
      html += '<table><tr>' + headers.map(h => `<th>${h}</th>`).join('') + '</tr>';
      for (const row of section.data) {
        html += '<tr>' + Object.values(row).map(v => `<td>${v}</td>`).join('') + '</tr>';
      }
      html += '</table>';
    } else if (section.type === 'list' && Array.isArray(section.data)) {
      html += '<ul>';
      for (const item of section.data) {
        html += `<li>${Object.values(item).join(' - ')}</li>`;
      }
      html += '</ul>';
    } else if (section.type === 'summary' && section.data) {
      html += '<table><tr><th>Field</th><th>Value</th></tr>';
      for (const [key, val] of Object.entries(section.data)) {
        html += `<tr><td>${key}</td><td>${val}</td></tr>`;
      }
      html += '</table>';
    }
    html += '</div>';
  }

  html += `<div class="footer"><p>VitaNexa AI Enterprise Report — Confidential</p></div></body></html>`;
  return html;
}
