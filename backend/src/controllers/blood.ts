import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { sendNotificationEmail } from '../utils/email';
import { qs } from '../utils/types';

const prisma = new PrismaClient();

const BLOOD_COMPATIBILITY: Record<string, string[]> = {
  'A+': ['A+', 'AB+'],
  'A-': ['A-', 'A+', 'AB-', 'AB+'],
  'B+': ['B+', 'AB+'],
  'B-': ['B-', 'B+', 'AB-', 'AB+'],
  'AB+': ['AB+'],
  'AB-': ['AB-', 'AB+'],
  'O+': ['O+', 'A+', 'B+', 'AB+'],
  'O-': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
};

export async function registerDonor(req: Request, res: Response): Promise<void> {
  try {
    const existing = await prisma.bloodDonor.findFirst({
      where: { userId: req.user!.userId },
    });
    if (existing) {
      const donor = await prisma.bloodDonor.update({
        where: { id: existing.id },
        data: { ...req.body },
      });
      res.json(donor);
      return;
    }

    const donor = await prisma.bloodDonor.create({
      data: { ...req.body, name: req.user!.email, userId: req.user!.userId },
    });
    res.status(201).json(donor);
  } catch (error) {
    console.error('Register donor error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getMyDonorStatus(req: Request, res: Response): Promise<void> {
  try {
    const donor = await prisma.bloodDonor.findFirst({ where: { userId: req.user!.userId } });
    res.json(donor || null);
  } catch (error) {
    console.error('Get donor status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getDonors(req: Request, res: Response): Promise<void> {
  try {
    const { bloodGroup, isAvailable, page, limit } = req.query;
    const where: any = {};
    if (bloodGroup) where.bloodGroup = bloodGroup;
    if (isAvailable !== undefined) where.isAvailable = isAvailable === 'true';

    const p = parseInt(page as string) || 1;
    const l = parseInt(limit as string) || 50;
    const total = await prisma.bloodDonor.count({ where });
    const donors = await prisma.bloodDonor.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (p - 1) * l,
      take: l,
    });

    res.json({ data: donors, pagination: { page: p, limit: l, total, totalPages: Math.ceil(total / l) } });
  } catch (error) {
    console.error('Get donors error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function createBloodRequest(req: Request, res: Response): Promise<void> {
  try {
    const request = await prisma.bloodRequest.create({
      data: { ...req.body, userId: req.user!.userId },
    });

    const compatibleGroups = BLOOD_COMPATIBILITY[req.body.bloodGroupNeeded] || [];
    const eligibleDonors = await prisma.bloodDonor.findMany({
      where: {
        bloodGroup: { in: compatibleGroups },
        isAvailable: true,
        OR: [
          { lastDonationDate: null },
          { lastDonationDate: { lte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } },
        ],
      },
      include: { user: { select: { email: true } } },
    });

    for (const donor of eligibleDonors) {
      await prisma.notification.create({
        data: {
          userId: donor.userId,
          title: 'Blood Request Match',
          message: `Blood request for ${req.body.bloodGroupNeeded} at ${req.body.hospital}. Urgency: ${req.body.urgency}`,
          type: 'INFO',
          link: '/dashboard/blood',
        },
      });
      if (donor.user?.email) {
        await sendNotificationEmail(
          donor.user.email,
          'Blood Donation Request',
          `A blood donation request for ${req.body.bloodGroupNeeded} has been posted at ${req.body.hospital}. Urgency: ${req.body.urgency}`
        );
      }
    }

    res.status(201).json({ request, matchedDonors: eligibleDonors.length });
  } catch (error) {
    console.error('Create blood request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getBloodRequests(req: Request, res: Response): Promise<void> {
  try {
    const { status, urgency, bloodGroupNeeded, page, limit } = req.query;
    const where: any = {};
    if (status) where.status = status;
    if (urgency) where.urgency = urgency;
    if (bloodGroupNeeded) where.bloodGroupNeeded = bloodGroupNeeded;

    const p = parseInt(page as string) || 1;
    const l = parseInt(limit as string) || 50;
    const total = await prisma.bloodRequest.count({ where });
    const requests = await prisma.bloodRequest.findMany({
      where,
      orderBy: [
        { urgency: 'desc' },
        { createdAt: 'desc' },
      ],
      skip: (p - 1) * l,
      take: l,
    });

    res.json({ data: requests, pagination: { page: p, limit: l, total, totalPages: Math.ceil(total / l) } });
  } catch (error) {
    console.error('Get blood requests error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateBloodRequest(req: Request, res: Response): Promise<void> {
  try {
    const request = await prisma.bloodRequest.update({
      where: { id: req.params.id as string },
      data: { status: req.body.status },
    });
    res.json(request);
  } catch (error) {
    console.error('Update blood request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function matchDonors(req: Request, res: Response): Promise<void> {
  try {
    const { bloodGroupNeeded } = req.query;
    if (!bloodGroupNeeded) {
      res.status(400).json({ error: 'Blood group needed is required' });
      return;
    }

    const compatibleGroups = BLOOD_COMPATIBILITY[bloodGroupNeeded as string] || [];

    const donors = await prisma.bloodDonor.findMany({
      where: {
        bloodGroup: { in: compatibleGroups },
        isAvailable: true,
        OR: [
          { lastDonationDate: null },
          { lastDonationDate: { lte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } },
        ],
      },
      orderBy: { lastDonationDate: { sort: 'asc', nulls: 'first' } },
    });

    res.json({ compatibleDonors: donors, count: donors.length });
  } catch (error) {
    console.error('Match donors error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}



