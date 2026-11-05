import { Router, type Request } from 'express';
import type { Model } from 'mongoose';
import { authorize } from '../middleware/auth.js';
import { asyncHandler, ApiError, sendPage } from '../utils/api.js';
import { scopeFilter, assertCreateScope, type ScopeConfig } from '../services/scope.js';
import { audit } from '../services/audit.js';
import { escapeRegex } from '../utils/escapeRegex.js';
import type { Permission } from '../constants/permissions.js';
import type { ZodType } from 'zod';
import { validateBody } from '../middleware/validate.js';

interface CrudConfig {
  name: string;
  model: Model<any>;
  readPermission: Permission;
  managePermission: Permission;
  scope?: ScopeConfig;
  searchFields?: string[];
  populate?: string[];
  createSchema?: ZodType;
  updateSchema?: ZodType;
  beforeCreate?: (req: Request, body: Record<string, any>) => Promise<void> | void;
  afterCreate?: (req: Request, doc: any) => Promise<void> | void;
  beforeUpdate?: (req: Request, before: any, body: Record<string, any>) => Promise<void> | void;
}

export function createCrudRouter(config: CrudConfig) {
  const router = Router();

  router.get('/', authorize(config.readPermission), asyncHandler(async (req, res) => {
    const page = Math.max(1, Number(req.query.page ?? 1));
    const limit = Math.min(100, Math.max(1, Number(req.query.limit ?? 20)));
    const filter: Record<string, any> = { ...scopeFilter(req, config.scope) };
    const search = String(req.query.search ?? '').trim();
    if (search && config.searchFields?.length) {
      filter.$or = config.searchFields.map(field => ({ [field]: { $regex: escapeRegex(search), $options: 'i' } }));
    }
    if (req.query.status) filter.status = req.query.status;
    if (req.query.propertyId && req.auth!.role.scope === 'corporate') filter.propertyId = req.query.propertyId;

    let query = config.model.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit);
    for (const field of config.populate ?? []) query = query.populate(field);
    const [data, total] = await Promise.all([query.lean(), config.model.countDocuments(filter)]);
    sendPage(res, data, total, page, limit);
  }));

  router.get('/:id', authorize(config.readPermission), asyncHandler(async (req, res) => {
    let query = config.model.findOne({ _id: req.params.id, ...scopeFilter(req, config.scope) });
    for (const field of config.populate ?? []) query = query.populate(field);
    const doc = await query.lean();
    if (!doc) throw new ApiError(404, `${config.name} not found`);
    res.json(doc);
  }));

  const createHandlers: any[] = [authorize(config.managePermission)];
  if (config.createSchema) createHandlers.push(validateBody(config.createSchema));
  createHandlers.push(asyncHandler(async (req, res) => {
    const body = { ...req.body };
    assertCreateScope(req, body, config.scope);
    await config.beforeCreate?.(req, body);
    const doc = await config.model.create(body);
    await config.afterCreate?.(req, doc);
    await audit(req, 'create', config.name, String(doc._id), undefined, doc.toObject());
    res.status(201).json(doc);
  }));
  router.post('/', ...createHandlers);

  const updateHandlers: any[] = [authorize(config.managePermission)];
  if (config.updateSchema) updateHandlers.push(validateBody(config.updateSchema));
  updateHandlers.push(asyncHandler(async (req, res) => {
    const filter = { _id: req.params.id, ...scopeFilter(req, config.scope) };
    const doc = await config.model.findOne(filter);
    if (!doc) throw new ApiError(404, `${config.name} not found`);
    const before = doc.toObject();
    const body = { ...req.body };
    delete body._id;
    delete body.createdAt;
    delete body.updatedAt;
    if (body.propertyId || body.departmentId) assertCreateScope(req, body, config.scope);
    await config.beforeUpdate?.(req, before, body);
    Object.assign(doc, body);
    await doc.save();
    await audit(req, 'update', config.name, String(doc._id), before, doc.toObject());
    res.json(doc);
  }));
  router.put('/:id', ...updateHandlers);

  router.delete('/:id', authorize(config.managePermission), asyncHandler(async (req, res) => {
    const doc = await config.model.findOneAndDelete({ _id: req.params.id, ...scopeFilter(req, config.scope) });
    if (!doc) throw new ApiError(404, `${config.name} not found`);
    await audit(req, 'delete', config.name, String(doc._id), doc.toObject(), undefined, String(req.body?.reason ?? ''));
    res.status(204).end();
  }));

  return router;
}
