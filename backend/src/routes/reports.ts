import { Router } from 'express';
import { generateReport } from '../controllers/reports';
import { authenticateUser } from '../middleware/authenticate';

const router = Router();

router.post('/generate', authenticateUser, generateReport);

export default router;
