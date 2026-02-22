import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { ReferralStatus, RemoteType } from '@prisma/client';
import type { AuthRequest } from '../global';
import type { Prisma } from '@prisma/client';

const referralInclude = {
  employee: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      headline: true,
      avatarUrl: true,
      isVerified: true,
      company: {
        select: { id: true, name: true, logoUrl: true, domain: true },
      },
      reviewsReceived: {
        select: { rating: true },
      },
    },
  },
} satisfies Prisma.ReferralPostInclude;

export const createReferral = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const {
      jobRole,
      department,
      experienceLevel,
      description,
      referralPrice,
      skills,
      remoteType,
      salaryMin,
      salaryMax,
    } = req.body;

    if (!jobRole || !experienceLevel || !description) {
      return res.status(400).json({
        error: 'jobRole, experienceLevel and description are required',
      });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== 'EMPLOYEE') {
      return res
        .status(403)
        .json({ error: 'Only employees can post referrals' });
    }

    const referral = await prisma.referralPost.create({
      data: {
        employeeId: userId,
        jobRole: String(jobRole),
        department: department ? String(department) : undefined,
        experienceLevel: String(experienceLevel),
        description: String(description),
        referralPrice: Number(referralPrice) || 0,
        skills: Array.isArray(skills) ? skills.map(String) : [],
        remoteType: Object.values(RemoteType).includes(remoteType)
          ? remoteType
          : RemoteType.ONSITE,
        salaryMin: salaryMin ? Number(salaryMin) : null,
        salaryMax: salaryMax ? Number(salaryMax) : null,
        status: ReferralStatus.ACTIVE,
      },
      include: referralInclude,
    });

    res.status(201).json(referral);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create referral' });
  }
};

export const getReferrals = async (req: Request, res: Response) => {
  const search =
    typeof req.query.search === 'string' ? req.query.search.trim() : '';
  const companyId =
    typeof req.query.companyId === 'string' ? req.query.companyId : undefined;
  const experienceLevel =
    typeof req.query.experienceLevel === 'string'
      ? req.query.experienceLevel.trim()
      : undefined;
  const remoteType =
    typeof req.query.remoteType === 'string' ? req.query.remoteType : undefined;

  // Support multiple skills (comma separated or array)
  let skills: string[] = [];
  if (Array.isArray(req.query.skills)) {
    skills = req.query.skills.map(String);
  } else if (typeof req.query.skills === 'string' && req.query.skills) {
    skills = req.query.skills
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  } else if (typeof req.query.skill === 'string' && req.query.skill) {
    // legacy fallback
    skills = [req.query.skill];
  }

  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(50, parseInt(req.query.limit as string) || 12);
  const skip = (page - 1) * limit;

  const andClauses: Prisma.ReferralPostWhereInput[] = [];

  if (search) {
    // Split search into individual terms for more lenient matching
    // e.g. "Software Developer" -> "Software" and "Developer" can match separately
    const terms = search.split(/\s+/).filter((t) => t.length > 2);
    if (terms.length > 0) {
      const orClauses: Prisma.ReferralPostWhereInput[] = [];
      terms.forEach((term) => {
        orClauses.push(
          { jobRole: { contains: term, mode: 'insensitive' } },
          { description: { contains: term, mode: 'insensitive' } },
          { department: { contains: term, mode: 'insensitive' } },
          {
            employee: {
              company: { name: { contains: term, mode: 'insensitive' } },
            },
          },
        );
      });
      andClauses.push({ OR: orClauses });
    } else {
      // Fallback if terms are too short
      andClauses.push({
        OR: [
          { jobRole: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { department: { contains: search, mode: 'insensitive' } },
        ],
      });
    }
  }

  if (skills.length > 0) {
    andClauses.push({ skills: { hasSome: skills } });
  }

  const where: Prisma.ReferralPostWhereInput = {
    status: ReferralStatus.ACTIVE,
    ...(companyId && { employee: { companyId } }),
    ...(experienceLevel && {
      experienceLevel: { equals: experienceLevel },
    }),
    ...(remoteType &&
      Object.values(RemoteType).includes(remoteType as RemoteType) && {
        remoteType: remoteType as RemoteType,
      }),
    ...(andClauses.length > 0 && { AND: andClauses }),
  };

  const [referrals, total] = await Promise.all([
    prisma.referralPost.findMany({
      where,
      include: referralInclude,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.referralPost.count({ where }),
  ]);

  res.json({
    referrals,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
      hasMore: skip + referrals.length < total,
    },
  });
};

export const getReferralById = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  try {
    const referral = await prisma.referralPost.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
      include: referralInclude,
    });
    res.json(referral);
  } catch {
    res.status(404).json({ error: 'Referral not found' });
  }
};

export const getMyReferrals = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const referrals = await prisma.referralPost.findMany({
      where: { employeeId: userId },
      include: {
        appointments: {
          include: {
            seeker: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        },
        savedBy: { select: { id: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(referrals);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch my referrals' });
  }
};

export const updateReferral = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const id =
      typeof req.params.id === 'string' ? req.params.id : req.params.id?.[0];
    if (!id) return res.status(400).json({ error: 'Invalid referral id' });

    const existing = await prisma.referralPost.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Referral not found' });
    if (existing.employeeId !== userId)
      return res.status(403).json({ error: 'Not allowed' });

    const {
      jobRole,
      department,
      experienceLevel,
      description,
      referralPrice,
      status,
      skills,
      remoteType,
      salaryMin,
      salaryMax,
    } = req.body;

    const data: Prisma.ReferralPostUpdateInput = {};
    if (jobRole !== undefined) data.jobRole = String(jobRole);
    if (department !== undefined) data.department = department;
    if (experienceLevel !== undefined)
      data.experienceLevel = String(experienceLevel);
    if (description !== undefined) data.description = String(description);
    if (referralPrice !== undefined) data.referralPrice = Number(referralPrice);
    if (status !== undefined && Object.values(ReferralStatus).includes(status))
      data.status = status;
    if (skills !== undefined)
      data.skills = Array.isArray(skills) ? skills.map(String) : [];
    if (
      remoteType !== undefined &&
      Object.values(RemoteType).includes(remoteType)
    )
      data.remoteType = remoteType;
    if (salaryMin !== undefined)
      data.salaryMin = salaryMin ? Number(salaryMin) : null;
    if (salaryMax !== undefined)
      data.salaryMax = salaryMax ? Number(salaryMax) : null;

    const referral = await prisma.referralPost.update({
      where: { id },
      data,
      include: referralInclude,
    });
    res.json(referral);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update referral' });
  }
};

export const saveReferral = async (req: AuthRequest, res: Response) => {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  const id = req.params.id as string;
  try {
    const saved = await prisma.savedReferral.create({
      data: { userId, referralPostId: id },
    });
    res.status(201).json(saved);
  } catch {
    res.status(400).json({ error: 'Already saved or referral not found' });
  }
};

export const unsaveReferral = async (req: AuthRequest, res: Response) => {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  const id = req.params.id as string;
  try {
    await prisma.savedReferral.delete({
      where: { userId_referralPostId: { userId, referralPostId: id } },
    });
    res.json({ success: true });
  } catch {
    res.status(404).json({ error: 'Not saved' });
  }
};

export const getSavedReferrals = async (req: AuthRequest, res: Response) => {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  const saved = await prisma.savedReferral.findMany({
    where: { userId },
    include: { referralPost: { include: referralInclude } },
    orderBy: { createdAt: 'desc' },
  });
  res.json(saved.map((s) => s.referralPost));
};
