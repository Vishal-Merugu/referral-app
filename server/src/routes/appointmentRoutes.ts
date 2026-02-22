import { Router } from 'express';
import * as appointmentController from '../controllers/appointmentController';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.post('/', authenticate, asyncHandler(appointmentController.createAppointment));
router.get('/my', authenticate, asyncHandler(appointmentController.getMyAppointments));
router.patch(
  '/:id',
  authenticate,
  asyncHandler(appointmentController.updateAppointmentStatus),
);

export default router;
