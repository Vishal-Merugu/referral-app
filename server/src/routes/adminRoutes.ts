import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import * as adminController from '../controllers/adminController';
import type { AuthRequest } from '../global';
import { Response } from 'express';

const router = Router();

const requireAdmin = (req: AuthRequest, res: Response, next: () => void) => {
  if (req.userRole !== 'ADMIN')
    return res.status(403).json({ error: 'Admin only' });
  next();
};

router.use(authenticate, requireAdmin as import('express').RequestHandler);

router.get('/stats', asyncHandler(adminController.getStats));
router.get('/users', asyncHandler(adminController.getUsers));
router.patch('/users/:id/ban', asyncHandler(adminController.banUser));
router.patch('/users/:id/unban', asyncHandler(adminController.unbanUser));

router.get('/referrals', asyncHandler(adminController.getReferrals));
router.patch(
  '/referrals/:id/close',
  asyncHandler(adminController.closeReferral),
);

export default router;
