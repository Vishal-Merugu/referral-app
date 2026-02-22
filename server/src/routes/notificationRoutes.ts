import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import prisma from '../utils/prisma';
import type { AuthRequest } from '../global';
import { Response } from 'express';

const router = Router();

router.get(
  '/',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.userId! },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json(notifications);
  }),
);

router.get(
  '/unread-count',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const count = await prisma.notification.count({
      where: { userId: req.userId!, readAt: null },
    });
    res.json({ count });
  }),
);

router.patch(
  '/read-all',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    await prisma.notification.updateMany({
      where: { userId: req.userId!, readAt: null },
      data: { readAt: new Date() },
    });
    res.json({ success: true });
  }),
);

router.patch(
  '/:id/read',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    await prisma.notification.update({
      where: { id: req.params.id },
      data: { readAt: new Date() },
    });
    res.json({ success: true });
  }),
);

export default router;
