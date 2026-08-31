import { Router } from 'express';
import { createMealLog, getMealLogs, updateMealLog, deleteMealLog } from '../controllers/meals';
import { authenticateUser } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import { mealLogSchema } from '../validations/modules';

const router = Router();
router.use(authenticateUser);

router.post('/', validate(mealLogSchema), createMealLog);
router.get('/', getMealLogs);
router.put('/:id', updateMealLog);
router.delete('/:id', deleteMealLog);

export default router;
