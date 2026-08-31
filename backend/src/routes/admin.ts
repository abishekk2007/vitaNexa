import { Router } from 'express';
import { getDashboardStats, getSignupsOverTime, getActiveUsersChart, getSystemAnalytics, getRecentActivity, getNutrientAnalytics } from '../controllers/admin';
import { authenticateUser } from '../middleware/authenticate';
import { authorizeAdmin } from '../middleware/authorize';

const router = Router();
router.use(authenticateUser, authorizeAdmin);

router.get('/dashboard', getDashboardStats);
router.get('/signups', getSignupsOverTime);
router.get('/active-users', getActiveUsersChart);
router.get('/analytics', getSystemAnalytics);
router.get('/activity', getRecentActivity);
router.get('/nutrient-analytics', getNutrientAnalytics);

export default router;
