import { Request, Response } from 'express';
import type { AuthRequest } from '../global';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma';
import { UserRole } from '@prisma/client';
import { validateSignup } from '../utils/validation';

const profileSelect = {
  id: true,
  email: true,
  role: true,
  firstName: true,
  lastName: true,
  headline: true,
  bio: true,
  avatarUrl: true,
  skills: true,
  githubUrl: true,
  linkedinUrl: true,
  portfolioUrl: true,
  resumeUrl: true,
  workEmail: true,
  isVerified: true,
  isBanned: true,
  companyId: true,
  createdAt: true,
  updatedAt: true,
  company: { select: { id: true, name: true, logoUrl: true, domain: true } },
  reviewsReceived: {
    select: {
      rating: true,
      comment: true,
      createdAt: true,
      reviewer: {
        select: { id: true, firstName: true, lastName: true, avatarUrl: true },
      },
    },
  },
  referralPosts: {
    where: { status: 'ACTIVE' },
    select: {
      id: true,
      jobRole: true,
      experienceLevel: true,
      remoteType: true,
    },
  },
} as const;

export const signup = async (req: Request, res: Response) => {
  const validation = validateSignup(req.body);
  if (validation) return res.status(400).json({ error: validation.error });

  const email = String(req.body.email).trim().toLowerCase();
  const password = String(req.body.password);
  const firstName = String(req.body.firstName).trim();
  const lastName = String(req.body.lastName).trim();
  const role =
    req.body.role === 'EMPLOYEE' ? UserRole.EMPLOYEE : UserRole.SEEKER;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(400).json({ error: 'User already exists' });

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email, passwordHash: hashedPassword, firstName, lastName, role },
    select: profileSelect,
  });

  const token = jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_SECRET!,
    { expiresIn: '7d' },
  );
  res.status(201).json({ user, token });
};

export const login = async (req: Request, res: Response) => {
  const email = req.body.email?.trim?.()?.toLowerCase?.();
  const password = req.body.password;
  if (!email || !password)
    return res.status(400).json({ error: 'Email and password are required' });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.passwordHash)
    return res.status(401).json({ error: 'Invalid credentials' });
  if (user.isBanned)
    return res.status(403).json({ error: 'Your account has been suspended.' });

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

  const token = jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_SECRET!,
    { expiresIn: '7d' },
  );
  const safeUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: profileSelect,
  });
  res.json({ user: safeUser, token });
};

export const getProfile = async (req: AuthRequest, res: Response) => {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: profileSelect,
  });
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
};

export const getPublicProfile = async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      headline: true,
      bio: true,
      avatarUrl: true,
      skills: true,
      githubUrl: true,
      linkedinUrl: true,
      portfolioUrl: true,
      isVerified: true,
      role: true,
      company: { select: { id: true, name: true, logoUrl: true } },
      referralPosts: {
        where: { status: 'ACTIVE' },
        select: {
          id: true,
          jobRole: true,
          experienceLevel: true,
          remoteType: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 6,
      },
      reviewsReceived: {
        select: {
          rating: true,
          comment: true,
          createdAt: true,
          reviewer: {
            select: { firstName: true, lastName: true, avatarUrl: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
      createdAt: true,
    },
  });
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const {
    firstName,
    lastName,
    headline,
    bio,
    companyId,
    avatarUrl,
    skills,
    githubUrl,
    linkedinUrl,
    portfolioUrl,
    resumeUrl,
  } = req.body;

  const data: Record<string, unknown> = {};
  if (firstName !== undefined) data.firstName = firstName;
  if (lastName !== undefined) data.lastName = lastName;
  if (headline !== undefined) data.headline = headline;
  if (bio !== undefined) data.bio = bio;
  if (companyId !== undefined) data.companyId = companyId || null;
  if (avatarUrl !== undefined) data.avatarUrl = avatarUrl || null;
  if (skills !== undefined)
    data.skills = Array.isArray(skills) ? skills.map(String) : [];
  if (githubUrl !== undefined) data.githubUrl = githubUrl || null;
  if (linkedinUrl !== undefined) data.linkedinUrl = linkedinUrl || null;
  if (portfolioUrl !== undefined) data.portfolioUrl = portfolioUrl || null;
  if (resumeUrl !== undefined) data.resumeUrl = resumeUrl || null;

  const user = await prisma.user.update({
    where: { id: userId },
    data,
    select: profileSelect,
  });
  res.json(user);
};

export const deleteAccount = async (req: AuthRequest, res: Response) => {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { referralPosts: true },
  });
  if (!user) return res.status(404).json({ error: 'Not found' });

  const postIds = user.referralPosts.map((p) => p.id);

  await prisma.$transaction([
    prisma.message.deleteMany({
      where: { OR: [{ senderId: userId }, { receiverId: userId }] },
    }),
    prisma.notification.deleteMany({ where: { userId } }),
    prisma.savedReferral.deleteMany({ where: { userId } }),
    prisma.availabilitySlot.deleteMany({ where: { userId } }),
    prisma.review.deleteMany({
      where: { OR: [{ reviewerId: userId }, { revieweeId: userId }] },
    }),
    prisma.appointment.deleteMany({
      where: {
        OR: [{ seekerId: userId }, { referralPostId: { in: postIds } }],
      },
    }),
    prisma.referralPost.deleteMany({ where: { employeeId: userId } }),
    prisma.resource.deleteMany({ where: { authorId: userId } }),
    prisma.user.delete({ where: { id: userId } }),
  ]);

  res.json({ success: true, message: 'Account deleted successfully' });
};

export const requestPasswordReset = async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });
  // Dummy implementation
  res.json({
    success: true,
    message: 'If that email exists, a reset link has been sent.',
  });
};
