import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateUser as authenticate } from '../middleware/authenticate';
import { analyzeSymptoms } from '../services/aiTriageService';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();
router.use(authenticate);

const triageSchema = z.object({
  symptoms: z.string().min(5),
  symptom_duration: z.string().optional(),
  age: z.number().optional(),
  gender: z.string().optional()
});

router.post('/', async (req: any, res) => {
  try {
    const parsed = triageSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid request', details: parsed.error.errors } });
    }

    const { symptoms, symptom_duration, age, gender } = parsed.data;

    const triageResult = await analyzeSymptoms({
      symptoms,
      duration: symptom_duration,
      age,
      gender
    });

    const triageRecord = await prisma.digitalTriage.create({
      data: {
        patient_id: req.user.userId,
        symptoms,
        symptom_duration: symptom_duration || 'Not specified',
        severity: triageResult.severity,
        risk_level: triageResult.emergency ? 'EMERGENCY' : triageResult.severity,
        recommended_action: triageResult.recommendation,
      }
    });

    res.json({ success: true, data: { triage: triageRecord, aiResult: triageResult } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to process triage' } });
  }
});

router.get('/history', async (req: any, res) => {
  try {
    const history = await prisma.digitalTriage.findMany({
      where: { patient_id: req.user.userId },
      orderBy: { created_at: 'desc' },
      take: 20
    });
    res.json({ success: true, data: history });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to fetch triage history' } });
  }
});

router.get('/:id', async (req: any, res) => {
  try {
    const triage = await prisma.digitalTriage.findUnique({
      where: { id: req.params.id }
    });
    if (!triage || triage.patient_id !== req.user.userId) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Triage record not found' } });
    }
    res.json({ success: true, data: triage });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to fetch triage record' } });
  }
});

export default router;
