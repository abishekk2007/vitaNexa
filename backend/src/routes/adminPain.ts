import { Router } from 'express';
import {
  getAllPainAssessments,
  getPainAssessmentById,
  updatePainAssessment,
  deletePainAssessment,
  getPainAssessmentStats,
} from '../controllers/adminPain';
import { authenticateUser } from '../middleware/authenticate';
import { authorizeAdmin } from '../middleware/authorize';

const router = Router();
router.use(authenticateUser, authorizeAdmin);

router.get('/stats', getPainAssessmentStats);
router.get('/', getAllPainAssessments);
router.get('/:id', getPainAssessmentById);
router.put('/:id', updatePainAssessment);
router.delete('/:id', deletePainAssessment);

export default router;
