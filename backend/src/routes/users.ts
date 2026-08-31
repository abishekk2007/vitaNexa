import { Router } from 'express';
import { listUsers, getUser, updateUser, deleteUser, updateUserRole, updateUserStatus } from '../controllers/users';
import { authenticateUser } from '../middleware/authenticate';
import { authorizeAdmin } from '../middleware/authorize';

const router = Router();
router.use(authenticateUser, authorizeAdmin);

router.get('/', listUsers);
router.get('/:id', getUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);
router.put('/:id/role', updateUserRole);
router.put('/:id/status', updateUserStatus);

export default router;
