import Fastify from 'fastify';
import cors from '@fastify/cors';
import { PrismaClient } from '@prisma/client';
import authPlugin from './auth/plugin.js';
import researchRoutes from './routes/research/index.js';
import DataForSEOService from './integrations/dataforseo/index.js';
import AIService from './integrations/openai/index.js';
import getEnvConfig from './config/env.js';

const env = getEnvConfig();

// Initialize services
const prisma = new PrismaClient();
const dataForSEOService = new DataForSEOService();
const aiService = new AIService();

// Create Fastify instance
const fastify = Fastify({
  logger: {
    level: env.LOG_LEVEL,
    ...(env.NODE_ENV === 'development' && {
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      },
    }),
  },
});

// Add type declarations for services
declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
    dataForSEO: DataForSEOService;
    openAI: AIService;
  }
}

// Register plugins and services
async function setupServer() {
  try {
    // Register CORS
    await fastify.register(cors, {
      origin: [
        'http://localhost:3000',
        'http://localhost:3001',
        env.FRONTEND_URL
      ].filter(Boolean),
      credentials: true,
    });

    // Decorate fastify with services
    fastify.decorate('prisma', prisma);
    fastify.decorate('dataForSEO', dataForSEOService);
    fastify.decorate('openAI', aiService);

    // Register authentication plugin
    await fastify.register(authPlugin);

    // Register API routes
    await fastify.register(researchRoutes, { prefix: '/api/research' });

    // Health check endpoint
    fastify.get('/health', async (request, reply) => {
      try {
        // Test database connection
        await prisma.user.findFirst();

        // Test external services
        const dataForSEOHealth = await dataForSEOService.validateConnection();
        const openAIHealth = await aiService.testConnection();

        return reply.send({
          status: 'healthy',
          timestamp: new Date().toISOString(),
          services: {
            database: 'connected',
            dataForSEO: dataForSEOHealth.isValid ? 'connected' : 'disconnected',
            openAI: openAIHealth ? 'connected' : 'disconnected',
          },
          version: process.env.npm_package_version || '1.0.0'
        });
      } catch (error) {
        return reply.status(503).send({
          status: 'unhealthy',
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        });
      }
    });

    // Root endpoint
    fastify.get('/', async (request, reply) => {
      return reply.send({
        name: 'SEO Research Portal API',
        version: process.env.npm_package_version || '1.0.0',
        status: 'running',
        endpoints: {
          health: '/health',
          research: '/api/research',
          auth: '/auth'
        }
      });
    });

    // Global error handler
    fastify.setErrorHandler((error, request, reply) => {
      fastify.log.error(error);

      // Handle validation errors
      if (error.validation) {
        return reply.status(400).send({
          error: 'Validation Error',
          message: error.message,
          details: error.validation
        });
      }

      // Handle authentication errors
      if (error.statusCode === 401) {
        return reply.status(401).send({
          error: 'Authentication Required',
          message: error.message
        });
      }

      // Handle authorization errors
      if (error.statusCode === 403) {
        return reply.status(403).send({
          error: 'Forbidden',
          message: error.message
        });
      }

      // Generic error response
      const statusCode = error.statusCode || 500;
      return reply.status(statusCode).send({
        error: statusCode === 500 ? 'Internal Server Error' : error.name,
        message: env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
      });
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      fastify.log.info('Received SIGTERM, shutting down gracefully');
      await fastify.close();
      await prisma.$disconnect();
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      fastify.log.info('Received SIGINT, shutting down gracefully');
      await fastify.close();
      await prisma.$disconnect();
      process.exit(0);
    });

    return fastify;

  } catch (error) {
    console.error('Failed to setup server:', error);
    process.exit(1);
  }
}

// Start server
async function start() {
  try {
    const server = await setupServer();

    const address = await server.listen({
      port: env.PORT,
      host: env.HOST
    });

    server.log.info(`🚀 Server running at ${address}`);
    server.log.info(`📊 Environment: ${env.NODE_ENV}`);
    server.log.info(`🗄️ Database: ${env.DATABASE_URL.split('@')[1]?.split('/')[0] || 'Connected'}`);

    // Log service status
    const dataForSEOStatus = await dataForSEOService.validateConnection();
    const openAIStatus = await aiService.testConnection();

    server.log.info(`🔍 DataForSEO: ${dataForSEOStatus.isValid ? 'Connected' : 'Disconnected'}`);
    server.log.info(`🤖 OpenAI: ${openAIStatus ? 'Connected' : 'Disconnected'}`);

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Only start if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  start();
}

export default setupServer;