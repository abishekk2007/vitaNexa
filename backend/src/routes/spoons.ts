import { Router } from 'express';
import { setBudget, getBudget, logActivity, logRecovery, deleteActivity, deleteRecovery, getPresets, createPreset, deletePreset, getHistory, detectPatterns, resetDay } from '../controllers/spoons';
import { authenticateUser } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import { spoonBudgetSchema, activitySchema, recoverySchema, activityPresetSchema } from '../validations/modules';

const router = Router();
router.use(authenticateUser);

router.post('/budget', validate(spoonBudgetSchema), setBudget);
router.get('/budget', getBudget);

router.post('/activities', validate(activitySchema), logActivity);
router.delete('/activities/:id', deleteActivity);

router.post('/recoveries', validate(recoverySchema), logRecovery);
router.delete('/recoveries/:id', deleteRecovery);

router.get('/presets', getPresets);
router.post('/presets', validate(activityPresetSchema), createPreset);
router.delete('/presets/:id', deletePreset);

router.get('/history', getHistory);
router.get('/patterns', detectPatterns);
router.post('/reset-day', resetDay);

export default router;
