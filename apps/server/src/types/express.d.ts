import type { HydratedDocument } from 'mongoose';
import type { IUser } from '../models/User.js';
import type { IRole } from '../models/Role.js';

declare global {
  namespace Express {
    interface Request {
      auth?: {
        user: HydratedDocument<IUser>;
        role: HydratedDocument<IRole>;
      };
    }
  }
}

export {};
