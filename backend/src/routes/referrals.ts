import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateUser as authenticate } from '../middleware/authenticate';

const router = Router();
const prisma = new PrismaClient();
router.use(authenticate);

router.get('/', async (req: any, res) => {
  try {
    const referrals = await prisma.referral.findMany({
      where: { patient_id: req.user.userId },
      orderBy: { created_at: 'desc' },
      include: { fromFacility: true, toFacility: true }
    });
    res.json({ success: true, data: referrals });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to fetch referrals' } });
  }
});

export default router;
