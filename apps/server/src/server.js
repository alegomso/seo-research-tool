"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const cors_1 = __importDefault(require("@fastify/cors"));
const client_1 = require("@prisma/client");
const plugin_js_1 = __importDefault(require("./auth/plugin.js"));
const index_js_1 = __importDefault(require("./routes/research/index.js"));
const index_js_2 = __importDefault(require("./integrations/dataforseo/index.js"));
const index_js_3 = __importDefault(require("./integrations/openai/index.js"));
const env_js_1 = __importDefault(require("./config/env.js"));
const env = (0, env_js_1.default)();
// Initialize services
const prisma = new client_1.PrismaClient();
const dataForSEOService = new index_js_2.default();
const aiService = new index_js_3.default();
// Create Fastify instance
const fastify = (0, fastify_1.default)({
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
// Register plugins and services
async function setupServer() {
    try {
        // Register CORS
        await fastify.register(cors_1.default, {
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
        await fastify.register(plugin_js_1.default);
        // Register API routes
        await fastify.register(index_js_1.default, { prefix: '/api/research' });
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
            }
            catch (error) {
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
    }
    catch (error) {
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
    }
    catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}
// Only start if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
    start();
}
exports.default = setupServer;
