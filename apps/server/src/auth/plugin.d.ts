import { AuthUser } from './jwt.js';
declare module 'fastify' {
    interface FastifyInstance {
        authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
        validateSession: (sessionToken: string) => Promise<AuthUser | null>;
    }
}
declare const _default: any;
export default _default;
//# sourceMappingURL=plugin.d.ts.map