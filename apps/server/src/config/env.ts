import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  MONGODB_URI: z.string().default('mongodb://localhost:27017/grandstay_hotel_erp'),
  JWT_SECRET: z.string().min(16).default('development-secret-change-me'),
  JWT_EXPIRES_IN: z.string().default('8h'),
  PORT: z.coerce.number().default(5000),
  CLIENT_ORIGIN: z.string().default('http://localhost:5173'),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development')
});

export const env = schema.parse(process.env);
