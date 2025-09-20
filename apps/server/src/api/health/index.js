"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
async function healthRoutes(fastify) {
    fastify.get('/health', {
        schema: {
            description: 'Health check endpoint',
            response: {
                200: {
                    type: 'object',
                    properties: {
                        status: { type: 'string' },
                        timestamp: { type: 'string' },
                        version: { type: 'string' },
                        services: {
                            type: 'object',
                            properties: {
                                database: { type: 'string' },
                                redis: { type: 'string' },
                                dataforseo: { type: 'string' },
                            },
                        },
                    },
                },
            },
        },
    }, async () => {
        // TODO: Add actual health checks for services
        return {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            services: {
                database: 'connected',
                redis: 'connected',
                dataforseo: 'available',
            },
        };
    });
}
exports.default = healthRoutes;
