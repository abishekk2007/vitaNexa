import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { qs } from '../utils/types';

const prisma = new PrismaClient();

export async function createPainLog(req: Request, res: Response): Promise<void> {
  try {
    const log = await prisma.painLog.create({
      data: { ...req.body, userId: req.user!.userId },
    });
    res.status(201).json(log);
  } catch (error) {
    console.error('Create pain log error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getPainLogs(req: Request, res: Response): Promise<void> {
  try {
    const { startDate, endDate, page, limit, sortBy, sortOrder } = req.query;
    const where: any = { userId: req.user!.userId };
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate as string);
      if (endDate) where.date.lte = new Date(endDate as string);
    }

    const p = parseInt(page as string) || 1;
    const l = parseInt(limit as string) || 50;

    const orderField = (sortBy as string) || 'date';
    const orderDir = (sortOrder as string) || 'desc';

    const total = await prisma.painLog.count({ where });
    const logs = await prisma.painLog.findMany({
      where,
      orderBy: { [orderField]: orderDir },
      skip: (p - 1) * l,
      take: l,
    });

    res.json({ data: logs, pagination: { page: p, limit: l, total, totalPages: Math.ceil(total / l) } });
  } catch (error) {
    console.error('Get pain logs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updatePainLog(req: Request, res: Response): Promise<void> {
  try {
    const log = await prisma.painLog.updateMany({
      where: { id: req.params.id as string, userId: req.user!.userId },
      data: req.body,
    });
    res.json({ message: 'Updated', affected: log.count });
  } catch (error) {
    console.error('Update pain log error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function deletePainLog(req: Request, res: Response): Promise<void> {
  try {
    await prisma.painLog.deleteMany({ where: { id: req.params.id as string, userId: req.user!.userId } });
    res.json({ message: 'Deleted' });
  } catch (error) {
    console.error('Delete pain log error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function detectPatterns(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const logs = await prisma.painLog.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: 20,
    });

    const patterns: string[] = [];
    const total = logs.length;
    if (total < 3) {
      res.json({ patterns: ['Not enough data to detect patterns. Log more pain entries.'], tomorrowOutlook: 'Insufficient data for prediction.' });
      return;
    }

    const highPainLogs = logs.filter((l) => l.painLevel >= 7);
    const humidityLogs = logs.filter((l) => l.humidity !== null && Number(l.humidity) > 60);
    const stressLogs = logs.filter((l) => l.stress === 'HIGH');
    const lowSleepLogs = logs.filter((l) => l.sleepHours !== null && Number(l.sleepHours) < 6);

    if (humidityLogs.length >= 3) {
      const painAfterHumidity = humidityLogs.filter((l) => l.painLevel >= 5).length;
      patterns.push(`Pain occurred after high humidity in ${painAfterHumidity} of last ${humidityLogs.length} logged instances.`);
    }

    if (stressLogs.length >= 3) {
      const painAfterStress = stressLogs.filter((l) => l.painLevel >= 5).length;
      patterns.push(`High stress correlated with pain in ${painAfterStress} of last ${stressLogs.length} instances.`);
    }

    if (lowSleepLogs.length >= 3) {
      const painAfterLowSleep = lowSleepLogs.filter((l) => l.painLevel >= 5).length;
      patterns.push(`Low sleep (<6hrs) preceded pain in ${painAfterLowSleep} of last ${lowSleepLogs.length} instances.`);
    }

    if (highPainLogs.length >= 3) {
      patterns.push(`Severe pain (level 7+) reported in ${highPainLogs.length} of last ${total} logs.`);
    }

    if (patterns.length === 0) {
      patterns.push('No strong patterns detected. Continue logging for better insights.');
    }

    const recentLogs = logs.slice(0, 5);
    const avgPain = recentLogs.length > 0
      ? recentLogs.reduce((sum, l) => sum + l.painLevel, 0) / recentLogs.length
      : 0;

    let tomorrowOutlook = 'Pattern-based estimate only. Not medical advice.';
    if (avgPain >= 7) {
      tomorrowOutlook = 'Based on recent trends, tomorrow may bring similar pain levels. Prepare accordingly. Pattern-based estimate only. Not medical advice.';
    } else if (avgPain >= 4) {
      tomorrowOutlook = 'Moderate pain levels expected. Continue current management strategies. Pattern-based estimate only. Not medical advice.';
    } else {
      tomorrowOutlook = 'Low pain levels predicted for tomorrow based on recent patterns. Pattern-based estimate only. Not medical advice.';
    }

    res.json({ patterns, tomorrowOutlook, recentAverage: Math.round(avgPain * 10) / 10 });
  } catch (error) {
    console.error('Detect patterns error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}



