import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { qs } from '../utils/types';

const prisma = new PrismaClient();

export async function createBacteriaResult(req: Request, res: Response): Promise<void> {
  try {
    const result = await prisma.bacteriaResult.create({
      data: { ...req.body, userId: req.user!.userId },
    });
    res.status(201).json(result);
  } catch (error) {
    console.error('Create bacteria error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getBacteriaResults(req: Request, res: Response): Promise<void> {
  try {
    const results = await prisma.bacteriaResult.findMany({
      where: { userId: req.user!.userId },
      orderBy: { recordedAt: 'desc' },
    });
    res.json(results);
  } catch (error) {
    console.error('Get bacteria error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function deleteBacteriaResult(req: Request, res: Response): Promise<void> {
  try {
    await prisma.bacteriaResult.deleteMany({
      where: { id: req.params.id as string, userId: req.user!.userId },
    });
    res.json({ message: 'Deleted' });
  } catch (error) {
    console.error('Delete bacteria error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getRecommendations(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const results = await prisma.bacteriaResult.findMany({
      where: { userId },
      orderBy: { recordedAt: 'desc' },
    });

    const highBacteria = results.filter((r) => r.level === 'HIGH').map((r) => r.bacteriaName.toLowerCase());
    const lowBacteria = results.filter((r) => r.level === 'LOW').map((r) => r.bacteriaName.toLowerCase());

    const allFoods = await prisma.foodDatabase.findMany();

    const recommended = allFoods.filter((f) =>
      f.effect === 'FEEDS_GOOD_BACTERIA' || (lowBacteria.length > 0 && f.prebiotic)
    );

    const toAvoid = allFoods.filter((f) =>
      f.effect === 'MAY_CAUSE_BLOATING' && highBacteria.length > 0
    );

    let bestTiming = 'Morning (empty stomach)';
    if (highBacteria.length > lowBacteria.length) {
      bestTiming = 'Before meals for best absorption';
    }

    res.json({
      recommendedFoods: recommended,
      foodsToAvoid: toAvoid,
      bestProbioticTiming: bestTiming,
      analysis: {
        highBacteria: highBacteria.length,
        lowBacteria: lowBacteria.length,
        normalBacteria: results.filter((r) => r.level === 'NORMAL').length,
      },
    });
  } catch (error) {
    console.error('Recommendations error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}



