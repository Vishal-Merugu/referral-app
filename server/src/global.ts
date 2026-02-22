import { Request } from 'express';

/**
 * Authenticated request: set by auth middleware.
 * Use this type in controllers so req.userId / req.userRole are typed.
 */
export interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
}
