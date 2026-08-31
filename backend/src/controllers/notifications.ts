import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { qs } from '../utils/types';

const prisma = new PrismaClient();

export async function getNotifications(req: Request, res: Response): Promise<void> {
  try {
    const { page, limit, unread } = req.query;
    const where: any = { userId: req.user!.userId };
    if (unread === 'true') where.read = false;

    const p = parseInt(page as string) || 1;
    const l = parseInt(limit as string) || 50;
    const total = await prisma.notification.count({ where });
    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (p - 1) * l,
      take: l,
    });

    res.json({ data: notifications, pagination: { page: p, limit: l, total, totalPages: Math.ceil(total / l) } });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function markAsRead(req: Request, res: Response): Promise<void> {
  try {
    await prisma.notification.updateMany({
      where: { id: req.params.id as string, userId: req.user!.userId },
      data: { read: true },
    });
    res.json({ message: 'Marked as read' });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function markAllAsRead(req: Request, res: Response): Promise<void> {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user!.userId, read: false },
      data: { read: true },
    });
    res.json({ message: 'All marked as read' });
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getUnreadCount(req: Request, res: Response): Promise<void> {
  try {
    const count = await prisma.notification.count({
      where: { userId: req.user!.userId, read: false },
    });
    res.json({ count });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}



