import { Response } from 'express';
import prisma from '../utils/prisma';
import type { AuthRequest } from '../global';

export const getThread = async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const partnerId = req.params.partnerId as string;
  const msgs = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: userId, receiverId: partnerId },
        { senderId: partnerId, receiverId: userId },
      ],
    },
    include: {
      sender: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  });
  // mark as read
  await prisma.message.updateMany({
    where: { senderId: partnerId, receiverId: userId, readAt: null },
    data: { readAt: new Date() },
  });
  res.json(msgs);
};

export const sendMessage = async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const { receiverId, content, appointmentId } = req.body;
  const msg = await prisma.message.create({
    data: {
      senderId: userId,
      receiverId,
      content,
      appointmentId: appointmentId || null,
    },
    include: {
      sender: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
        },
      },
    },
  });
  // create notification
  await prisma.notification.create({
    data: {
      userId: receiverId,
      type: 'NEW_MESSAGE',
      title: 'New message',
      body: content.slice(0, 100),
      link: `/dashboard/messages`,
    },
  });
  res.status(201).json(msg);
};

export const markRead = async (req: AuthRequest, res: Response) => {
  await prisma.message.updateMany({
    where: {
      senderId: req.params.senderId as string,
      receiverId: req.userId!,
      readAt: null,
    },
    data: { readAt: new Date() },
  });
  res.json({ success: true });
};

export const getUnreadCount = async (req: AuthRequest, res: Response) => {
  const count = await prisma.message.count({
    where: { receiverId: req.userId!, readAt: null },
  });
  res.json({ count });
};

export const getConversations = async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const msgs = await prisma.message.findMany({
    where: { OR: [{ senderId: userId }, { receiverId: userId }] },
    include: {
      sender: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
        },
      },
      receiver: {
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
  // Group by partner
  const seen = new Set<string>();
  const conversations = msgs.filter((m) => {
    const partnerId = m.senderId === userId ? m.receiverId : m.senderId;
    if (seen.has(partnerId)) return false;
    seen.add(partnerId);
    return true;
  });
  res.json(conversations);
};
