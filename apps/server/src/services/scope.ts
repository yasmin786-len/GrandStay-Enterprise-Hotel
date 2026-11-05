import type { Request } from 'express';
import { ApiError } from '../utils/api.js';

export interface ScopeConfig {
  propertyField?: string;
  departmentField?: string;
  ownerField?: string;
}

export function scopeFilter(req: Request, config: ScopeConfig = {}) {
  const auth = req.auth!;
  const propertyField = config.propertyField ?? 'propertyId';
  const filter: Record<string, unknown> = {};

  if (auth.role.scope !== 'corporate' && propertyField) {
    filter[propertyField] = { $in: auth.user.propertyIds };
  }
  if (auth.role.scope === 'department' && config.departmentField && auth.user.departmentIds.length) {
    filter[config.departmentField] = { $in: auth.user.departmentIds };
  }
  if (auth.role.scope === 'self' && config.ownerField) {
    filter[config.ownerField] = auth.user._id;
  }
  return filter;
}

export function assertCreateScope(req: Request, body: Record<string, unknown>, config: ScopeConfig = {}) {
  const auth = req.auth!;
  if (auth.role.scope === 'corporate') return;
  const propertyField = config.propertyField ?? 'propertyId';
  const requestedProperty = String(body[propertyField] ?? auth.user.propertyIds[0] ?? '');
  if (!requestedProperty || !auth.user.propertyIds.some(id => String(id) === requestedProperty)) {
    throw new ApiError(403, 'You cannot create records for this property');
  }
  body[propertyField] = requestedProperty;

  if (auth.role.scope === 'department' && config.departmentField) {
    const requestedDepartment = String(body[config.departmentField] ?? auth.user.departmentIds[0] ?? '');
    if (!requestedDepartment || !auth.user.departmentIds.includes(requestedDepartment)) {
      throw new ApiError(403, 'You cannot create records for this department');
    }
    body[config.departmentField] = requestedDepartment;
  }
  if (auth.role.scope === 'self' && config.ownerField) body[config.ownerField] = auth.user._id;
}
