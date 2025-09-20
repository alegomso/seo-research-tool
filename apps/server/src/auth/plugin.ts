import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { authenticateToken, validateSessionToken, AuthUser } from './jwt.js';

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    validateSession: (sessionToken: string) => Promise<AuthUser | null>;
  }
}

const authPlugin: FastifyPluginAsync = async (fastify) => {
  // Register authentication decorator
  fastify.decorate('authenticate', authenticateToken);
  fastify.decorate('validateSession', validateSessionToken);

  // Add authentication hook for protected routes
  fastify.addHook('onRequest', async (request, reply) => {
    // Skip authentication for public routes
    const publicRoutes = [
      '/health',
      '/docs',
      '/auth',
    ];

    const isPublicRoute = publicRoutes.some(route =>
      request.url.startsWith(route)
    );

    if (isPublicRoute) {
      return;
    }

    // Try JWT token first
    const authHeader = request.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      await authenticateToken(request, reply);
      return;
    }

    // Try session token (for NextAuth.js integration)
    const sessionToken = request.headers['x-session-token'] as string;
    if (sessionToken) {
      const user = await validateSessionToken(sessionToken);
      if (user) {
        request.user = user;
        return;
      }
    }

    // No valid authentication found
    return reply.status(401).send({
      error: 'Authentication required',
      message: 'Please provide a valid Bearer token or session token'
    });
  });
};

export default fp(authPlugin, {
  name: 'auth-plugin',
});