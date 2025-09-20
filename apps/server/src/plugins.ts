import type { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import jwt from '@fastify/jwt';
import cookie from '@fastify/cookie';
import { env } from '@/config/env';

export async function setupPlugins(fastify: FastifyInstance) {
  // Security
  await fastify.register(helmet, {
    contentSecurityPolicy: false, // Disable for development
  });

  // CORS
  await fastify.register(cors, {
    origin: [
      'http://localhost:3000',
      'https://localhost:3000',
      env.NEXTAUTH_URL,
    ],
    credentials: true,
  });

  // Rate limiting
  await fastify.register(rateLimit, {
    max: parseInt(env.RATE_LIMIT_MAX),
    timeWindow: parseInt(env.RATE_LIMIT_WINDOW),
  });

  // JWT
  await fastify.register(jwt, {
    secret: env.JWT_SECRET,
    cookie: {
      cookieName: 'token',
      signed: false,
    },
  });

  // Cookie support
  await fastify.register(cookie, {
    secret: env.JWT_SECRET,
  });

  // API Documentation (development only)
  if (env.NODE_ENV === 'development') {
    await fastify.register(swagger, {
      swagger: {
        info: {
          title: 'SEO Portal API',
          description: 'Internal SEO Research Portal API',
          version: '1.0.0',
        },
        host: `${env.HOST}:${env.PORT}`,
        schemes: ['http'],
        consumes: ['application/json'],
        produces: ['application/json'],
      },
    });

    await fastify.register(swaggerUi, {
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