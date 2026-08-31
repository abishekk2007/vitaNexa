import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function id(req: Request): string { return req.params.id as string; }

export async function getAllPainAssessments(req: Request, res: Response): Promise<void> {
  try {
    const { page, limit, search, status, riskLevel } = req.query;
    const p = parseInt(page as string) || 1;
    const l = parseInt(limit as string) || 50;
    const where: any = {};
    if (status) where.reportStatus = status;
    if (riskLevel) where.riskLevel = riskLevel;
    if (search) {
      where.OR = [
        { location: { contains: search as string } },
        { medication: { contains: search as string } },
        { notes: { contains: search as string } },
      ];
    }
    const total = await prisma.painAssessment.count({ where });
    const assessments = await prisma.painAssessment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (p - 1) * l,
      take: l,
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });
    res.json({
      data: assessments,
      pagination: { page: p, limit: l, total, totalPages: Math.ceil(total / l) },
    });
  } catch (error) {
    console.error('Admin get pain assessments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getPainAssessmentById(req: Request, res: Response): Promise<void> {
  try {
    const assessment = await prisma.painAssessment.findUnique({
      where: { id: id(req) },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
      },
    });
    if (!assessment) {
      res.status(404).json({ error: 'Assessment not found' });
      return;
    }
    res.json(assessment);
  } catch (error) {
    console.error('Admin get pain assessment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updatePainAssessment(req: Request, res: Response): Promise<void> {
  try {
    const existing = await prisma.painAssessment.findUnique({
      where: { id: id(req) },
    });
    if (!existing) {
      res.status(404).json({ error: 'Assessment not found' });
      return;
    }
    const updated = await prisma.painAssessment.update({
      where: { id: id(req) },
      data: req.body,
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });
    res.json(updated);
  } catch (error) {
    console.error('Admin update pain assessment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function deletePainAssessment(req: Request, res: Response): Promise<void> {
  try {
    const existing = await prisma.painAssessment.findUnique({
      where: { id: id(req) },
    });
    if (!existing) {
      res.status(404).json({ error: 'Assessment not found' });
      return;
    }
    await prisma.painAssessment.delete({ where: { id: id(req) } });
    res.json({ message: 'Assessment deleted' });
  } catch (error) {
    console.error('Admin delete pain assessment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getPainAssessmentStats(req: Request, res: Response): Promise<void> {
  try {
    const total = await prisma.painAssessment.count();
    const highRisk = await prisma.painAssessment.count({ where: { riskLevel: 'High' } });
    const moderateRisk = await prisma.painAssessment.count({ where: { riskLevel: 'Moderate' } });
    const lowRisk = await prisma.painAssessment.count({ where: { riskLevel: 'Low' } });
    const pending = await prisma.painAssessment.count({ where: { reportStatus: 'pending' } });
    res.json({ total, highRisk, moderateRisk, lowRisk, pending });
  } catch (error) {
    console.error('Admin pain stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
