import type { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/api.js';

export function notFound(req: Request, _res: Response, next: NextFunction) {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction) {
  const err = error as { status?: number; message?: string; code?: number; keyValue?: unknown; errors?: unknown };
  if (err.code === 11000) return res.status(409).json({ message: 'A record with the same unique value already exists', details: err.keyValue });
  const status = error instanceof ApiError ? error.status : 500;
  res.status(status).json({
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV !== 'production' && status === 500 ? { details: err.errors ?? String(error) } : {})
  });
}
