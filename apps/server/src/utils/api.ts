import type { Request, Response, NextFunction } from 'express';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) => Promise.resolve(fn(req, res, next)).catch(next);

export function sendPage(res: Response, data: unknown[], total: number, page: number, limit: number) {
  res.json({ data, meta: { total, page, limit, pages: Math.ceil(total / limit) } });
}
