import { Router } from 'express';
import { createFoodItem, getFoodItems, updateFoodItem, deleteFoodItem, createFoodLog, getFoodLogs, deleteFoodLog } from '../controllers/food';
import { authenticateUser } from '../middleware/authenticate';
import { authorizeAdmin } from '../middleware/authorize';
import { validate } from '../middleware/validate';
import { foodDatabaseSchema, foodLogSchema } from '../validations/modules';

const router = Router();
router.use(authenticateUser);

router.get('/database', getFoodItems);
router.get('/database/:id', getFoodItems);
router.post('/database', authorizeAdmin, validate(foodDatabaseSchema), createFoodItem);
router.put('/database/:id', authorizeAdmin, updateFoodItem);
router.delete('/database/:id', authorizeAdmin, deleteFoodItem);

router.post('/logs', validate(foodLogSchema), createFoodLog);
router.get('/logs', getFoodLogs);
router.delete('/logs/:id', deleteFoodLog);

export default router;
