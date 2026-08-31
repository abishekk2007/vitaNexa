import { Router } from 'express';
import { createHospital, getHospitals, getNearbyHospitals, updateHospital, deleteHospital } from '../controllers/hospitals';
import { authenticateUser } from '../middleware/authenticate';
import { authorizeAdmin } from '../middleware/authorize';
import { validate } from '../middleware/validate';
import { hospitalSchema } from '../validations/modules';

const router = Router();
router.use(authenticateUser);

router.get('/', getHospitals);
router.get('/nearby', getNearbyHospitals);
router.post('/', authorizeAdmin, validate(hospitalSchema), createHospital);
router.put('/:id', authorizeAdmin, updateHospital);
router.delete('/:id', authorizeAdmin, deleteHospital);

export default router;
