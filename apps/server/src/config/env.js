"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEnvConfig = void 0;
const zod_1 = require("zod");
const envSchema = zod_1.z.object({
    // Server Configuration
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    PORT: zod_1.z.string().transform(Number).default(3001),
    HOST: zod_1.z.string().default('localhost'),
    // Database
    DATABASE_URL: zod_1.z.string(),
    // Redis
    REDIS_URL: zod_1.z.string(),
    // Authentication
    JWT_SECRET: zod_1.z.string(),
    NEXTAUTH_SECRET: zod_1.z.string(),
    NEXTAUTH_URL: zod_1.z.string().default('http://localhost:3000'),
    // OAuth
    GOOGLE_CLIENT_ID: zod_1.z.string().optional(),
    GOOGLE_CLIENT_SECRET: zod_1.z.string().optional(),
    // DataForSEO API
    DATAFORSEO_LOGIN: zod_1.z.string(),
    DATAFORSEO_PASSWORD: zod_1.z.string(),
    DATAFORSEO_BASE_URL: zod_1.z.string().default('https://api.dataforseo.com'),
    // OpenAI
    OPENAI_API_KEY: zod_1.z.string(),
    OPENAI_ORGANIZATION: zod_1.z.string().optional(),
    // Rate Limiting
    RATE_LIMIT_MAX: zod_1.z.string().transform(Number).default(100),
    RATE_LIMIT_WINDOW: zod_1.z.string().transform(Number).default(900000),
    // URLs
    API_BASE_URL: zod_1.z.string().default('http://localhost:3001'),
    WEB_BASE_URL: zod_1.z.string().default('http://localhost:3000'),
    // Cache TTL (in seconds)
    CACHE_TTL_SERP: zod_1.z.string().transform(Number).default(3600),
    CACHE_TTL_KEYWORDS: zod_1.z.string().transform(Number).default(86400),
    CACHE_TTL_BACKLINKS: zod_1.z.string().transform(Number).default(7200),
    // Worker Configuration
    WORKER_POLL_INTERVAL: zod_1.z.string().transform(Number).default(30000),
    WORKER_MAX_RETRIES: zod_1.z.string().transform(Number).default(3),
    // Logging
    LOG_LEVEL: zod_1.z.enum(['error', 'warn', 'info', 'debug']).default('info'),
    LOG_FORMAT: zod_1.z.enum(['json', 'dev']).default('json'),
});
let env;
function getEnvConfig() {
    if (env) {
        return env;
    }
    try {
        env = envSchema.parse(process.env);
        return env;
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            console.error('❌ Environment validation failed:');
            console.error(error.errors);
            process.exit(1);
        }
        throw error;
    }
}
exports.getEnvConfig = getEnvConfig;
exports.default = getEnvConfig;
