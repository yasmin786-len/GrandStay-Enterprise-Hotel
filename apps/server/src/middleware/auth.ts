import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { Role } from '../models/Role.js';
import { env } from '../config/env.js';
import { ApiError, asyncHandler } from '../utils/api.js';
import type { Permission } from '../constants/permissions.js';

interface TokenPayload { sub: string; }

export const authenticate = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.slice(7)
    : undefined;
  if (!token) throw new ApiError(401, 'Authentication required');

  let payload: TokenPayload;
  try {
    payload = jwt.verify(token, env.JWT_SECRET) as TokenPayload;
  } catch {
    throw new ApiError(401, 'Invalid or expired token');
  }

  const user = await User.findById(payload.sub).select('+passwordHash');
  if (!user || !user.active) throw new ApiError(401, 'User account is unavailable');
  const role = await Role.findById(user.roleId);
  if (!role) throw new ApiError(403, 'Role is not configured');
  req.auth = { user, role };
  next();
});

export const authorize = (...permissions: Permission[]) => (req: Request, _res: Response, next: NextFunction) => {
  const granted = req.auth?.role.permissions ?? [];
  const allowed = permissions.some(permission => granted.includes(permission));
  if (!allowed) return next(new ApiError(403, `Missing permission: ${permissions.join(' or ')}`));
  next();
};
