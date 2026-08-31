import { Router } from 'express';
import { registerDonor, getMyDonorStatus, getDonors, createBloodRequest, getBloodRequests, updateBloodRequest, matchDonors } from '../controllers/blood';
import { authenticateUser } from '../middleware/authenticate';
import { authorizeAdmin } from '../middleware/authorize';
import { validate } from '../middleware/validate';
import { bloodDonorSchema, bloodRequestSchema } from '../validations/modules';

const router = Router();
router.use(authenticateUser);

router.post('/donors', validate(bloodDonorSchema), registerDonor);
router.get('/donors/me', getMyDonorStatus);
router.get('/donors', getDonors);

router.post('/requests', validate(bloodRequestSchema), createBloodRequest);
router.get('/requests', getBloodRequests);
router.put('/requests/:id', authorizeAdmin, updateBloodRequest);

router.get('/match', matchDonors);

export default router;
