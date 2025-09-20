import { z } from 'zod';

const envSchema = z.object({
  // Server Configuration
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default(3001),
  HOST: z.string().default('localhost'),

  // Database
  DATABASE_URL: z.string(),

  // Redis
  REDIS_URL: z.string(),

  // Authentication
  JWT_SECRET: z.string(),
  NEXTAUTH_SECRET: z.string(),
  NEXTAUTH_URL: z.string().default('http://localhost:3000'),

  // OAuth
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  // DataForSEO API
  DATAFORSEO_LOGIN: z.string(),
  DATAFORSEO_PASSWORD: z.string(),
  DATAFORSEO_BASE_URL: z.string().default('https://api.dataforseo.com'),

  // OpenAI
  OPENAI_API_KEY: z.string(),
  OPENAI_ORGANIZATION: z.string().optional(),

  // Rate Limiting
  RATE_LIMIT_MAX: z.string().transform(Number).default(100),
  RATE_LIMIT_WINDOW: z.string().transform(Number).default(900000), // 15 minutes

  // URLs
  API_BASE_URL: z.string().default('http://localhost:3001'),
  WEB_BASE_URL: z.string().default('http://localhost:3000'),

  // Cache TTL (in seconds)
  CACHE_TTL_SERP: z.string().transform(Number).default(3600), // 1 hour
  CACHE_TTL_KEYWORDS: z.string().transform(Number).default(86400), // 24 hours
  CACHE_TTL_BACKLINKS: z.string().transform(Number).default(7200), // 2 hours

  // Worker Configuration
  WORKER_POLL_INTERVAL: z.string().transform(Number).default(30000), // 30 seconds
  WORKER_MAX_RETRIES: z.string().transform(Number).default(3),

  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  LOG_FORMAT: z.enum(['json', 'dev']).default('json'),
});

export type EnvConfig = z.infer<typeof envSchema>;

let env: EnvConfig;

export function getEnvConfig(): EnvConfig {
  if (env) {
    return env;
  }

  try {
    env = envSchema.parse(process.env);
    return env;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Environment validation failed:');
      console.error(error.errors);
      process.exit(1);
    }
    throw error;
  }
}

export default getEnvConfig;