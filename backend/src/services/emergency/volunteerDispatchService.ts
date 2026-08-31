import { PrismaClient } from '@prisma/client';
import { calculateDistance } from './locationService';

const prisma = new PrismaClient();

export interface NearVolunteer {
  id: string;
  name: string;
  phone: string;
  latitude: number;
  longitude: number;
  distance: number;
}

export async function findNearestVolunteers(lat: number, lng: number, limit: number = 3): Promise<NearVolunteer[]> {
  const volunteers = await prisma.volunteerDriver.findMany({
    where: { status: 'VERIFIED', latitude: { not: null }, longitude: { not: null } },
  });
  const withDistance = (volunteers as Array<typeof volunteers[0] & { latitude: number; longitude: number }>)
    .map(v => ({ ...v, distance: calculateDistance(lat, lng, v.latitude, v.longitude) }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit);
  return withDistance;
}
