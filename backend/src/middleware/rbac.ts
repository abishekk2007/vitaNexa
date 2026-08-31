import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const requireRole = (roles: string[]) => {
  return (req: any, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to perform this action.',
        }
      });
    }
    next();
  };
};

export const requireHealthWorker = async (req: any, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated.' } });
  }

  try {
    const worker = await prisma.healthcareWorker.findUnique({
      where: { user_id: req.user.userId }
    });

    if (!worker || worker.status !== 'ACTIVE') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You are not registered as an active healthcare worker.',
        }
      });
    }

    req.healthWorker = worker;
    next();
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to verify health worker status.' } });
  }
};
