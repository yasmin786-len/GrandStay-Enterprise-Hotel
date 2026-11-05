import type { Request, Response, NextFunction } from 'express';
import type { ZodType } from 'zod';
import { ApiError } from '../utils/api.js';

export const validateBody = (schema: ZodType) => (req: Request, _res: Response, next: NextFunction) => {
  const result = schema.safeParse(req.body);
  if (!result.success) return next(new ApiError(400, result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ')));
  req.body = result.data;
  next();
};
