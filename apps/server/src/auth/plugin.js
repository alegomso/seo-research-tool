"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_plugin_1 = __importDefault(require("fastify-plugin"));
const jwt_js_1 = require("./jwt.js");
const authPlugin = async (fastify) => {
    // Register authentication decorator
    fastify.decorate('authenticate', jwt_js_1.authenticateToken);
    fastify.decorate('validateSession', jwt_js_1.validateSessionToken);
    // Add authentication hook for protected routes
    fastify.addHook('onRequest', async (request, reply) => {
        // Skip authentication for public routes
        const publicRoutes = [
            '/health',
            '/docs',
            '/auth',
        ];
        const isPublicRoute = publicRoutes.some(route => request.url.startsWith(route));
        if (isPublicRoute) {
            return;
        }
        // Try JWT token first
        const authHeader = request.headers.authorization;
        if (authHeader?.startsWith('Bearer ')) {
            await (0, jwt_js_1.authenticateToken)(request, reply);
            return;
        }
        // Try session token (for NextAuth.js integration)
        const sessionToken = request.headers['x-session-token'];
        if (sessionToken) {
            const user = await (0, jwt_js_1.validateSessionToken)(sessionToken);
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
exports.default = (0, fastify_plugin_1.default)(authPlugin, {
    name: 'auth-plugin',
});
