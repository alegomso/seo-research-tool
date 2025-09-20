/// <reference types="node" />
import { PrismaClient } from '@prisma/client';
import DataForSEOService from './integrations/dataforseo/index.js';
import AIService from './integrations/openai/index.js';
declare module 'fastify' {
    interface FastifyInstance {
        prisma: PrismaClient;
        dataForSEO: DataForSEOService;
        openAI: AIService;
    }
}
declare function setupServer(): Promise<import("fastify").FastifyInstance<import("http").Server<typeof import("http").IncomingMessage, typeof import("http").ServerResponse>, import("http").IncomingMessage, import("http").ServerResponse<import("http").IncomingMessage>, import("fastify").FastifyBaseLogger, import("fastify").FastifyTypeProviderDefault>>;
export default setupServer;
//# sourceMappingURL=server.d.ts.map