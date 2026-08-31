import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { qs } from '../utils/types';

const prisma = new PrismaClient();

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

export async function createHospital(req: Request, res: Response): Promise<void> {
  try {
    const hospital = await prisma.hospital.create({ data: req.body });
    res.status(201).json(hospital);
  } catch (error) {
    console.error('Create hospital error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getHospitals(req: Request, res: Response): Promise<void> {
  try {
    const city = qs(req.query.city);
    const type = qs(req.query.type);
    const page = parseInt(qs(req.query.page)) || 1;
    const limit = parseInt(qs(req.query.limit)) || 50;
    const where: any = {};
    if (city) where.city = { contains: city, mode: 'insensitive' };
    if (type) where.type = type;

    const total = await prisma.hospital.count({ where });
    const hospitals = await prisma.hospital.findMany({
      where,
      orderBy: { name: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    res.json({ data: hospitals, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    console.error('Get hospitals error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getNearbyHospitals(req: Request, res: Response): Promise<void> {
  try {
    const lat = parseFloat(qs(req.query.lat));
    const lng = parseFloat(qs(req.query.lng));
    const type = qs(req.query.type);

    if (isNaN(lat) || isNaN(lng)) {
      res.status(400).json({ error: 'Latitude and longitude are required' });
      return;
    }

    const where: any = {};
    if (type) where.type = type;

    const allHospitals = await prisma.hospital.findMany({ where });

    const withDistance = allHospitals.map((h) => ({
      ...h,
      distance: calculateDistance(lat, lng, Number(h.latitude), Number(h.longitude)),
    }));

    withDistance.sort((a, b) => a.distance - b.distance);
    res.json(withDistance.slice(0, 20));
  } catch (error) {
    console.error('Get nearby hospitals error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateHospital(req: Request, res: Response): Promise<void> {
  try {
    const hospital = await prisma.hospital.update({ where: { id: req.params.id as string }, data: req.body });
    res.json(hospital);
  } catch (error) {
    console.error('Update hospital error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function deleteHospital(req: Request, res: Response): Promise<void> {
  try {
    await prisma.hospital.delete({ where: { id: req.params.id as string } });
    res.json({ message: 'Deleted' });
  } catch (error) {
    console.error('Delete hospital error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}


