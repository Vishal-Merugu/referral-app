import { Router } from 'express';
import * as authController from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.post('/signup', asyncHandler(authController.signup));
router.post('/login', asyncHandler(authController.login));
router.get('/profile', authenticate, asyncHandler(authController.getProfile));
router.patch(
  '/profile',
  authenticate,
  asyncHandler(authController.updateProfile),
);
router.delete(
  '/account',
  authenticate,
  asyncHandler(authController.deleteAccount),
);
router.post(
  '/reset-password',
  asyncHandler(authController.requestPasswordReset),
);

export default router;
