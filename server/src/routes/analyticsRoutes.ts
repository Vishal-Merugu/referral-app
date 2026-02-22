import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import * as analyticsController from '../controllers/analyticsController';

const router = Router();

router.get(
  '/my-referrals',
  authenticate,
  asyncHandler(analyticsController.getMyReferralsAnalytics),
);

export default router;
