import { Response } from 'express';
import prisma from '../utils/prisma';
import { AppointmentStatus } from '@prisma/client';
import type { AuthRequest } from '../global';

export const createAppointment = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const referralPostId =
      typeof req.body.referralPostId === 'string'
        ? req.body.referralPostId
        : undefined;
    const message =
      typeof req.body.message === 'string' ? req.body.message : undefined;
    const scheduledAt = req.body.scheduledAt;

    if (!referralPostId)
      return res.status(400).json({ error: 'referralPostId is required' });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== 'SEEKER') {
      return res
        .status(403)
        .json({ error: 'Only job seekers can book appointments' });
    }

    const existing = await prisma.appointment.findFirst({
      where: {
        seekerId: userId,
        referralPostId,
        NOT: { status: AppointmentStatus.CANCELLED },
      },
    });
    if (existing) {
      return res
        .status(400)
        .json({ error: 'You already have an appointment for this referral' });
    }

    const referralPost = await prisma.referralPost.findUnique({
      where: { id: referralPostId },
    });
    if (!referralPost || referralPost.status !== 'ACTIVE') {
      return res.status(400).json({ error: 'Referral not available' });
    }

    let finalMessage = message ?? null;
    if (scheduledAt) {
      const meetId = `${Math.random().toString(36).substring(2, 5)}-${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 5)}`;
      const meetLink = `Meeting Link: https://meet.google.com/${meetId}`;
      finalMessage = finalMessage ? `${finalMessage}\n\n${meetLink}` : meetLink;
    }

    const appointment = await prisma.appointment.create({
      data: {
        seekerId: userId,
        referralPostId,
        message: finalMessage,
        scheduledAt: scheduledAt ? new Date(scheduledAt as string) : null,
        status: AppointmentStatus.PENDING,
      },
    });

    res.status(201).json(appointment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create appointment' });
  }
};

export const getMyAppointments = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const appointments = await prisma.appointment.findMany({
      where: { seekerId: userId },
      include: {
        referralPost: {
          include: {
            employee: {
              select: {
                firstName: true,
                lastName: true,
                company: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(appointments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
};

export const updateAppointmentStatus = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const userId = req.userId;
    const userRole = req.userRole;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const id =
      typeof req.params.id === 'string' ? req.params.id : req.params.id?.[0];
    if (!id) return res.status(400).json({ error: 'Invalid appointment id' });
    const status = req.body?.status as AppointmentStatus | undefined;

    const allowed = [
      AppointmentStatus.PENDING,
      AppointmentStatus.CONFIRMED,
      AppointmentStatus.COMPLETED,
      AppointmentStatus.CANCELLED,
    ];
    if (!status || !allowed.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: { referralPost: true },
    });
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    const referralPost = appointment.referralPost;
    const isSeeker = appointment.seekerId === userId;
    const isEmployee = referralPost.employeeId === userId;
    if (!isSeeker && !isEmployee) {
      return res
        .status(403)
        .json({ error: 'Not allowed to update this appointment' });
    }

    if (isSeeker && userRole !== 'SEEKER') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    if (isEmployee && userRole !== 'EMPLOYEE') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (isSeeker && status !== AppointmentStatus.CANCELLED) {
      return res
        .status(403)
        .json({ error: 'Seekers can only cancel appointments' });
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: { status },
      include: {
        referralPost: {
          include: {
            employee: {
              select: {
                firstName: true,
                lastName: true,
                company: true,
              },
            },
          },
        },
      },
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update appointment' });
  }
};
