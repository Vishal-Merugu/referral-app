import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import prisma from '../utils/prisma';
import type { AuthRequest } from '../global';
import { Response } from 'express';

const router = Router();

const requireAdmin = (req: AuthRequest, res: Response, next: () => void) => {
  if (req.userRole !== 'ADMIN')
    return res.status(403).json({ error: 'Admin only' });
  next();
};

router.use(authenticate, requireAdmin as import('express').RequestHandler);

router.get(
  '/stats',
  asyncHandler(async (_req, res: Response) => {
    const [users, referrals, appts] = await Promise.all([
      prisma.user.count(),
      prisma.referralPost.count({ where: { status: 'ACTIVE' } }),
      prisma.appointment.count({
        where: { createdAt: { gte: new Date(Date.now() - 86400000) } },
      }),
    ]);
    res.json({
      totalUsers: users,
      activeReferrals: referrals,
      appointmentsToday: appts,
    });
  }),
);

router.get(
  '/users',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { page = '1', search } = req.query as Record<string, string>;
    const skip = (parseInt(page) - 1) * 20;
    const where = search
      ? {
          OR: [
            { email: { contains: search, mode: 'insensitive' as const } },
            { firstName: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isBanned: true,
          isVerified: true,
          createdAt: true,
          company: { select: { name: true } },
        },
        skip,
        take: 20,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);
    res.json({ users, total, pages: Math.ceil(total / 20) });
  }),
);

router.patch(
  '/users/:id/ban',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    await prisma.user.update({
      where: { id: req.params.id },
      data: { isBanned: true },
    });
    res.json({ success: true });
  }),
);

router.patch(
  '/users/:id/unban',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    await prisma.user.update({
      where: { id: req.params.id },
      data: { isBanned: false },
    });
    res.json({ success: true });
  }),
);

export default router;
