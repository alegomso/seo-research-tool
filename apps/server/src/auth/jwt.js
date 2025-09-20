"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateSessionToken = exports.generateToken = exports.requireRole = exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
const env_js_1 = __importDefault(require("../config/env.js"));
const env = (0, env_js_1.default)();
const prisma = new client_1.PrismaClient();
async function authenticateToken(request, reply) {
    const authHeader = request.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    if (!token) {
        return reply.status(401).send({ error: 'Access token required' });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, env.JWT_SECRET);
        // Get user from database to ensure they still exist and get current role
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
            },
        });
        if (!user) {
            return reply.status(401).send({ error: 'User not found' });
        }
        request.user = user;
    }
    catch (error) {
        return reply.status(403).send({ error: 'Invalid token' });
    }
}
exports.authenticateToken = authenticateToken;
function requireRole(roles) {
    const requiredRoles = Array.isArray(roles) ? roles : [roles];
    return async (request, reply) => {
        if (!request.user) {
            return reply.status(401).send({ error: 'Authentication required' });
        }
        if (!requiredRoles.includes(request.user.role)) {
            return reply.status(403).send({
                error: 'Insufficient permissions',
                required: requiredRoles,
                current: request.user.role
            });
        }
    };
}
exports.requireRole = requireRole;
function generateToken(userId) {
    return jsonwebtoken_1.default.sign({ userId }, env.JWT_SECRET, { expiresIn: '24h' });
}
exports.generateToken = generateToken;
async function validateSessionToken(sessionToken) {
    try {
        // For NextAuth.js integration, we need to validate session tokens from the database
        const session = await prisma.session.findUnique({
            where: { sessionToken },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                        role: true,
                    },
                },
            },
        });
        if (!session || session.expires < new Date()) {
            return null;
        }
        return session.user;
    }
    catch (error) {
        console.error('Session validation error:', error);
        return null;
    }
}
exports.validateSessionToken = validateSessionToken;
