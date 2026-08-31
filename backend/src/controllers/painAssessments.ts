import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function createPainAssessment(req: Request, res: Response): Promise<void> {
  try {
    const assessment = await prisma.painAssessment.create({
      data: { ...req.body, userId: req.user!.userId },
    });
    res.status(201).json(assessment);
  } catch (error) {
    console.error('Create pain assessment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getMyPainAssessments(req: Request, res: Response): Promise<void> {
  try {
    const assessments = await prisma.painAssessment.findMany({
      where: { userId: req.user!.userId },
      orderBy: { createdAt: 'desc' },
    });
    res.json(assessments);
  } catch (error) {
    console.error('Get pain assessments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateMyPainAssessment(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;
    const existing = await prisma.painAssessment.findFirst({
      where: { id, userId: req.user!.userId },
    });
    if (!existing) {
      res.status(404).json({ error: 'Assessment not found' });
      return;
    }
    const updated = await prisma.painAssessment.update({
      where: { id },
      data: req.body,
    });
    res.json(updated);
  } catch (error) {
    console.error('Update pain assessment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
