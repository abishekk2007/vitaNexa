import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { qs } from '../utils/types';

const prisma = new PrismaClient();

export async function createMealLog(req: Request, res: Response): Promise<void> {
  try {
    const log = await prisma.mealLog.create({
      data: { ...req.body, userId: req.user!.userId },
    });
    res.status(201).json(log);
  } catch (error) {
    console.error('Create meal log error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getMealLogs(req: Request, res: Response): Promise<void> {
  try {
    const { startDate, endDate, page, limit } = req.query;
    const where: any = { userId: req.user!.userId };
    if (startDate || endDate) {
      where.mealTime = {};
      if (startDate) where.mealTime.gte = new Date(startDate as string);
      if (endDate) where.mealTime.lte = new Date(endDate as string);
    }

    const p = parseInt(page as string) || 1;
    const l = parseInt(limit as string) || 50;
    const total = await prisma.mealLog.count({ where });
    const logs = await prisma.mealLog.findMany({
      where,
      orderBy: { mealTime: 'desc' },
      skip: (p - 1) * l,
      take: l,
    });

    res.json({ data: logs, pagination: { page: p, limit: l, total, totalPages: Math.ceil(total / l) } });
  } catch (error) {
    console.error('Get meal logs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateMealLog(req: Request, res: Response): Promise<void> {
  try {
    const log = await prisma.mealLog.updateMany({
      where: { id: req.params.id as string, userId: req.user!.userId },
      data: req.body,
    });
    if (log.count === 0) { res.status(404).json({ error: 'Not found' }); return; }
    res.json({ message: 'Updated' });
  } catch (error) {
    console.error('Update meal log error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function deleteMealLog(req: Request, res: Response): Promise<void> {
  try {
    await prisma.mealLog.deleteMany({ where: { id: req.params.id as string, userId: req.user!.userId } });
    res.json({ message: 'Deleted' });
  } catch (error) {
    console.error('Delete meal log error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}



