import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateUser as authenticate } from '../middleware/authenticate';

const router = Router();
const prisma = new PrismaClient();
router.use(authenticate);

function getHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

router.get('/facilities', async (req, res) => {
  try {
    const facilities = await prisma.publicHealthcareFacility.findMany();
    res.json({ success: true, data: facilities });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to fetch facilities' } });
  }
});

router.get('/facilities/nearby', async (req, res) => {
  try {
    const lat = parseFloat(req.query.latitude as string);
    const lon = parseFloat(req.query.longitude as string);

    if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid coordinates' } });
    }

    const facilities = await prisma.publicHealthcareFacility.findMany({
      where: { latitude: { not: null }, longitude: { not: null } }
    });

    const withDistance = facilities.map((f: any) => ({
      ...f,
      distance_km: getHaversineDistance(lat, lon, f.latitude, f.longitude)
    })).sort((a: any, b: any) => a.distance_km - b.distance_km);

    res.json({ success: true, data: withDistance });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to fetch nearby facilities' } });
  }
});

router.get('/facilities/:id', async (req, res) => {
  try {
    const facility = await prisma.publicHealthcareFacility.findUnique({
      where: { id: req.params.id },
      include: { facilityServices: true }
    });
    if (!facility) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Facility not found' } });
    res.json({ success: true, data: facility });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to fetch facility' } });
  }
});

export default router;
