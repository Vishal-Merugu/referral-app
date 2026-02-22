import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import * as messageController from '../controllers/messageController';

const router = Router();

router.get(
  '/unread-count',
  authenticate,
  asyncHandler(messageController.getUnreadCount),
);
router.get(
  '/:partnerId',
  authenticate,
  asyncHandler(messageController.getThread),
);
router.post('/', authenticate, asyncHandler(messageController.sendMessage));
router.patch(
  '/read/:senderId',
  authenticate,
  asyncHandler(messageController.markRead),
);
router.get('/', authenticate, asyncHandler(messageController.getConversations));

export default router;
