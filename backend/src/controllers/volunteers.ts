import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { qs } from '../utils/types';

const prisma = new PrismaClient();

export async function registerVolunteer(req: Request, res: Response): Promise<void> {
  try {
    const data: any = { ...req.body, userId: req.user!.userId };
    if (req.file) data.idProofUrl = '/uploads/' + req.file.filename;

    const existing = await prisma.volunteerDriver.findFirst({
      where: { userId: req.user!.userId },
    });
    if (existing) {
      res.status(409).json({ error: 'Already registered as volunteer' });
      return;
    }

    const volunteer = await prisma.volunteerDriver.create({ data });
    res.status(201).json(volunteer);
  } catch (error) {
    console.error('Register volunteer error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getMyVolunteerStatus(req: Request, res: Response): Promise<void> {
  try {
    const volunteer = await prisma.volunteerDriver.findFirst({
      where: { userId: req.user!.userId },
    });
    res.json(volunteer || { status: 'NOT_REGISTERED' });
  } catch (error) {
    console.error('Get volunteer status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getVerifiedVolunteers(req: Request, res: Response): Promise<void> {
  try {
    const { lat, lng } = req.query;
    let volunteers = await prisma.volunteerDriver.findMany({
      where: { status: 'VERIFIED' },
      select: { id: true, name: true, phone: true, latitude: true, longitude: true },
    });

    if (lat && lng) {
      const userLat = parseFloat(lat as string);
      const userLng = parseFloat(lng as string);
      if (!isNaN(userLat) && !isNaN(userLng)) {
        volunteers = volunteers
          .filter((v) => v.latitude && v.longitude)
          .map((v) => ({
            ...v,
            distance: calculateDistance(userLat, userLng, Number(v.latitude), Number(v.longitude)),
          }))
          .sort((a: any, b: any) => a.distance - b.distance) as any;
      }
    }

    res.json(volunteers);
  } catch (error) {
    console.error('Get verified volunteers error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getAllVolunteers(req: Request, res: Response): Promise<void> {
  try {
    const { status, page, limit } = req.query;
    const where: any = {};
    if (status) where.status = status;

    const p = parseInt(page as string) || 1;
    const l = parseInt(limit as string) || 50;
    const total = await prisma.volunteerDriver.count({ where });
    const volunteers = await prisma.volunteerDriver.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (p - 1) * l,
      take: l,
    });

    res.json({ data: volunteers, pagination: { page: p, limit: l, total, totalPages: Math.ceil(total / l) } });
  } catch (error) {
    console.error('Get all volunteers error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function approveVolunteer(req: Request, res: Response): Promise<void> {
  try {
    const volunteer = await prisma.volunteerDriver.update({
      where: { id: req.params.id as string },
      data: { status: 'VERIFIED' },
    });

    await prisma.notification.create({
      data: {
        userId: volunteer.userId,
        title: 'Volunteer Application Approved',
        message: 'Your volunteer driver application has been approved!',
        type: 'SUCCESS',
        link: '/dashboard/emergency',
      },
    });

    await prisma.auditLog.create({
      data: { userId: req.user!.userId, action: 'APPROVE_VOLUNTEER', entity: 'VolunteerDriver', entityId: volunteer.id, ipAddress: req.ip },
    });

    res.json(volunteer);
  } catch (error) {
    console.error('Approve volunteer error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function rejectVolunteer(req: Request, res: Response): Promise<void> {
  try {
    const volunteer = await prisma.volunteerDriver.update({
      where: { id: req.params.id as string },
      data: { status: 'REJECTED' },
    });

    await prisma.notification.create({
      data: {
        userId: volunteer.userId,
        title: 'Volunteer Application Status',
        message: 'Your volunteer driver application has been reviewed. Please contact support for details.',
        type: 'WARNING',
        link: '/dashboard/emergency',
      },
    });

    await prisma.auditLog.create({
      data: { userId: req.user!.userId, action: 'REJECT_VOLUNTEER', entity: 'VolunteerDriver', entityId: volunteer.id, ipAddress: req.ip },
    });

    res.json(volunteer);
  } catch (error) {
    console.error('Reject volunteer error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}



