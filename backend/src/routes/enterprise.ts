import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authenticateUser } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import { auditLog } from '../middleware/auditLog';
import {
  parseMealSchema, analyzeAbsorptionSchema, analyticsQuerySchema,
  coachQuerySchema, generateReportSchema, exportDataSchema,
} from '../schemas/enterprise';
import {
  parseMealEndpoint, searchFoodsEndpoint, getFoodProfileEndpoint,
  analyzeAbsorptionEndpoint, getEnterpriseAnalytics, enterpriseCoach,
  generateEnterpriseReport, exportEntityData,
} from '../controllers/enterprise';

const router = Router();

const enterpriseLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  message: { error: 'Enterprise rate limit exceeded' },
});

router.use(enterpriseLimiter);

// Nutrition Engine V3
router.post('/parse-meal', authenticateUser, validate(parseMealSchema, 'body'), auditLog('parse-meal'), parseMealEndpoint);
router.get('/foods/search', authenticateUser, searchFoodsEndpoint);
router.get('/foods/:key', authenticateUser, getFoodProfileEndpoint);

// Absorption Engine
router.post('/analyze-absorption', authenticateUser, validate(analyzeAbsorptionSchema, 'body'), auditLog('analyze-absorption'), analyzeAbsorptionEndpoint);

// Analytics Engine
router.get('/analytics', authenticateUser, validate(analyticsQuerySchema, 'query'), auditLog('analytics'), getEnterpriseAnalytics);

// AI Coach V2
router.get('/coach', authenticateUser, validate(coachQuerySchema, 'query'), auditLog('coach'), enterpriseCoach);

// Smart Reporting
router.post('/reports/generate', authenticateUser, validate(generateReportSchema, 'body'), auditLog('report-generate'), generateEnterpriseReport);

// Export Center
router.post('/export', authenticateUser, validate(exportDataSchema, 'body'), auditLog('export'), exportEntityData);

export default router;
