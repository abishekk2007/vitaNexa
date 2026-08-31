import { PrismaClient } from '@prisma/client';
import { calculateDistance } from './locationService';

const prisma = new PrismaClient();

export interface NearHospital {
  id: string;
  name: string;
  type: string;
  phone: string;
  address: string;
  latitude: number;
  longitude: number;
  distance: number;
}

export async function findNearestHospitals(lat: number, lng: number, limit: number = 5): Promise<NearHospital[]> {
  const hospitals = await prisma.hospital.findMany({
    where: { type: { not: 'CLOSED' } },
  });
  const withDistance = hospitals
    .map(h => ({ ...h, distance: calculateDistance(lat, lng, h.latitude, h.longitude) }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit);
  return withDistance;
}
