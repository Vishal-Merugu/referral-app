import { Response } from 'express';
import prisma from '../utils/prisma';
import type { AuthRequest } from '../global';

export const getStats = async (_req: AuthRequest, res: Response) => {
  const lastWeek = new Date(Date.now() - 7 * 86400000);
  const [users, referrals, appts, newUsersThisWeek] = await Promise.all([
    prisma.user.count(),
    prisma.referralPost.count({ where: { status: 'ACTIVE' } }),
    prisma.appointment.count({
      where: { createdAt: { gte: new Date(Date.now() - 86400000) } },
    }),
    prisma.user.count({ where: { createdAt: { gte: lastWeek } } }),
  ]);
  res.json({
    totalUsers: users,
    activeReferrals: referrals,
    appointmentsToday: appts,
    newUsersThisWeek,
  });
};

export const getUsers = async (req: AuthRequest, res: Response) => {
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
};

export const banUser = async (req: AuthRequest, res: Response) => {
  await prisma.user.update({
    where: { id: req.params.id as string },
    data: { isBanned: true },
  });
  res.json({ success: true });
};

export const unbanUser = async (req: AuthRequest, res: Response) => {
  await prisma.user.update({
    where: { id: req.params.id as string },
    data: { isBanned: false },
  });
  res.json({ success: true });
};

export const getReferrals = async (req: AuthRequest, res: Response) => {
  const { page = '1', search } = req.query as Record<string, string>;
  const skip = (parseInt(page) - 1) * 20;
  const where = search
    ? {
        OR: [{ jobRole: { contains: search, mode: 'insensitive' as const } }],
      }
    : {};

  const [referrals, total] = await Promise.all([
    prisma.referralPost.findMany({
      where,
      include: {
        employee: { select: { firstName: true, lastName: true, email: true } },
      },
      skip,
      take: 20,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.referralPost.count({ where }),
  ]);
  res.json({ referrals, total, pages: Math.ceil(total / 20) });
};

export const closeReferral = async (req: AuthRequest, res: Response) => {
  await prisma.referralPost.update({
    where: { id: req.params.id as string },
    data: { status: 'CLOSED' },
  });
  res.json({ success: true });
};
