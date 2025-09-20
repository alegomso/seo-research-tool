import { FastifyRequest, FastifyReply } from 'fastify';
import { UserRole } from '@prisma/client';
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
export declare function authenticateToken(request: FastifyRequest, reply: FastifyReply): Promise<void>;
export declare function requireRole(roles: UserRole | UserRole[]): (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
export declare function generateToken(userId: string): string;
export declare function validateSessionToken(sessionToken: string): Promise<AuthUser | null>;
//# sourceMappingURL=jwt.d.ts.map