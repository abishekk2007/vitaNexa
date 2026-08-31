import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { qs } from '../utils/types';

const prisma = new PrismaClient();

export async function setBudget(req: Request, res: Response): Promise<void> {
  try {
    const { date, totalSpoons } = req.body;
    const budgetDate = date ? new Date(date) : new Date();
    budgetDate.setHours(0, 0, 0, 0);

    const existing = await prisma.spoonBudget.findFirst({
      where: { userId: req.user!.userId, date: budgetDate },
    });

    let budget;
    if (existing) {
      const consumed = Number(existing.totalSpoons) - Number(existing.remainingSpoons);
      budget = await prisma.spoonBudget.update({
        where: { id: existing.id },
        data: { totalSpoons, remainingSpoons: totalSpoons - consumed },
      });
    } else {
      budget = await prisma.spoonBudget.create({
        data: { userId: req.user!.userId, date: budgetDate, totalSpoons, remainingSpoons: totalSpoons },
      });
    }

    res.json(budget);
  } catch (error) {
    console.error('Set budget error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getBudget(req: Request, res: Response): Promise<void> {
  try {
    const date = qs(req.query.date) ? new Date(qs(req.query.date)) : new Date();
    date.setHours(0, 0, 0, 0);

    const budget = await prisma.spoonBudget.findFirst({
      where: { userId: req.user!.userId, date },
      include: { activities: true, recoveries: true },
    });

    if (!budget) {
      res.json({ date, totalSpoons: 0, remainingSpoons: 0, activities: [], recoveries: [] });
      return;
    }
    res.json(budget);
  } catch (error) {
    console.error('Get budget error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function logActivity(req: Request, res: Response): Promise<void> {
  try {
    const { name, spoonCost, category, spoonBudgetId } = req.body;
    let budgetId = spoonBudgetId;

    if (!budgetId) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      let budget = await prisma.spoonBudget.findFirst({
        where: { userId: req.user!.userId, date: today },
      });
      if (!budget) {
        budget = await prisma.spoonBudget.create({
          data: { userId: req.user!.userId, date: today, totalSpoons: 10, remainingSpoons: 10 },
        });
      }
      budgetId = budget.id;
    }

    const activity = await prisma.activity.create({
      data: { userId: req.user!.userId, name, spoonCost, category, spoonBudgetId: budgetId },
    });

    const budget = await prisma.spoonBudget.findUnique({ where: { id: budgetId } });
    if (budget) {
      await prisma.spoonBudget.update({
        where: { id: budgetId },
        data: { remainingSpoons: Math.max(0, Number(budget.remainingSpoons) - spoonCost) },
      });
    }

    res.status(201).json(activity);
  } catch (error) {
    console.error('Log activity error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function logRecovery(req: Request, res: Response): Promise<void> {
  try {
    const { activity, spoonsGained, notes, spoonBudgetId } = req.body;
    let budgetId = spoonBudgetId;

    if (!budgetId) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      let budget = await prisma.spoonBudget.findFirst({
        where: { userId: req.user!.userId, date: today },
      });
      if (!budget) {
        budget = await prisma.spoonBudget.create({
          data: { userId: req.user!.userId, date: today, totalSpoons: 10, remainingSpoons: 10 },
        });
      }
      budgetId = budget.id;
    }

    const recovery = await prisma.recovery.create({
      data: { userId: req.user!.userId, activity, spoonsGained, notes, spoonBudgetId: budgetId },
    });

    const budget = await prisma.spoonBudget.findUnique({ where: { id: budgetId } });
    if (budget) {
      await prisma.spoonBudget.update({
        where: { id: budgetId },
        data: { remainingSpoons: Number(budget.remainingSpoons) + spoonsGained },
      });
    }

    res.status(201).json(recovery);
  } catch (error) {
    console.error('Log recovery error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function deleteActivity(req: Request, res: Response): Promise<void> {
  try {
    const activity = await prisma.activity.findFirst({
      where: { id: req.params.id as string, userId: req.user!.userId },
    });
    if (!activity) { res.status(404).json({ error: 'Not found' }); return; }

    await prisma.activity.delete({ where: { id: req.params.id as string } });
    if (activity.spoonBudgetId) {
      const budget = await prisma.spoonBudget.findUnique({ where: { id: activity.spoonBudgetId } });
      if (budget) {
        await prisma.spoonBudget.update({
          where: { id: activity.spoonBudgetId },
          data: { remainingSpoons: Number(budget.remainingSpoons) + Number(activity.spoonCost) },
        });
      }
    }
    res.json({ message: 'Deleted' });
  } catch (error) {
    console.error('Delete activity error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function deleteRecovery(req: Request, res: Response): Promise<void> {
  try {
    const recovery = await prisma.recovery.findFirst({
      where: { id: req.params.id as string, userId: req.user!.userId },
    });
    if (!recovery) { res.status(404).json({ error: 'Not found' }); return; }

    await prisma.recovery.delete({ where: { id: req.params.id as string } });
    if (recovery.spoonBudgetId) {
      const budget = await prisma.spoonBudget.findUnique({ where: { id: recovery.spoonBudgetId } });
      if (budget) {
        await prisma.spoonBudget.update({
          where: { id: recovery.spoonBudgetId },
          data: { remainingSpoons: Math.max(0, Number(budget.remainingSpoons) - Number(recovery.spoonsGained)) },
        });
      }
    }
    res.json({ message: 'Deleted' });
  } catch (error) {
    console.error('Delete recovery error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getPresets(req: Request, res: Response): Promise<void> {
  try {
    const presets = await prisma.activityPreset.findMany({
      where: { userId: req.user!.userId },
      orderBy: { name: 'asc' },
    });
    res.json(presets);
  } catch (error) {
    console.error('Get presets error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function createPreset(req: Request, res: Response): Promise<void> {
  try {
    const preset = await prisma.activityPreset.create({
      data: { ...req.body, userId: req.user!.userId },
    });
    res.status(201).json(preset);
  } catch (error) {
    console.error('Create preset error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function deletePreset(req: Request, res: Response): Promise<void> {
  try {
    await prisma.activityPreset.deleteMany({
      where: { id: req.params.id as string, userId: req.user!.userId },
    });
    res.json({ message: 'Deleted' });
  } catch (error) {
    console.error('Delete preset error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getHistory(req: Request, res: Response): Promise<void> {
  try {
    const days = parseInt(qs(req.query.days)) || 14;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const budgets = await prisma.spoonBudget.findMany({
      where: { userId: req.user!.userId, date: { gte: startDate } },
      include: { activities: true, recoveries: true },
      orderBy: { date: 'asc' },
    });

    res.json(budgets);
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function detectPatterns(req: Request, res: Response): Promise<void> {
  try {
    const days = 21;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const budgets = await prisma.spoonBudget.findMany({
      where: { userId: req.user!.userId, date: { gte: startDate } },
      include: { activities: true },
      orderBy: { date: 'asc' },
    });

    const patterns: string[] = [];
    if (budgets.length < 7) {
      patterns.push('Not enough data. Track at least 7 days for pattern detection.');
      res.json({ patterns });
      return;
    }

    const ranOut = budgets.filter((b) => Number(b.remainingSpoons) <= 0);
    const dayCount: Record<string, number> = {};
    ranOut.forEach((b) => {
      const day = b.date.toLocaleDateString('en-US', { weekday: 'long' });
      dayCount[day] = (dayCount[day] || 0) + 1;
    });

    Object.entries(dayCount).forEach(([day, count]) => {
      if (count >= 3) {
        patterns.push(`Ran out of spoons every ${day} for ${count} week(s).`);
      }
    });

    const highActivity = budgets.filter((b) => {
      const totalCost = b.activities.reduce((s, a) => s + Number(a.spoonCost), 0);
      return totalCost > Number(b.totalSpoons) * 0.8;
    });

    if (highActivity.length >= 3) {
      patterns.push(`Exceeded 80% of spoon budget on ${highActivity.length} days in the last ${days} days.`);
    }

    if (patterns.length === 0) {
      patterns.push('No significant patterns detected. Your energy usage appears consistent.');
    }

    res.json({ patterns });
  } catch (error) {
    console.error('Detect spoon patterns error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function resetDay(req: Request, res: Response): Promise<void> {
  try {
    const date = req.body.date ? new Date(req.body.date) : new Date();
    date.setHours(0, 0, 0, 0);

    const budget = await prisma.spoonBudget.findFirst({
      where: { userId: req.user!.userId, date },
    });
    if (!budget) { res.status(404).json({ error: 'No budget found for this date' }); return; }

    await prisma.activity.deleteMany({ where: { spoonBudgetId: budget.id } });
    await prisma.recovery.deleteMany({ where: { spoonBudgetId: budget.id } });

    const updated = await prisma.spoonBudget.update({
      where: { id: budget.id },
      data: { remainingSpoons: budget.totalSpoons },
    });

    res.json(updated);
  } catch (error) {
    console.error('Reset day error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}



