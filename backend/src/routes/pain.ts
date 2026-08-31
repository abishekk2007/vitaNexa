import { Router } from 'express';
import { createPainLog, getPainLogs, updatePainLog, deletePainLog, detectPatterns } from '../controllers/pain';
import { authenticateUser } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import { painLogSchema } from '../validations/modules';

const router = Router();
router.use(authenticateUser);

router.post('/', validate(painLogSchema), createPainLog);
router.get('/', getPainLogs);
router.get('/patterns', detectPatterns);
router.put('/:id', updatePainLog);
router.delete('/:id', deletePainLog);

export default router;
