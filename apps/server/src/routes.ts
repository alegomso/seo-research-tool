import type { FastifyInstance } from 'fastify';

export async function setupRoutes(fastify: FastifyInstance) {
  // Health check route
  fastify.get('/health', async () => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    };
  });

  // API routes will be registered here
  await fastify.register(async function (fastify) {
    // All API routes will be prefixed with /api
    await fastify.register(import('./api/health'), { prefix: '/api' });
    // TODO: Add other API routes
    // await fastify.register(import('./api/keyword'), { prefix: '/api' });
    // await fastify.register(import('./api/serp'), { prefix: '/api' });
    // await fastify.register(import('./api/backlinks'), { prefix: '/api' });
    // await fastify.register(import('./api/onpage'), { prefix: '/api' });
  });
}