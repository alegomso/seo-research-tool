"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupPlugins = void 0;
const cors_1 = __importDefault(require("@fastify/cors"));
const helmet_1 = __importDefault(require("@fastify/helmet"));
const rate_limit_1 = __importDefault(require("@fastify/rate-limit"));
const swagger_1 = __importDefault(require("@fastify/swagger"));
const swagger_ui_1 = __importDefault(require("@fastify/swagger-ui"));
const jwt_1 = __importDefault(require("@fastify/jwt"));
const cookie_1 = __importDefault(require("@fastify/cookie"));
const env_1 = require("@/config/env");
async function setupPlugins(fastify) {
    // Security
    await fastify.register(helmet_1.default, {
        contentSecurityPolicy: false, // Disable for development
    });
    // CORS
    await fastify.register(cors_1.default, {
        origin: [
            'http://localhost:3000',
            'https://localhost:3000',
            env_1.env.NEXTAUTH_URL,
        ],
        credentials: true,
    });
    // Rate limiting
    await fastify.register(rate_limit_1.default, {
        max: parseInt(env_1.env.RATE_LIMIT_MAX),
        timeWindow: parseInt(env_1.env.RATE_LIMIT_WINDOW),
    });
    // JWT
    await fastify.register(jwt_1.default, {
        secret: env_1.env.JWT_SECRET,
        cookie: {
            cookieName: 'token',
            signed: false,
        },
    });
    // Cookie support
    await fastify.register(cookie_1.default, {
        secret: env_1.env.JWT_SECRET,
    });
    // API Documentation (development only)
    if (env_1.env.NODE_ENV === 'development') {
        await fastify.register(swagger_1.default, {
            swagger: {
                info: {
                    title: 'SEO Portal API',
                    description: 'Internal SEO Research Portal API',
                    version: '1.0.0',
                },
                host: `${env_1.env.HOST}:${env_1.env.PORT}`,
                schemes: ['http'],
                consumes: ['application/json'],
                produces: ['application/json'],
            },
        });
        await fastify.register(swagger_ui_1.default, {
            routePrefix: '/docs',
            uiConfig: {
                docExpansion: 'full',
                deepLinking: false,
            },
            staticCSP: true,
            transformSpecificationClone: true,
        });
    }
}
exports.setupPlugins = setupPlugins;
