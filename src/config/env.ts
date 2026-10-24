import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(8000),
  HOST: z.string().default('0.0.0.0'),
  CORS_ORIGIN: z.string().default('*'),
  RATE_LIMIT_MAX: z.coerce.number().default(1000),
  RATE_LIMIT_TIME_WINDOW: z.coerce.number().default(60000),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  ROGERS_URL: z.string().default('http://localhost:8001'),
  STARK_URL: z.string().default('http://localhost:8002'),
  JARVIS_URL: z.string().default('http://localhost:8003'),
  INTERNAL_SERVICE_SECRET: z.string().default('assessverse-internal-super-secret-key-32char'),
  JWT_SECRET: z.string().default('assessverse-jwt-secret-key-very-long-and-secure'),
});

export type EnvConfig = z.infer<typeof envSchema>;

export const config: EnvConfig = envSchema.parse(process.env);
