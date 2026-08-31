import { Router } from 'express';
import { authenticateUser } from '../middleware/authenticate';
import { authorizeAdmin } from '../middleware/authorize';
import {
  getSpecies, createSpecies, updateSpecies, deleteSpecies,
  getFoods, createFood, updateFood, deleteFood,
  getEffects, createEffect, updateEffect, deleteEffect,
  reviewEffect, getPendingReviewEffects, getLowConfidenceEffects,
  getRules, createRule, updateRule, deleteRule,
  importJson, importCsv, importXlsx,
  exportEffects, exportCsv,
  getAnalytics,
  getUserRecommendations, getDietPlan, getHealthScore, generateReport, exportPdfReport,
  uploadReport, getReports, deleteReport, uploadReportFile,
} from '../controllers/microbiome';
import multer from 'multer';

const router = Router();
router.use(authenticateUser);

// Species (admin)
router.get('/species', authorizeAdmin, getSpecies);
router.post('/species', authorizeAdmin, createSpecies);
router.put('/species/:id', authorizeAdmin, updateSpecies);
router.delete('/species/:id', authorizeAdmin, deleteSpecies);

// Foods (admin)
router.get('/foods', authorizeAdmin, getFoods);
router.post('/foods', authorizeAdmin, createFood);
router.put('/foods/:id', authorizeAdmin, updateFood);
router.delete('/foods/:id', authorizeAdmin, deleteFood);

// Effects (admin)
router.get('/effects', authorizeAdmin, getEffects);
router.post('/effects', authorizeAdmin, createEffect);
router.put('/effects/:id', authorizeAdmin, updateEffect);
router.delete('/effects/:id', authorizeAdmin, deleteEffect);

// Review workflow (admin)
router.put('/effects/:id/review', authorizeAdmin, reviewEffect);
router.get('/review/pending', authorizeAdmin, getPendingReviewEffects);
router.get('/review/low-confidence', authorizeAdmin, getLowConfidenceEffects);

// Rules (admin)
router.get('/rules', authorizeAdmin, getRules);
router.post('/rules', authorizeAdmin, createRule);
router.put('/rules/:id', authorizeAdmin, updateRule);
router.delete('/rules/:id', authorizeAdmin, deleteRule);

// Import/Export (admin)
const uploadMemory = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
router.post('/import/json', authorizeAdmin, importJson);
router.post('/import/csv', authorizeAdmin, uploadMemory.single('file'), importCsv);
router.post('/import/xlsx', authorizeAdmin, uploadMemory.single('file'), importXlsx);
router.get('/export/effects', authorizeAdmin, exportEffects);
router.get('/export/csv', authorizeAdmin, exportCsv);

// Reports (admin)
router.post('/reports/upload', authorizeAdmin, uploadReportFile, uploadReport);
router.get('/reports', authorizeAdmin, getReports);
router.delete('/reports/:id', authorizeAdmin, deleteReport);

// Analytics (admin)
router.get('/analytics', authorizeAdmin, getAnalytics);

// User routes
router.get('/recommendations', getUserRecommendations);
router.get('/diet-plan', getDietPlan);
router.get('/health-score', getHealthScore);
router.get('/report', generateReport);
router.get('/export/pdf', exportPdfReport);

export default router;
