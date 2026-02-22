import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  createReferral,
  getReferrals,
  getReferralById,
  getMyReferrals,
  updateReferral,
  saveReferral,
  unsaveReferral,
  getSavedReferrals,
} from '../controllers/referralController';

const router = Router();

router.get('/', getReferrals);
router.get('/my', authenticate, getMyReferrals);
router.get('/saved', authenticate, getSavedReferrals);
router.get('/:id', getReferralById);
router.post('/', authenticate, createReferral);
router.patch('/:id', authenticate, updateReferral);
router.post('/:id/save', authenticate, saveReferral);
router.delete('/:id/save', authenticate, unsaveReferral);

export default router;
