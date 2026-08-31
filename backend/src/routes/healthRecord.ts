import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateUser as authenticate } from '../middleware/authenticate';

const router = Router();
const prisma = new PrismaClient();
router.use(authenticate);

router.get('/', async (req: any, res) => {
  try {
    const records = await prisma.healthRecord.findMany({
      where: { patient_id: req.user.userId },
      orderBy: { record_date: 'desc' },
      include: { facility: true }
    });
    res.json({ success: true, data: records });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to fetch health records' } });
  }
});

export default router;
