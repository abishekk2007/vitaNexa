import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateUser as authenticate } from '../middleware/authenticate';

const router = Router();
const prisma = new PrismaClient();
router.use(authenticate);

router.get('/:facilityId', async (req: any, res) => {
  try {
    const queues = await prisma.queue.findMany({
      where: { facility_id: req.params.facilityId },
      include: { entries: { where: { status: 'waiting' } } }
    });
    res.json({ success: true, data: queues });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to fetch queue' } });
  }
});

export default router;
