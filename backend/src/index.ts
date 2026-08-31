import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import path from 'path';

console.log('JWT_SECRET loaded:', process.env.JWT_SECRET ? 'yes' : 'no');

import { PrismaClient } from '@prisma/client';
const startupPrisma = new PrismaClient();

import { MulterError } from 'multer';

import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import bacteriaRoutes from './routes/bacteria';
import foodRoutes from './routes/food';
import painRoutes from './routes/pain';
import supplementRoutes from './routes/supplements';
import mealRoutes from './routes/meals';
import spoonRoutes from './routes/spoons';
import hospitalRoutes from './routes/hospitals';
import volunteerRoutes from './routes/volunteers';
import bloodRoutes from './routes/blood';
import savingsRoutes from './routes/savings';
import notificationRoutes from './routes/notifications';
import adminRoutes from './routes/admin';
import adminPainRoutes from './routes/adminPain';
import painAssessmentRoutes from './routes/painAssessments';
import microbiomeRoutes from './routes/microbiome';
import nutrientRoutes from './routes/nutrients';
import reportRoutes from './routes/reports';
import enterpriseRoutes from './routes/enterprise';
import emergencyRoutes from './routes/emergency';

// SIH26133 Routes
import publicHealthRoutes from './routes/publicHealth';
import appointmentsRoutes from './routes/appointments';
import queueRoutes from './routes/queue';
import referralsRoutes from './routes/referrals';
import healthRecordRoutes from './routes/healthRecord';
import followUpsRoutes from './routes/followUps';
import healthWorkerRoutes from './routes/healthWorker';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

app.use(morgan('dev'));
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/bacteria', bacteriaRoutes);
app.use('/api/food', foodRoutes);
app.use('/api/pain', painRoutes);
app.use('/api/supplements', supplementRoutes);
app.use('/api/meals', mealRoutes);
app.use('/api/spoons', spoonRoutes);
app.use('/api/hospitals', hospitalRoutes);
app.use('/api/volunteers', volunteerRoutes);
app.use('/api/blood', bloodRoutes);
app.use('/api/savings', savingsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/pain-assessments', painAssessmentRoutes);
app.use('/api/admin/pain', adminPainRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/microbiome', microbiomeRoutes);
app.use('/api/nutrients', nutrientRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/enterprise', enterpriseRoutes);
app.use('/api/emergency', emergencyRoutes);

// SIH26133 Mounts
app.use('/api/public-health', publicHealthRoutes);
app.use('/api/appointments', appointmentsRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/referrals', referralsRoutes);
app.use('/api/health-record', healthRecordRoutes);
app.use('/api/follow-ups', followUpsRoutes);
app.use('/api/health-worker', healthWorkerRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
    if (err instanceof MulterError) {
    res.status(400).json({ error: err.message });
    return;
  }
  res.status(500).json({ error: 'Internal server error' });
});

async function startupValidation() {
  try {
    await startupPrisma.$connect();
    console.log('[Startup] Database connection: OK');

    const routeTable = [
      ['GET /api/microbiome/species', 'admin', '✓'],
      ['POST /api/microbiome/species', 'admin', '✓'],
      ['PUT /api/microbiome/species/:id', 'admin', '✓'],
      ['DELETE /api/microbiome/species/:id', 'admin', '✓'],
      ['GET /api/microbiome/foods', 'admin', '✓'],
      ['POST /api/microbiome/foods', 'admin', '✓'],
      ['PUT /api/microbiome/foods/:id', 'admin', '✓'],
      ['DELETE /api/microbiome/foods/:id', 'admin', '✓'],
      ['GET /api/microbiome/effects', 'admin', '✓'],
      ['POST /api/microbiome/effects', 'admin', '✓'],
      ['GET /api/microbiome/rules', 'admin', '✓'],
      ['POST /api/microbiome/rules', 'admin', '✓'],
      ['PUT /api/microbiome/rules/:id', 'admin', '✓'],
      ['DELETE /api/microbiome/rules/:id', 'admin', '✓'],
      ['GET /api/microbiome/review/pending', 'admin', '✓'],
      ['GET /api/microbiome/review/low-confidence', 'admin', '✓'],
      ['GET /api/microbiome/analytics', 'admin', '✓'],
      ['GET /api/microbiome/recommendations', 'user', '✓'],
      ['GET /api/microbiome/health-score', 'user', '✓'],
      ['GET /api/microbiome/diet-plan', 'user', '✓'],
      ['GET /api/microbiome/report', 'user', '✓'],
      ['POST /api/enterprise/parse-meal', 'user', '✓ (v3)'],
      ['GET /api/enterprise/foods/search', 'user', '✓ (v3)'],
      ['POST /api/enterprise/analyze-absorption', 'user', '✓ (v3)'],
      ['GET /api/enterprise/analytics', 'user', '✓ (v3)'],
      ['GET /api/enterprise/coach', 'user', '✓ (v3)'],
      ['POST /api/enterprise/reports/generate', 'user', '✓ (v3)'],
      ['POST /api/enterprise/export', 'user', '✓ (v3)'],
    ];

    for (const [route, access] of routeTable.map(r => [r[0], r[1]])) {
      console.log(`[Startup] Route: ${route} (${access})`);
    }

    const ruleCount = await startupPrisma.microbiomeRule.count();
    console.log(`[Startup] Rules count: ${ruleCount}`);

    const speciesCount = await startupPrisma.bacteriaSpecies.count();
    console.log(`[Startup] Species count: ${speciesCount}`);

    const effectCount = await startupPrisma.foodBacteriaEffect.count();
    console.log(`[Startup] Food-bacteria effects count: ${effectCount}`);
  } catch (error) {
    console.error('[Startup] Database connection FAILED:', error);
  } finally {
    await startupPrisma.$disconnect();
  }
}

app.listen(PORT, async () => {
  console.log(`VitaNexa AI backend running on port ${PORT}`);
  await startupValidation();
});

export default app;
