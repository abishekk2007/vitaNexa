import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { qs } from '../utils/types';

const prisma = new PrismaClient();

export async function createSavingsEntry(req: Request, res: Response): Promise<void> {
  try {
    const { date, amount, notes } = req.body;
    const entryDate = date ? new Date(date) : new Date();

    const lastEntry = await prisma.savingsEntry.findFirst({
      where: { userId: req.user!.userId },
      orderBy: { date: 'desc' },
    });
    const previousTotal = lastEntry ? Number(lastEntry.runningTotal) : 0;

    const entry = await prisma.savingsEntry.create({
      data: {
        userId: req.user!.userId,
        date: entryDate,
        amount,
        runningTotal: previousTotal + amount,
        notes,
      },
    });

    res.status(201).json(entry);
  } catch (error) {
    console.error('Create savings entry error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getSavingsEntries(req: Request, res: Response): Promise<void> {
  try {
    const { startDate, endDate, page, limit } = req.query;
    const where: any = { userId: req.user!.userId };
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate as string);
      if (endDate) where.date.lte = new Date(endDate as string);
    }

    const p = parseInt(page as string) || 1;
    const l = parseInt(limit as string) || 50;
    const total = await prisma.savingsEntry.count({ where });
    const entries = await prisma.savingsEntry.findMany({
      where,
      orderBy: { date: 'desc' },
      skip: (p - 1) * l,
      take: l,
    });

    res.json({ data: entries, pagination: { page: p, limit: l, total, totalPages: Math.ceil(total / l) } });
  } catch (error) {
    console.error('Get savings entries error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function deleteSavingsEntry(req: Request, res: Response): Promise<void> {
  try {
    const entry = await prisma.savingsEntry.findFirst({
      where: { id: req.params.id as string, userId: req.user!.userId },
    });
    if (!entry) { res.status(404).json({ error: 'Not found' }); return; }

    await prisma.savingsEntry.delete({ where: { id: req.params.id as string } });

    const laterEntries = await prisma.savingsEntry.findMany({
      where: { userId: req.user!.userId, date: { gt: entry.date } },
      orderBy: { date: 'asc' },
    });

    let runningTotal = 0;
    const allEntries = await prisma.savingsEntry.findMany({
      where: { userId: req.user!.userId },
      orderBy: { date: 'asc' },
    });

    for (const e of allEntries) {
      runningTotal += Number(e.amount);
      await prisma.savingsEntry.update({
        where: { id: e.id },
        data: { runningTotal },
      });
    }

    res.json({ message: 'Deleted' });
  } catch (error) {
    console.error('Delete savings entry error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function createSavingsGoal(req: Request, res: Response): Promise<void> {
  try {
    const goal = await prisma.savingsGoal.create({
      data: { ...req.body, userId: req.user!.userId },
    });
    res.status(201).json(goal);
  } catch (error) {
    console.error('Create savings goal error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getSavingsGoals(req: Request, res: Response): Promise<void> {
  try {
    const goals = await prisma.savingsGoal.findMany({
      where: { userId: req.user!.userId },
      orderBy: { createdAt: 'desc' },
    });

    const latestEntry = await prisma.savingsEntry.findFirst({
      where: { userId: req.user!.userId },
      orderBy: { date: 'desc' },
    });

    res.json({ goals, currentTotal: latestEntry ? Number(latestEntry.runningTotal) : 0 });
  } catch (error) {
    console.error('Get savings goals error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateSavingsGoal(req: Request, res: Response): Promise<void> {
  try {
    const goal = await prisma.savingsGoal.updateMany({
      where: { id: req.params.id as string, userId: req.user!.userId },
      data: req.body,
    });
    if (goal.count === 0) { res.status(404).json({ error: 'Not found' }); return; }
    res.json({ message: 'Updated' });
  } catch (error) {
    console.error('Update savings goal error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function deleteSavingsGoal(req: Request, res: Response): Promise<void> {
  try {
    await prisma.savingsGoal.deleteMany({ where: { id: req.params.id as string, userId: req.user!.userId } });
    res.json({ message: 'Deleted' });
  } catch (error) {
    console.error('Delete savings goal error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}



