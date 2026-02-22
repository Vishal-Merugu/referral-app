import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import prisma from '../utils/prisma';
import type { AuthRequest } from '../global';
import { Response, Request } from 'express';

const router = Router();

router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const {
      category,
      companyId,
      page = '1',
      limit = '12',
    } = req.query as Record<string, string>;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = {
      ...(category && { category }),
      ...(companyId && { companyId }),
    };
    const [items, total] = await Promise.all([
      prisma.resource.findMany({
        where,
        include: {
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
            },
          },
          company: { select: { id: true, name: true, logoUrl: true } },
        },
        orderBy: { upvotes: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.resource.count({ where }),
    ]);
    res.json({
      resources: items,
      total,
      pages: Math.ceil(total / parseInt(limit)),
    });
  }),
);

router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const resource = await prisma.resource.findUnique({
      where: { id: req.params.id },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            headline: true,
          },
        },
        company: true,
      },
    });
    if (!resource) return res.status(404).json({ error: 'Not found' });
    res.json(resource);
  }),
);

router.post(
  '/',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { title, content, category, companyId } = req.body;
    if (!title || !content || !category)
      return res.status(400).json({ error: 'Missing fields' });
    const resource = await prisma.resource.create({
      data: {
        authorId: req.userId!,
        title,
        content,
        category,
        companyId: companyId || null,
      },
    });
    res.status(201).json(resource);
  }),
);

router.post(
  '/:id/upvote',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const resource = await prisma.resource.update({
      where: { id: req.params.id },
      data: { upvotes: { increment: 1 } },
    });
    res.json({ upvotes: resource.upvotes });
  }),
);

export default router;
