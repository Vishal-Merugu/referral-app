import { Router, Request, Response } from 'express';
import { getPublicProfile } from '../controllers/authController';
import { asyncHandler } from '../utils/asyncHandler';
import prisma from '../utils/prisma';

const router = Router();

router.get('/:id/public', asyncHandler(getPublicProfile));

// GET /api/users/:id/available-slots?date=YYYY-MM-DD
router.get(
  '/:id/available-slots',
  asyncHandler(async (req: Request, res: Response) => {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;
    const { date } = req.query as { date?: string };

    if (!date || !id) {
      return res
        .status(400)
        .json({ error: 'date query parameter required (YYYY-MM-DD)' });
    }

    // Find day of week for the date string
    // Note: assuming date is YYYY-MM-DD
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      return res.status(400).json({ error: 'invalid date format' });
    }

    const dayOfWeek = dateObj.getUTCDay();

    // Find all regular slots for this user on this day
    const slots = await prisma.availabilitySlot.findMany({
      where: { userId: id, dayOfWeek },
    });

    if (slots.length === 0) {
      return res.json({ date, slots: [], timezone: 'UTC' });
    }

    // Get timezone from the first slot (they should all essentially match)
    const timezone = slots[0].timezone;

    // Next, look for existing appointments on this date
    // We'll search for appointments that overlap with date
    const startOfDay = new Date(date);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const existingBookings = await prisma.appointment.findMany({
      where: {
        referralPost: { employeeId: id },
        scheduledAt: { gte: startOfDay, lte: endOfDay },
        status: { not: 'CANCELLED' },
      },
      select: { scheduledAt: true },
    });

    // Create blocks out of slots.
    // For simplicity, a slot e.g., "09:00" to "11:00" will generate 30-minute intervals.
    const availableIntervals: string[] = [];

    slots.forEach((slot: { startTime: string; endTime: string }) => {
      const [startH, startM] = slot.startTime.split(':').map(Number);
      const [endH, endM] = slot.endTime.split(':').map(Number);

      let currentMins = startH * 60 + startM;
      const endMins = endH * 60 + endM;

      while (currentMins + 30 <= endMins) {
        const h = Math.floor(currentMins / 60);
        const m = currentMins % 60;
        const timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
        availableIntervals.push(timeStr);
        currentMins += 30;
      }
    });

    // Filter out booked ones
    const bookedTimes = existingBookings.map((b) => {
      const hours = b.scheduledAt!.getUTCHours().toString().padStart(2, '0');
      const mins = b.scheduledAt!.getUTCMinutes().toString().padStart(2, '0');
      return `${hours}:${mins}`;
    });

    const finalSlots = availableIntervals.filter(
      (time) => !bookedTimes.includes(time),
    );

    res.json({ date, timezone, slots: finalSlots });
  }),
);

export default router;
