"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupRoutes = void 0;
async function setupRoutes(fastify) {
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
        await fastify.register(Promise.resolve().then(() => __importStar(require('./api/health'))), { prefix: '/api' });
        // TODO: Add other API routes
        // await fastify.register(import('./api/keyword'), { prefix: '/api' });
        // await fastify.register(import('./api/serp'), { prefix: '/api' });
        // await fastify.register(import('./api/backlinks'), { prefix: '/api' });
        // await fastify.register(import('./api/onpage'), { prefix: '/api' });
    });
}
exports.setupRoutes = setupRoutes;
