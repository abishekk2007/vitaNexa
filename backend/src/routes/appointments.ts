import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateUser as authenticate } from '../middleware/authenticate';

const router = Router();
const prisma = new PrismaClient();
router.use(authenticate);

router.get('/', async (req: any, res) => {
  try {
    const appointments = await prisma.appointment.findMany({
      where: { patient_id: req.user.userId },
      orderBy: { appointment_date: 'desc' },
      include: { facility: true, doctor: true }
    });
    res.json({ success: true, data: appointments });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to fetch appointments' } });
  }
});

router.post('/', async (req: any, res) => {
  try {
    const { facility_id, appointment_date, appointment_time, appointment_type, reason } = req.body;
    const appointment = await prisma.appointment.create({
      data: {
        patient_id: req.user.userId,
        facility_id,
        appointment_date: new Date(appointment_date),
        appointment_time,
        appointment_type,
        reason,
        status: 'booked'
      }
    });
    res.json({ success: true, data: appointment });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to create appointment' } });
  }
});

export default router;
