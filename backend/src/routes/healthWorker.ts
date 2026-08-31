import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateUser as authenticate } from '../middleware/authenticate';
import { requireHealthWorker } from '../middleware/rbac';

const router = Router();
const prisma = new PrismaClient();
router.use(authenticate);
router.use(requireHealthWorker);

router.get('/dashboard', async (req: any, res) => {
  try {
    const worker = req.healthWorker;
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
