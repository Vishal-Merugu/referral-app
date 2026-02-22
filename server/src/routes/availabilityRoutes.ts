import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import prisma from '../utils/prisma';

const router = Router();

// GET /api/availability
// Get my own availability slots
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const slots = await prisma.availabilitySlot.findMany({
      where: { userId: req.userId },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });
    return res.json({ slots });
  } catch (err) {
    console.error('[Get availability]', err);
    return res.status(500).json({ error: 'Failed to fetch availability.' });
  }
});

// POST /api/availability
// Replace all my availability slots
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { slots, timezone } = req.body as {
      timezone?: string;
      slots: { dayOfWeek: number; startTime: string; endTime: string }[];
    };

    if (!slots || !Array.isArray(slots)) {
      return res.status(400).json({ error: 'Invalid slots array' });
    }

    const tz = timezone || 'UTC';

    // Transaction: delete old, insert new
    await prisma.$transaction([
      prisma.availabilitySlot.deleteMany({ where: { userId: req.userId } }),
      prisma.availabilitySlot.createMany({
        data: slots.map((s) => ({
          userId: req.userId!,
          dayOfWeek: s.dayOfWeek,
          startTime: s.startTime,
          endTime: s.endTime,
          timezone: tz,
        })),
      }),
    ]);

    const newSlots = await prisma.availabilitySlot.findMany({
      where: { userId: req.userId },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });

    return res.json({ slots: newSlots });
  } catch (err) {
    console.error('[Set availability]', err);
    return res.status(500).json({ error: 'Failed to update availability.' });
  }
});

export default router;
