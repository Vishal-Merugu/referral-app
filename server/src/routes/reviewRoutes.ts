import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import prisma from '../utils/prisma';
import type { AuthRequest } from '../global';
import { Response, Request } from 'express';

const router = Router();

router.post(
  '/',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.userId!;
    const { appointmentId, revieweeId, rating, comment } = req.body;
    if (!appointmentId || !revieweeId || !rating)
      return res.status(400).json({ error: 'Missing fields' });
    if (rating < 1 || rating > 5)
      return res.status(400).json({ error: 'Rating must be 1-5' });

    const appt = await prisma.appointment.findUnique({
      where: { id: appointmentId },
    });
    if (!appt || appt.seekerId !== userId || appt.status !== 'COMPLETED') {
      return res
        .status(403)
        .json({ error: 'Can only review completed appointments' });
    }

    const review = await prisma.review.create({
      data: {
        reviewerId: userId,
        revieweeId,
        appointmentId,
        rating: Number(rating),
        comment: comment || null,
      },
    });

    await prisma.notification.create({
      data: {
        userId: revieweeId,
        type: 'NEW_REVIEW',
        title: 'New review received',
        body: `You got a ${rating}★ review!`,
        link: '/dashboard/profile',
      },
    });

    res.status(201).json(review);
  }),
);

router.get(
  '/user/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const reviews = await prisma.review.findMany({
      where: { revieweeId: req.params.id },
      include: {
        reviewer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    const avg = reviews.length
      ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
      : 0;
    res.json({
      reviews,
      avgRating: parseFloat(avg.toFixed(1)),
      total: reviews.length,
    });
  }),
);

export default router;
