import { Response } from 'express';
import prisma from '../utils/prisma';
import type { AuthRequest } from '../global';

export const getMyReferralsAnalytics = async (
  req: AuthRequest,
  res: Response,
) => {
  const userId = req.userId!;
  const posts = await prisma.referralPost.findMany({
    where: { employeeId: userId },
    include: {
      appointments: { select: { id: true, status: true, createdAt: true } },
      savedBy: { select: { id: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const data = posts.map((p) => ({
    id: p.id,
    jobRole: p.jobRole,
    status: p.status,
    remoteType: p.remoteType,
    viewCount: p.viewCount,
    bookmarkCount: p.savedBy.length,
    appointmentCount: p.appointments.length,
    byStatus: {
      PENDING: p.appointments.filter((a) => a.status === 'PENDING').length,
      CONFIRMED: p.appointments.filter((a) => a.status === 'CONFIRMED').length,
      COMPLETED: p.appointments.filter((a) => a.status === 'COMPLETED').length,
      CANCELLED: p.appointments.filter((a) => a.status === 'CANCELLED').length,
    },
    conversionRate:
      p.appointments.length > 0
        ? Math.round(
            (p.appointments.filter((a) => a.status === 'COMPLETED').length /
              p.appointments.length) *
              100,
          )
        : 0,
    createdAt: p.createdAt,
  }));

  const totals = {
    posts: data.length,
    views: data.reduce((s, d) => s + d.viewCount, 0),
    bookmarks: data.reduce((s, d) => s + d.bookmarkCount, 0),
    appointments: data.reduce((s, d) => s + d.appointmentCount, 0),
    completed: data.reduce((s, d) => s + d.byStatus.COMPLETED, 0),
  };

  res.json({ posts: data, totals });
};
