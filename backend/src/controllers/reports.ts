import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function generateReport(req: Request, res: Response) {
  try {
    const { type, metrics, format, startDate, endDate } = req.body;
    const userId = req.user!.userId;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate and endDate are required' });
    }

    const report: any = {
      generatedAt: new Date().toISOString(),
      userId,
      reportType: type || 'weekly',
      dateRange: { start: startDate, end: endDate },
      summary: {},
    };

    if (!metrics || metrics === 'all' || metrics === 'energy') {
      const spoonBudgets = await prisma.spoonBudget.findMany({
        where: { userId, date: { gte: startDate, lte: endDate } },
        include: { activities: true, recoveries: true },
      });
      const totalSpoons = spoonBudgets.reduce((sum, s) => sum + s.totalSpoons, 0);
      const totalRemaining = spoonBudgets.reduce((sum, s) => sum + s.remainingSpoons, 0);
      const totalActivities = spoonBudgets.reduce((sum, s) => sum + s.activities.length, 0);
      const totalRecoveries = spoonBudgets.reduce((sum, s) => sum + s.recoveries.length, 0);
      report.energy = {
        totalEntries: spoonBudgets.length,
        totalSpoons,
        totalRemaining,
        avgRemaining: spoonBudgets.length > 0 ? (totalRemaining / spoonBudgets.length).toFixed(1) : '0',
        totalActivities,
        totalRecoveries,
      };
    }

    if (!metrics || metrics === 'all' || metrics === 'supplements') {
      const supplements = await prisma.supplement.findMany({ where: { userId } });
      report.supplements = { total: supplements.length, list: supplements };
    }

    if (!metrics || metrics === 'all' || metrics === 'meals') {
      const meals = await prisma.mealLog.findMany({
        where: { userId, mealTime: { gte: new Date(startDate), lte: new Date(endDate + 'T23:59:59.999Z') } },
      });
      report.meals = { total: meals.length, entries: meals };
    }

    if (!metrics || metrics === 'all' || metrics === 'mood') {
      report.mood = { note: 'Mood data stored locally on client' };
    }

    if (!metrics || metrics === 'all' || metrics === 'pain') {
      const painLogs = await prisma.painLog.findMany({
        where: { userId, date: { gte: startDate, lte: endDate } },
      });
      const avgPain = painLogs.length > 0
        ? (painLogs.reduce((sum, p) => sum + p.painLevel, 0) / painLogs.length).toFixed(1)
        : '0';
      report.pain = { total: painLogs.length, avgPainLevel: avgPain, entries: painLogs };
    }

    report.summary = {
      totalDays: Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000),
      metricsIncluded: metrics || 'all',
    };

    if (format === 'csv') {
      let csv = 'Section,Field,Value\n';
      const addRow = (section: string, field: string, value: any) => {
        csv += `"${section}","${field}","${String(value).replace(/"/g, '""')}"\n`;
      };
      addRow('Report', 'Generated At', report.generatedAt);
      addRow('Report', 'Type', report.reportType);
      addRow('Report', 'Date Range', `${startDate} to ${endDate}`);
      if (report.energy) {
        addRow('Energy', 'Total Entries', report.energy.totalEntries);
        addRow('Energy', 'Avg Remaining', report.energy.avgRemaining);
        addRow('Energy', 'Total Activities', report.energy.totalActivities);
      }
      if (report.pain) {
        addRow('Pain', 'Total Entries', report.pain.total);
        addRow('Pain', 'Avg Pain Level', report.pain.avgPainLevel);
      }
      if (report.meals) addRow('Meals', 'Total Entries', report.meals.total);
      if (report.supplements) addRow('Supplements', 'Total', report.supplements.total);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=vitanexa-report-${type || 'weekly'}-${startDate}.csv`);
      return res.send(csv);
    }

    res.json(report);
  } catch (error: any) {
    console.error('Report generation error:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
}
