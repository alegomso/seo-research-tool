import jwt from 'jsonwebtoken';
import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient, UserRole } from '@prisma/client';
import getEnvConfig from '../config/env.js';

const env = getEnvConfig();
const prisma = new PrismaClient();

export interface AuthUser {
  id: string;
  email: string;
  name?: string | null;
  role: UserRole;
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthUser;
  }
}

export async function authenticateToken(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const authHeader = request.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return reply.status(401).send({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as any;

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
  } catch (error) {
    return reply.status(403).send({ error: 'Invalid token' });
  }
}

export function requireRole(roles: UserRole | UserRole[]) {
  const requiredRoles = Array.isArray(roles) ? roles : [roles];

  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
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

export function generateToken(userId: string): string {
  return jwt.sign(
    { userId },
    env.JWT_SECRET,
    { expiresIn: '24h' }
  );
}

export async function validateSessionToken(sessionToken: string): Promise<AuthUser | null> {
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
  } catch (error) {
    console.error('Session validation error:', error);
    return null;
  }
}