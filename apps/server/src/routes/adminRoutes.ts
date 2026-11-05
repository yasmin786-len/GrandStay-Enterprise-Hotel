import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { Role } from '../models/Role.js';
import { User } from '../models/User.js';
import { Property } from '../models/Property.js';
import { authorize } from '../middleware/auth.js';
import { asyncHandler, ApiError, sendPage } from '../utils/api.js';
import { validateBody } from '../middleware/validate.js';
import { PERMISSIONS } from '../constants/permissions.js';
import { audit } from '../services/audit.js';
import { scopeFilter } from '../services/scope.js';

const router = Router();
const objectId = z.string().regex(/^[a-f\d]{24}$/i);
const roleSchema = z.object({ name: z.string().min(2), code: z.string().min(2), level: z.union([z.literal(1),z.literal(2),z.literal(3)]), scope: z.enum(['corporate','property','department','self']), permissions: z.array(z.enum(PERMISSIONS)).min(1), description: z.string().optional(), isSystem: z.boolean().default(false) });
const userSchema = z.object({ name: z.string().min(2), email: z.string().email(), password: z.string().min(8), roleId: objectId, propertyIds: z.array(objectId).default([]), departmentIds: z.array(z.string()).default([]), active: z.boolean().default(true) });

router.get('/roles', authorize('roles.read'), asyncHandler(async (_req, res) => res.json({ data: await Role.find().sort({ level: 1, name: 1 }).lean() })));
router.post('/roles', authorize('roles.manage'), validateBody(roleSchema), asyncHandler(async (req, res) => {
  const role = await Role.create({ ...req.body, createdBy: req.auth!.user._id });
  await audit(req, 'create', 'Role', String(role._id), undefined, role.toObject());
  res.status(201).json(role);
}));
router.put('/roles/:id', authorize('roles.manage'), validateBody(roleSchema.partial()), asyncHandler(async (req, res) => {
  const role = await Role.findById(req.params.id);
  if (!role) throw new ApiError(404, 'Role not found');
  const before = role.toObject(); Object.assign(role, req.body); await role.save();
  await audit(req, 'update', 'Role', String(role._id), before, role.toObject()); res.json(role);
}));

router.get('/users', authorize('users.read'), asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page ?? 1)); const limit = Math.min(100, Number(req.query.limit ?? 20));
  const filter = req.auth!.role.scope === 'corporate' ? {} : { propertyIds: { $in: req.auth!.user.propertyIds } };
  const [data,total] = await Promise.all([
    User.find(filter).populate('roleId').populate('propertyIds').sort({ createdAt: -1 }).skip((page-1)*limit).limit(limit).lean(),
    User.countDocuments(filter)
  ]); sendPage(res,data,total,page,limit);
}));
router.post('/users', authorize('users.manage'), validateBody(userSchema), asyncHandler(async (req, res) => {
  if (req.auth!.role.scope !== 'corporate') {
    const invalid = req.body.propertyIds.some((id: string) => !req.auth!.user.propertyIds.some(p => String(p) === id));
    if (invalid) throw new ApiError(403, 'Cannot assign users outside your properties');
  }
  const role = await Role.findById(req.body.roleId); if (!role) throw new ApiError(400, 'Role not found');
  const passwordHash = await bcrypt.hash(req.body.password, 12);
  const { password, ...rest } = req.body;
  const user = await User.create({ ...rest, passwordHash });
  await audit(req, 'create', 'User', String(user._id), undefined, { ...rest, passwordHash: '[REDACTED]' });
  res.status(201).json(await User.findById(user._id).populate('roleId').populate('propertyIds'));
}));
router.put('/users/:id', authorize('users.manage'), validateBody(userSchema.partial()), asyncHandler(async (req, res) => {
  const user = await User.findOne({ _id: req.params.id, ...(req.auth!.role.scope === 'corporate' ? {} : { propertyIds: { $in: req.auth!.user.propertyIds } }) }).select('+passwordHash');
  if (!user) throw new ApiError(404, 'User not found');
  const before = user.toObject(); const body = { ...req.body };
  if (body.password) { body.passwordHash = await bcrypt.hash(body.password, 12); delete body.password; }
  Object.assign(user, body); await user.save();
  await audit(req, 'update', 'User', String(user._id), { ...before, passwordHash: '[REDACTED]' }, { ...user.toObject(), passwordHash: '[REDACTED]' });
  res.json(await User.findById(user._id).populate('roleId').populate('propertyIds'));
}));

router.get('/permissions', authorize('roles.read'), (_req, res) => res.json({ data: PERMISSIONS }));
router.get('/properties/options', authorize('properties.read'), asyncHandler(async (req, res) => {
  const filter = req.auth!.role.scope === 'corporate' ? {} : { _id: { $in: req.auth!.user.propertyIds } };
  res.json({ data: await Property.find(filter).select('name code currency').lean() });
}));

export default router;
