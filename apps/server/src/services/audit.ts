import type { Request } from 'express';
import { AuditLog } from '../models/AuditLog.js';

export async function audit(req: Request, action: string, entity: string, entityId?: string, before?: unknown, after?: unknown, reason?: string) {
  if (!req.auth) return;
  await AuditLog.create({
    propertyId: (after as Record<string, unknown> | undefined)?.propertyId ?? (before as Record<string, unknown> | undefined)?.propertyId,
    userId: req.auth.user._id,
    action,
    entity,
    entityId,
    before,
    after,
    reason,
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
}
