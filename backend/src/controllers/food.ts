import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { qs } from '../utils/types';

const prisma = new PrismaClient();

export async function createFoodItem(req: Request, res: Response): Promise<void> {
  try {
    const item = await prisma.foodDatabase.create({ data: req.body });
    res.status(201).json(item);
  } catch (error) {
    console.error('Create food error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getFoodItems(req: Request, res: Response): Promise<void> {
  try {
    const { category, effect, search, prebiotic, probiotic, page, limit } = req.query;
    const where: any = {};
    if (category) where.category = category;
    if (effect) where.effect = effect;
    if (prebiotic) where.prebiotic = prebiotic === 'true';
    if (probiotic) where.probiotic = probiotic === 'true';
    if (search) where.name = { contains: search as string, mode: 'insensitive' };

    const p = parseInt(page as string) || 1;
    const l = parseInt(limit as string) || 50;
    const total = await prisma.foodDatabase.count({ where });
    const items = await prisma.foodDatabase.findMany({
      where,
      orderBy: { name: 'asc' },
      skip: (p - 1) * l,
      take: l,
    });

    res.json({ data: items, pagination: { page: p, limit: l, total, totalPages: Math.ceil(total / l) } });
  } catch (error) {
    console.error('Get food error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateFoodItem(req: Request, res: Response): Promise<void> {
  try {
    const item = await prisma.foodDatabase.update({ where: { id: req.params.id as string }, data: req.body });
    res.json(item);
  } catch (error) {
    console.error('Update food error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function deleteFoodItem(req: Request, res: Response): Promise<void> {
  try {
    await prisma.foodDatabase.delete({ where: { id: req.params.id as string } });
    res.json({ message: 'Deleted' });
  } catch (error) {
    console.error('Delete food error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function createFoodLog(req: Request, res: Response): Promise<void> {
  try {
    const log = await prisma.foodLog.create({
      data: { ...req.body, userId: req.user!.userId },
    });
    res.status(201).json(log);
  } catch (error) {
    console.error('Create food log error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getFoodLogs(req: Request, res: Response): Promise<void> {
  try {
    const { startDate, endDate, page, limit } = req.query;
    const where: any = { userId: req.user!.userId };
    if (startDate || endDate) {
      where.eatenAt = {};
      if (startDate) where.eatenAt.gte = new Date(startDate as string);
      if (endDate) where.eatenAt.lte = new Date(endDate as string);
    }

    const p = parseInt(page as string) || 1;
    const l = parseInt(limit as string) || 50;
    const total = await prisma.foodLog.count({ where });
    const logs = await prisma.foodLog.findMany({
      where,
      include: { food: true },
      orderBy: { eatenAt: 'desc' },
      skip: (p - 1) * l,
      take: l,
    });

    res.json({ data: logs, pagination: { page: p, limit: l, total, totalPages: Math.ceil(total / l) } });
  } catch (error) {
    console.error('Get food logs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function deleteFoodLog(req: Request, res: Response): Promise<void> {
  try {
    await prisma.foodLog.deleteMany({ where: { id: req.params.id as string, userId: req.user!.userId } });
    res.json({ message: 'Deleted' });
  } catch (error) {
    console.error('Delete food log error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}



