import { Router } from 'express';
import {
  createPainAssessment,
  getMyPainAssessments,
  updateMyPainAssessment,
} from '../controllers/painAssessments';
import { authenticateUser } from '../middleware/authenticate';

const router = Router();
router.use(authenticateUser);

router.post('/', createPainAssessment);
router.get('/', getMyPainAssessments);
router.put('/:id', updateMyPainAssessment);

export default router;
