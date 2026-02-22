import { Router } from 'express';
import * as companyController from '../controllers/companyController';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.get('/', asyncHandler(companyController.listCompanies));
router.post('/', authenticate, asyncHandler(companyController.createCompany));

export default router;
