import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import * as notificationController from '../controllers/notificationController';

const router = Router();

router.get(
  '/',
  authenticate,
  asyncHandler(notificationController.getNotifications),
);
router.get(
  '/unread-count',
  authenticate,
  asyncHandler(notificationController.getUnreadCount),
);
router.patch(
  '/read-all',
  authenticate,
  asyncHandler(notificationController.markAllAsRead),
);
router.patch(
  '/:id/read',
  authenticate,
  asyncHandler(notificationController.markAsRead),
);

export default router;
