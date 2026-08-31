import { Router } from 'express';
import {
  createSupplement, getSupplements, updateSupplement, deleteSupplement,
  checkInteractions, getInteractions, createInteraction, deleteInteraction,
  getDetailedAnalysis, getCoachExplanationHandler, scanProduct, getMealHistoryAnalytics
} from '../controllers/supplements';
import { authenticateUser } from '../middleware/authenticate';
import { authorizeAdmin } from '../middleware/authorize';
import { validate } from '../middleware/validate';
import { supplementSchema, supplementInteractionSchema } from '../validations/modules';

const router = Router();
router.use(authenticateUser);

router.post('/', validate(supplementSchema), createSupplement);
router.get('/', getSupplements);

router.get('/detailed-analysis', getDetailedAnalysis);
router.get('/coach', getCoachExplanationHandler);
router.get('/meal-analytics', getMealHistoryAnalytics);

router.get('/interactions/check', checkInteractions);
router.get('/interactions/all', getInteractions);
router.post('/interactions', authorizeAdmin, validate(supplementInteractionSchema), createInteraction);
router.delete('/interactions/:id', authorizeAdmin, deleteInteraction);

router.post('/scan', scanProduct);

router.put('/:id', updateSupplement);
router.delete('/:id', deleteSupplement);

export default router;
