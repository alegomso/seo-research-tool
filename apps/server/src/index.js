"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const env_1 = require("@/config/env");
const plugins_1 = require("./plugins");
const routes_1 = require("./routes");
const fastify = (0, fastify_1.default)({
    logger: {
        level: env_1.env.NODE_ENV === 'production' ? 'warn' : 'info',
    },
});
async function start() {
    try {
        // Setup plugins
        await (0, plugins_1.setupPlugins)(fastify);
        // Setup routes
        await (0, routes_1.setupRoutes)(fastify);
        // Start server
        await fastify.listen({
            port: parseInt(env_1.env.PORT),
            host: env_1.env.HOST
        });
        console.log(`🚀 Server running at http://${env_1.env.HOST}:${env_1.env.PORT}`);
    }
    catch (err) {
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
    }
    catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
});
start();
