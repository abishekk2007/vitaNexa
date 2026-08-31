import { Router } from 'express';
import { createBacteriaResult, getBacteriaResults, deleteBacteriaResult, getRecommendations } from '../controllers/bacteria';
import { authenticateUser } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import { bacteriaResultSchema } from '../validations/modules';

const router = Router();
router.use(authenticateUser);

router.post('/', validate(bacteriaResultSchema), createBacteriaResult);
router.get('/', getBacteriaResults);
router.get('/recommendations', getRecommendations);
router.delete('/:id', deleteBacteriaResult);

export default router;
