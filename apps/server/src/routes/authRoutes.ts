import { Router } from 'express';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { z } from 'zod';
import { User } from '../models/User.js';
import { Role } from '../models/Role.js';
import { Property } from '../models/Property.js';
import { env } from '../config/env.js';
import { asyncHandler, ApiError } from '../utils/api.js';
import { validateBody } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
const loginSchema = z.object({ email: z.string().email(), password: z.string().min(6) });

router.post('/login', validateBody(loginSchema), asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email.toLowerCase() }).select('+passwordHash');
  if (!user || !user.active || !(await user.comparePassword(req.body.password))) throw new ApiError(401, 'Invalid email or password');
  const role = await Role.findById(user.roleId);
  if (!role) throw new ApiError(403, 'Role is not configured');
  user.lastLoginAt = new Date();
  await user.save();
  const token = jwt.sign({ sub: String(user._id) }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'] });
  const safeUser = user.toObject() as Record<string, unknown>;
  delete safeUser.passwordHash;
  const properties = await Property.find({ _id: { $in: user.propertyIds } }).select('name code currency').lean();
  res.json({ token, user: { ...safeUser, role, properties } });
}));

router.get('/me', authenticate, asyncHandler(async (req, res) => {
  const safeUser = req.auth!.user.toObject() as Record<string, unknown>;
  delete safeUser.passwordHash;
  const properties = await Property.find({ _id: { $in: req.auth!.user.propertyIds } }).select('name code currency').lean();
  res.json({ ...safeUser, role: req.auth!.role, properties });
}));

export default router;
