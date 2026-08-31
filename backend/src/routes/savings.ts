import { Router } from 'express';
import { createSavingsEntry, getSavingsEntries, deleteSavingsEntry, createSavingsGoal, getSavingsGoals, updateSavingsGoal, deleteSavingsGoal } from '../controllers/savings';
import { authenticateUser } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import { savingsEntrySchema, savingsGoalSchema } from '../validations/modules';

const router = Router();
router.use(authenticateUser);

router.post('/entries', validate(savingsEntrySchema), createSavingsEntry);
router.get('/entries', getSavingsEntries);
router.delete('/entries/:id', deleteSavingsEntry);

router.post('/goals', validate(savingsGoalSchema), createSavingsGoal);
router.get('/goals', getSavingsGoals);
router.put('/goals/:id', updateSavingsGoal);
router.delete('/goals/:id', deleteSavingsGoal);

export default router;
