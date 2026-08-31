import { Router } from 'express';
import { dashboard } from '../controllers/nutrients';
import { authenticateUser } from '../middleware/authenticate';

const router = Router();
router.use(authenticateUser);

router.get('/dashboard', dashboard);

export default router;
