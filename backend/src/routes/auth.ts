import { Router } from 'express';
import { register, login, logout, forgotPassword, resetPassword, getProfile, updateProfile, refreshTokenHandler } from '../controllers/auth';
import { authenticateUser } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema, updateProfileSchema } from '../validations/auth';

const router = Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/logout', authenticateUser, logout);
router.post('/refresh', refreshTokenHandler);
router.post('/forgot-password', validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), resetPassword);
router.get('/me', authenticateUser, getProfile);
router.put('/profile', authenticateUser, validate(updateProfileSchema), updateProfile);

export default router;
