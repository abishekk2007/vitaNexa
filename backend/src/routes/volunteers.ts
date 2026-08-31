import { Router } from 'express';
import { registerVolunteer, getMyVolunteerStatus, getVerifiedVolunteers, getAllVolunteers, approveVolunteer, rejectVolunteer } from '../controllers/volunteers';
import { authenticateUser } from '../middleware/authenticate';
import { authorizeAdmin } from '../middleware/authorize';
import { upload } from '../middleware/upload';

const router = Router();
router.use(authenticateUser);

router.post('/register', upload.single('idProof'), registerVolunteer);
router.get('/me', getMyVolunteerStatus);
router.get('/verified', getVerifiedVolunteers);
router.get('/all', authorizeAdmin, getAllVolunteers);
router.put('/:id/approve', authorizeAdmin, approveVolunteer);
router.put('/:id/reject', authorizeAdmin, rejectVolunteer);

export default router;
