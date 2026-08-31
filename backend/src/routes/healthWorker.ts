import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateUser as authenticate } from '../middleware/authenticate';

const router = Router();
const prisma = new PrismaClient();
router.use(authenticate);

router.get('/dashboard', async (req: any, res) => {
  try {
    const worker = await prisma.healthcareWorker.findUnique({
      where: { user_id: req.user.userId },
      include: { facility: true }
    });
    if (!worker) {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Not a healthcare worker' } });
    }

    const facilityId = worker.facility_id;
    const today = new Date();
    today.setHours(0,0,0,0);

    const appointments = await prisma.appointment.count({ where: { facility_id: facilityId, appointment_date: { gte: today } } });
    const referrals = await prisma.referral.count({ where: { to_facility_id: facilityId, status: 'created' } });
    
    res.json({ success: true, data: { worker, stats: { appointments, referrals } } });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to fetch worker dashboard' } });
  }
});

export default router;
