import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateUser as authenticate } from '../middleware/authenticate';

const router = Router();
const prisma = new PrismaClient();
router.use(authenticate);

router.get('/', async (req: any, res) => {
  try {
    const followUps = await prisma.followUp.findMany({
      where: { highRiskPatient: { patient_id: req.user.userId } },
      orderBy: { scheduled_date: 'asc' },
      include: { highRiskPatient: true, assignedWorker: true }
    });
    res.json({ success: true, data: followUps });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to fetch follow-ups' } });
  }
});

export default router;
