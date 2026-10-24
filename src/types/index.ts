export interface UserPayload {
  id: string;
  email: string;
  role: 'student' | 'professor' | 'admin' | 'superadmin';
  tenantId: string;
  iat?: number;
  exp?: number;
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: UserPayload;
    requestId: string;
  }
}
