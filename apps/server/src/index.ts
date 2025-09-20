import Fastify from 'fastify';
import { env } from '@/config/env';
import { setupPlugins } from './plugins';
import { setupRoutes } from './routes';

const fastify = Fastify({
  logger: {
    level: env.NODE_ENV === 'production' ? 'warn' : 'info',
  },
});

async function start() {
  try {
    // Setup plugins
    await setupPlugins(fastify);

    // Setup routes
    await setupRoutes(fastify);

    // Start server
    await fastify.listen({
      port: parseInt(env.PORT),
      host: env.HOST
    });

    console.log(`🚀 Server running at http://${env.HOST}:${env.PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  try {
    await fastify.close();
    console.log('\n👋 Server closed gracefully');
    process.exit(0);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
});

start();