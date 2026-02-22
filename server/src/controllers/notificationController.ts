import { Response } from 'express';
import prisma from '../utils/prisma';
import type { AuthRequest } from '../global';

export const getNotifications = async (req: AuthRequest, res: Response) => {
  const notifications = await prisma.notification.findMany({
    where: { userId: req.userId! },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  res.json(notifications);
};

export const getUnreadCount = async (req: AuthRequest, res: Response) => {
  const count = await prisma.notification.count({
    where: { userId: req.userId!, readAt: null },
  });
  res.json({ count });
};

export const markAllAsRead = async (req: AuthRequest, res: Response) => {
  await prisma.notification.updateMany({
    where: { userId: req.userId!, readAt: null },
    data: { readAt: new Date() },
  });
  res.json({ success: true });
};

export const markAsRead = async (req: AuthRequest, res: Response) => {
  await prisma.notification.update({
    where: { id: req.params.id as string },
    data: { readAt: new Date() },
  });
  res.json({ success: true });
};
